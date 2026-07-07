import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { contextWorkspace } from "../src/commands/context.js";
import { writeJson } from "../src/fsutil.js";

test("contextWorkspace JSON includes compact step summary", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-context-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: { node: "24.0.0" },
    packageManagers: {},
    containers: {},
    projectHints: { nvmrc: "20" },
    dependencySnapshot: {
      mode: "snapshot",
      enabled: true,
      summary: { ecosystems: ["npm"], manifests: 1, packages: 1 },
      packages: [{ ecosystem: "npm", name: "express", version: "^4.18.0", manifest: "package.json", group: "dependencies" }]
    },
    lightSbom: {
      mode: "light-sbom",
      summary: {
        ecosystems: { npm: 1 },
        managers: { npm: 1 },
        groups: { dependencies: 1 },
        manifests: ["package.json"],
        packages: 1,
        vulnerabilities: 0,
        directVulnerablePackages: 0,
        transitiveOrUnmatchedVulnerablePackages: 0
      },
      topRisk: [],
      dependencyChangeHints: [{
        manifest: "package.json",
        ecosystem: "npm",
        manager: "npm",
        groups: ["dependencies"],
        lockfiles: [{ file: "package-lock.json", ecosystem: "npm", manager: "npm" }],
        packages: 1,
        riskPackages: []
      }],
      aiUse: { dependencySource: "project manifests only; no install or resolver is run" }
    },
    security: { enabled: false }
  });

  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await contextWorkspace({ dir, json: true });
  } finally {
    console.log = originalLog;
  }

  const json = JSON.parse(output);
  assert.equal(json.status, "review-required");
  assert.equal(json.preflight.state, "review-required");
  assert.equal(json.preflight.artifacts.status, ".aienvmp/status.json");
  assert.equal(json.preflight.commands.context, "aienvmp context --json");
  assert.equal(json.preflight.quickstart.beforeEnvironmentChange, "aienvmp intent --actor agent:id --action planned-change --target <runtime|package-manager|docker|dependency>");
  assert.equal(json.preflight.intentTargets[0].target, "node");
  assert.equal(json.preflight.dependencyReadSet[0].manifest, "package.json");
  assert.deepEqual(json.preflight.dependencyReadSet[0].lockfiles, ["package-lock.json"]);
  assert.equal(json.preflight.dependencyChangeProtocol.commands.recordAfterChange, "aienvmp record --actor agent:id --summary dependency-change --target dependency");
  assert.equal(json.decision.schemaVersion, 1);
  assert.equal(json.decision.mode, "review-first");
  assert.equal(json.decision.canContinueProjectLocalWork, true);
  assert.equal(json.decision.canChangeEnvironmentWithoutReview, false);
  assert.deepEqual(json.decision.warningCodes, ["node-version-mismatch"]);
  assert.equal(json.decision.requiredCommands.reviewPlan, "aienvmp plan");
  assert.equal(json.enforcement.mode, "advisory-by-default");
  assert.equal(json.enforcement.localBehavior, "non-blocking");
  assert.deepEqual(json.enforcement.suggestedStrictScopes, ["policy"]);
  assert.equal(json.dependencySnapshot.summary.packages, 1);
  assert.equal(json.dependencySnapshot.packages[0].name, "express");
  assert.equal(json.lightSbom.summary.packages, 1);
  assert.equal(json.lightSbom.dependencyChangeHints[0].manifest, "package.json");
  assert.equal(json.lightSbom.aiUse.dependencySource, "project manifests only; no install or resolver is run");
  assert.equal(json.stepSummary.environment[0].code, "node-version-mismatch");
  assert.deepEqual(json.stepSummary.remediation, []);
});
