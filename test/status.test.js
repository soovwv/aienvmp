import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildStatus, statusWorkspace } from "../src/commands/status.js";
import { writeJson } from "../src/fsutil.js";

test("buildStatus returns a compact clear state", () => {
  const status = buildStatus({
    runtimes: { node: "24.0.0" },
    dependencySnapshot: { summary: { packages: 2 }, manifests: ["package.json"] },
    lightSbom: {
      dependencyChangeHints: [{
        manifest: "package.json",
        ecosystem: "npm",
        manager: "npm",
        groups: ["dependencies"],
        lockfiles: [{ file: "package-lock.json" }],
        riskPackages: []
      }]
    },
    security: { summary: { total: 0 } }
  }, [], []);

  assert.equal(status.state, "clear");
  assert.equal(status.counts.runtimes, 1);
  assert.equal(status.counts.dependencies, 2);
  assert.equal(status.agentUse.environmentChanges, "allowed");
  assert.equal(status.quickstart.label, "10-second AI flow");
  assert.equal(status.quickstart.detailCommand, "aienvmp context --json");
  assert.match(status.quickstart.rule, /Continue project-local work/);
  assert.equal(status.intentTargets[0].target, "dependency");
  assert.equal(status.dependencyReadSet[0].manifest, "package.json");
  assert.deepEqual(status.dependencyReadSet[0].lockfiles, ["package-lock.json"]);
  assert.equal(status.dependencyChangeProtocol.mode, "advisory");
  assert.equal(status.dependencyChangeProtocol.commands.recordIntent, "aienvmp intent --actor agent:id --action planned-change --target dependency");
  assert.equal(status.commands.recordIntent, "aienvmp intent --actor agent:id --action planned-change --target dependency");
  assert.equal(status.enforcementProfile.defaultMode, "advisory");
  assert.equal(status.enforcementProfile.localOperation, "non-blocking");
  assert.equal(status.artifacts.status, ".aienvmp/status.json");
  assert.equal(status.readOrder[0], ".aienvmp/status.json");
  assert.equal(status.commands.context, "aienvmp context --json");
  assert.equal(status.nextCommand, "aienvmp intent --actor agent:id --action planned-change");
});

test("statusWorkspace JSON reports review-required and strict suggestion", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-status-"));
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
    dependencySnapshot: { summary: { packages: 1 } },
    security: { enabled: false, summary: { total: 0 } }
  });

  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await statusWorkspace({ dir, json: true });
  } finally {
    console.log = originalLog;
  }

  const json = JSON.parse(output);
  assert.equal(json.state, "review-required");
  assert.equal(json.enforcement.suggestedStrictScopes[0], "policy");
  assert.equal(json.counts.warnings, 1);
  assert.equal(json.counts.dependencies, 1);
  assert.equal(json.agentUse.environmentChanges, "intent-and-review-first");
  assert.match(json.quickstart.rule, /Review warnings/);
  assert.equal(json.intentTargets[0].target, "node");
  assert.equal(json.artifacts.envMap, "AIENV.md");
});

test("statusWorkspace can write the compact AI status artifact", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-status-write-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { enabled: false, summary: { total: 0 } }
  });

  const result = await statusWorkspace({ dir, write: true, quiet: true });
  assert.match(result.artifact, /\.aienvmp[\\\/]status\.json$/);

  const written = JSON.parse(await fs.readFile(result.artifact, "utf8"));
  assert.equal(written.schemaVersion, 1);
  assert.equal(written.state, "clear");
  assert.equal(written.readOrder[0], ".aienvmp/status.json");
  assert.equal(written.commands.refresh, "aienvmp sync");
});
