import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startWorkspace } from "../src/commands/start.js";

test("start syncs a missing workspace then returns the AI startup contract", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-start-missing-"));

  const result = await startWorkspace({ dir, quiet: true });

  assert.equal(result.status, "ok");
  assert.equal(result.mode, "synced");
  assert.equal(result.localMode, "read-mostly");
  assert.equal(result.startHere, ".aienvmp/discovery.json");
  assert.equal(result.decision, "clear");
  assert.equal(result.aiDiscovery.safeStart, "npx aienvmp status");
  assert.equal(result.aiDiscovery.decision, "fallback-required");
  assert.equal(result.discoveryDecision, "fallback-required");
  assert.equal(result.nextSetupCommand, "npx aienvmp onboard");
  assert.equal(result.aiDiscovery.resume.nextCommand, "npx aienvmp status");
  assert.equal(result.resume.nextCommand, "npx aienvmp status");
  assert.match(result.startupChecklist.join(" "), /dependencyQuickCheck/);
  assert.match(result.fallbackPrompt, /Use aienvmp as the workspace env map/);
  assert.equal(result.copyPastePrompt, result.fallbackPrompt);
  assert.ok(result.promptUse.pasteInto.includes("Claude"));
  assert.match(result.rule, /first AI entry command/);
  assert.match(result.statusText, /session:/);
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "status.json")));
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "dashboard.html")));
});

test("start reads fresh artifacts without resyncing", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-start-fresh-"));
  await startWorkspace({ dir, quiet: true });

  const result = await startWorkspace({ dir, quiet: true });

  assert.equal(result.mode, "read");
  assert.match(result.nextCommand, /aienvmp/);
  assert.match(result.aiDiscovery.fallbackPrompt, /Use aienvmp as the workspace env map/);
});

test("start JSON output is machine-readable", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-start-json-"));
  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await startWorkspace({ dir, json: true });
  } finally {
    console.log = originalLog;
  }

  const json = JSON.parse(output);
  assert.equal(json.status, "ok");
  assert.equal(json.mode, "synced");
  assert.equal(json.readOrder[0], ".aienvmp/discovery.json");
  assert.equal(json.nextSetupCommand, "npx aienvmp onboard");
  assert.equal(json.discoveryDecision, "fallback-required");
  assert.match(json.startupChecklist.join(" "), /start --json/);
  assert.equal(json.resume.handoff, "aienvmp handoff --record --actor agent:id");
  assert.match(json.fallbackPrompt, /Use aienvmp as the workspace env map/);
  assert.equal(json.copyPastePrompt, json.fallbackPrompt);
  assert.ok(json.promptUse.pasteInto.includes("Gemini"));
  assert.match(json.aiDiscovery.startupChecklist.join(" "), /start --json/);
  assert.equal(json.aiDiscovery.resume.handoff, "aienvmp handoff --record --actor agent:id");
  assert.equal(json.aiDiscovery.copyPastePrompt, json.aiDiscovery.fallbackPrompt);
  assert.match(json.aiDiscovery.rule, /Do not assume automatic pickup/);
});
