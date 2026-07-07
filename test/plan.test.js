import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPlan, compactStepSummary, planWorkspace } from "../src/commands/plan.js";
import { renderPlan } from "../src/render.js";
import { writeJson } from "../src/fsutil.js";

test("buildPlan creates a read-only action plan", () => {
  const plan = buildPlan({
    workspace: { path: "/tmp/work", name: "work" },
    trust: { state: "observed" },
    security: {
      enabled: true,
      summary: { total: 1, critical: 0, high: 1, moderate: 0, low: 0, info: 0 },
      topPackages: [{
        name: "lodash",
        scanner: "npm-audit",
        severity: "high",
        remediationPriority: { level: "high", score: 90, reasons: ["severity:high", "direct-dependency", "fix-available"] },
        directDependency: true,
        dependency: { ecosystem: "npm", manifest: "package.json", group: "dependencies", version: "^4.17.0" },
        fixAvailable: true,
        fixVersions: ["4.17.21"],
        advisories: [{ id: "GHSA-test", title: "Prototype Pollution", url: "https://example.test/advisory", severity: "high" }]
      }]
    }
  }, [{ code: "security-vulnerabilities", message: "high risk" }], [], {});

  assert.equal(plan.status, "review-required");
  assert.equal(plan.preflight.state, "review-required");
  assert.equal(plan.preflight.artifacts.planJson, ".aienvmp/plan.json");
  assert.equal(plan.preflight.commands.recordIntent, "aienvmp intent --actor agent:id --action planned-change --target dependency");
  assert.equal(plan.preflight.intentTargets[0].target, "dependency");
  assert.equal(plan.preflight.dependencyChangeProtocol.mode, "advisory");
  assert.equal(plan.preflight.quickstart.handoff, "aienvmp handoff --record --actor agent:id");
  assert.equal(plan.decision.mode, "review-first");
  assert.equal(plan.enforcement.mode, "advisory-by-default");
  assert.deepEqual(plan.enforcement.suggestedStrictScopes, ["security"]);
  assert.equal(plan.decision.canContinueProjectLocalWork, true);
  assert.deepEqual(plan.decision.warningCodes, ["security-vulnerabilities"]);
  assert.equal(plan.recommendedActions[0].id, "review-security-remediation");
  assert.equal(plan.remediationSteps[0].package, "lodash");
  assert.equal(plan.remediationSteps[0].remediationPriority.level, "high");
  assert.equal(plan.remediationSteps[0].directDependency, true);
  assert.equal(plan.remediationSteps[0].dependency.manifest, "package.json");
  assert.equal(plan.remediationSteps[0].fixVersions[0], "4.17.21");
  assert.equal(plan.remediationSteps[0].advisories[0].id, "GHSA-test");
  assert.match(renderPlan(plan), /read-only/);
  assert.match(renderPlan(plan), /Decision: review-first/);
  assert.match(renderPlan(plan), /Enforcement: advisory-by-default/);
  assert.match(renderPlan(plan), /lodash/);
  assert.match(renderPlan(plan), /declared in package\.json/);
  assert.match(renderPlan(plan), /priority high\/90/);
  assert.match(renderPlan(plan), /Remediation steps/);
  assert.match(renderPlan(plan), /Dependency protocol/);
  assert.match(renderPlan(plan), /Enforcement gate/);
  assert.match(renderPlan(plan), /never in default mode/);
  assert.match(renderPlan(plan), /dependency-change --target dependency/);
  assert.match(renderPlan(plan), /4\.17\.21/);
});

test("buildPlan creates environment steps for runtime and policy drift", () => {
  const plan = buildPlan({
    workspace: { path: "/tmp/work", name: "work" },
    trust: { state: "observed" },
    security: { enabled: false }
  }, [{
    code: "node-version-mismatch",
    message: ".nvmrc requests 20, but detected node is 24.0.0."
  }, {
    code: "mixed-node-lockfiles",
    message: "Multiple Node lockfiles detected: packageLock, pnpmLock."
  }], [], {});

  assert.deepEqual(plan.environmentSteps.map((step) => step.category), ["runtime", "package-manager"]);
  assert.match(plan.environmentSteps[0].steps.join(" "), /project-local/);
  assert.match(renderPlan(plan), /Environment steps/);
  assert.match(renderPlan(plan), /package-manager/);
});

test("compactStepSummary returns bounded AI-facing step summaries", () => {
  const summary = compactStepSummary({
    remediationSteps: [{
      package: "lodash",
      severity: "high",
      remediationPriority: { level: "high", score: 90, reasons: [] },
      fixVersions: ["4.17.21"],
      advisories: [{ id: "GHSA-test" }]
    }],
    environmentSteps: [{
      code: "node-version-mismatch",
      category: "runtime",
      summary: ".nvmrc requests 20, but detected node is 24.0.0."
    }]
  });

  assert.deepEqual(summary.remediation[0], {
    package: "lodash",
    severity: "high",
    priority: "high",
    score: 90,
    fixVersions: ["4.17.21"],
    advisoryIds: ["GHSA-test"]
  });
  assert.equal(summary.environment[0].code, "node-version-mismatch");
});

test("planWorkspace can write plan artifacts", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-plan-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {}
  });

  const originalLog = console.log;
  console.log = () => {};
  try {
    const plan = await planWorkspace({ dir, write: true, json: true });
    assert.equal(plan.recommendedActions[0].id, "continue-project-local");
    assert.equal(plan.preflight.state, "clear");
    assert.equal(plan.preflight.commands.handoff, "aienvmp handoff --record --actor agent:id");
    assert.equal(plan.decision.mode, "project-local-work");
    assert.deepEqual(plan.enforcement.suggestedStrictScopes, []);
  } finally {
    console.log = originalLog;
  }

  assert.match(await fs.readFile(path.join(dir, ".aienvmp", "plan.md"), "utf8"), /AI Environment Plan/);
  assert.match(await fs.readFile(path.join(dir, ".aienvmp", "plan.md"), "utf8"), /Dependency protocol/);
  const planJson = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "plan.json"), "utf8"));
  assert.equal(planJson.schemaVersion, 1);
  assert.equal(planJson.preflight.readOrder[0], ".aienvmp/status.json");
  assert.equal(planJson.decision.requiredCommands.handoff, "aienvmp handoff --record --actor agent:id");
});
