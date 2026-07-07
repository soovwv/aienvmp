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
  assert.equal(json.decision.schemaVersion, 1);
  assert.equal(json.decision.mode, "review-first");
  assert.equal(json.decision.canContinueProjectLocalWork, true);
  assert.equal(json.decision.canChangeEnvironmentWithoutReview, false);
  assert.deepEqual(json.decision.warningCodes, ["node-version-mismatch"]);
  assert.equal(json.decision.requiredCommands.reviewPlan, "aienvmp plan");
  assert.equal(json.stepSummary.environment[0].code, "node-version-mismatch");
  assert.deepEqual(json.stepSummary.remediation, []);
});
