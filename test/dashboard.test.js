import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { dashWorkspace } from "../src/commands/dash.js";
import { writeJson } from "../src/fsutil.js";
import { renderDashboard } from "../src/render.js";

test("renderDashboard includes the audit summary surface", () => {
  const html = renderDashboard({
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { name: "sample", path: "/tmp/sample" },
    os: { platform: "linux", release: "test", arch: "x64", shell: "bash" },
    runtimes: { node: "24.0.0" },
    packageManagers: { npm: "11.0.0" },
    containers: {},
    projectHints: {},
    agentFiles: {},
    dependencySnapshot: {
      mode: "snapshot",
      enabled: true,
      manifests: ["package.json"],
      summary: { ecosystems: ["npm"], manifests: 1, packages: 1 },
      packages: [{ ecosystem: "npm", name: "express", version: "^4.18.0", manifest: "package.json", group: "dependencies" }]
    },
    security: {
      mode: "security",
      enabled: true,
      summary: { total: 1, critical: 0, high: 1, moderate: 0, low: 0, info: 0 },
      topPackages: [{
        name: "express",
        severity: "high",
        remediationPriority: { level: "high", score: 90, reasons: [] },
        fixAvailable: true,
        directDependency: true,
        dependency: { ecosystem: "npm", manifest: "package.json", group: "dependencies", version: "^4.18.0" }
      }]
    },
    recommendedActions: [{
      id: "review-security-remediation",
      priority: "high",
      category: "security",
      summary: "Review express before dependency changes.",
      command: "aienvmp context --json"
    }],
    planArtifacts: {
      markdown: ".aienvmp/plan.md",
      json: ".aienvmp/plan.json"
    },
    planRemediation: [{
      package: "express",
      severity: "high",
      remediationPriority: { level: "high", score: 90, reasons: [] },
      fixVersions: ["4.17.21"],
      fixAvailable: true,
      advisories: ["GHSA-test"],
      directDependency: true,
      dependency: { ecosystem: "npm", manifest: "package.json", group: "dependencies", version: "^4.18.0" }
    }],
    planEnvironment: [{
      code: "node-version-mismatch",
      category: "runtime",
      summary: ".nvmrc requests 20, but detected node is 24.0.0."
    }],
    ciReadiness: [{
      scope: "security",
      status: "pass",
      matchedWarningCodes: []
    }, {
      scope: "policy",
      status: "fail",
      matchedWarningCodes: ["node-version-mismatch"]
    }, {
      scope: "coordination",
      status: "pass",
      matchedWarningCodes: []
    }, {
      scope: "all",
      status: "fail",
      matchedWarningCodes: ["node-version-mismatch"]
    }]
  }, [], [], [], {});

  assert.match(html, /Audit summary/);
  assert.match(html, /AI decision/);
  assert.match(html, /Runtime drift/);
  assert.match(html, /Open env changes/);
  assert.match(html, /Trust/);
  assert.match(html, /AI Handoff/);
  assert.match(html, /Recommended Actions/);
  assert.match(html, /Review express/);
  assert.match(html, /AI Plan Artifacts/);
  assert.match(html, /plan\.md/);
  assert.match(html, /Remediation Steps/);
  assert.match(html, /4\.17\.21/);
  assert.match(html, /"level":"high"/);
  assert.match(html, /"score":90/);
  assert.match(html, /Environment Steps/);
  assert.match(html, /node-version-mismatch/);
  assert.match(html, /CI Readiness/);
  assert.match(html, /security/);
  assert.match(html, /policy/);
  assert.match(html, /Global Inventory/);
  assert.match(html, /Dependency Snapshot/);
  assert.match(html, /express/);
  assert.match(html, /Security Summary/);
  assert.match(html, /package\.json/);
  assert.match(html, /express/);
});

test("dashWorkspace links written plan artifacts", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-dash-plan-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    os: { platform: "test", release: "test", arch: "x64" },
    runtimes: { node: "24.0.0" },
    packageManagers: {},
    containers: {},
    projectHints: { nvmrc: "20" },
    dependencySnapshot: {
      mode: "snapshot",
      enabled: true,
      manifests: ["requirements.txt"],
      summary: { ecosystems: ["python"], manifests: 1, packages: 1 },
      packages: [{ ecosystem: "python", name: "django", version: "==3.2.0", manifest: "requirements.txt", group: "requirements" }]
    },
    agentFiles: {}
  });
  await fs.writeFile(path.join(dir, ".aienvmp", "plan.md"), "# plan\n", "utf8");
  await fs.writeFile(path.join(dir, ".aienvmp", "plan.json"), JSON.stringify({
    remediationSteps: [{
      package: "django",
      severity: "unknown",
      fixAvailable: true,
      fixVersions: ["3.2.25"],
      advisories: [{ id: "PYSEC-1" }]
    }],
    environmentSteps: [{
      code: "mixed-node-lockfiles",
      category: "package-manager",
      summary: "Multiple Node lockfiles detected."
    }]
  }), "utf8");

  await dashWorkspace({ dir, quiet: true });
  const html = await fs.readFile(path.join(dir, ".aienvmp", "dashboard.html"), "utf8");

  assert.match(html, /AI Plan Artifacts/);
  assert.match(html, /href="plan\.md"/);
  assert.match(html, /href="plan\.json"/);
  assert.match(html, /Remediation Steps/);
  assert.match(html, /django/);
  assert.match(html, /3\.2\.25/);
  assert.match(html, /Environment Steps/);
  assert.match(html, /mixed-node-lockfiles/);
  assert.match(html, /CI Readiness/);
  assert.match(html, /node-version-mismatch/);
  assert.match(html, /Dependency Snapshot/);
  assert.match(html, /django/);
});
