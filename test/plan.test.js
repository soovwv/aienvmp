import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPlan, planWorkspace } from "../src/commands/plan.js";
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
        fixAvailable: true,
        fixVersions: ["4.17.21"],
        advisories: [{ id: "GHSA-test", title: "Prototype Pollution", url: "https://example.test/advisory", severity: "high" }]
      }]
    }
  }, [{ code: "security-vulnerabilities", message: "high risk" }], [], {});

  assert.equal(plan.status, "review-required");
  assert.equal(plan.recommendedActions[0].id, "review-security-remediation");
  assert.equal(plan.remediationSteps[0].package, "lodash");
  assert.equal(plan.remediationSteps[0].fixVersions[0], "4.17.21");
  assert.equal(plan.remediationSteps[0].advisories[0].id, "GHSA-test");
  assert.match(renderPlan(plan), /read-only/);
  assert.match(renderPlan(plan), /lodash/);
  assert.match(renderPlan(plan), /Remediation steps/);
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
  } finally {
    console.log = originalLog;
  }

  assert.match(await fs.readFile(path.join(dir, ".aienvmp", "plan.md"), "utf8"), /AI Environment Plan/);
  assert.equal(JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "plan.json"), "utf8")).schemaVersion, 1);
});
