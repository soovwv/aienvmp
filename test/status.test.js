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
    dependencySnapshot: { summary: { packages: 2 } },
    security: { summary: { total: 0 } }
  }, [], []);

  assert.equal(status.state, "clear");
  assert.equal(status.counts.runtimes, 1);
  assert.equal(status.counts.dependencies, 2);
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
});
