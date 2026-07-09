import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { discoverWorkspace } from "../src/commands/discover.js";
import { syncWorkspace } from "../src/commands/sync.js";

test("discover reports missing aienvmp artifacts without writing files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-discover-missing-"));

  const result = await discoverWorkspace({ dir, quiet: true });

  assert.equal(result.status, "not-detected");
  assert.equal(result.detected, false);
  assert.equal(result.localMode, "read-only");
  assert.equal(result.startHere, ".aienvmp/README.md");
  assert.equal(result.nextCommand, "npx aienvmp sync");
  assert.equal(result.aiDiscovery.mode, "best-effort");
  assert.equal(result.aiDiscovery.automatic, false);
  assert.equal(result.aiDiscovery.pointerStatus, "missing");
  assert.equal(result.aiDiscovery.safeStart, "npx aienvmp sync");
  assert.match(result.aiDiscovery.limitation, /AI hosts only auto-read/);
  assert.equal(result.artifacts.stateDir.exists, false);
  await assert.rejects(fs.access(path.join(dir, ".aienvmp")));
});

test("discover finds generated start-here artifacts and agent pointers", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-discover-"));
  await syncWorkspace({ dir, quiet: true });
  await fs.writeFile(path.join(dir, "AGENTS.md"), [
    "<!-- aienvmp:begin -->",
    "## aienvmp Environment Map",
    "<!-- aienvmp:end -->"
  ].join("\n"), "utf8");

  const result = await discoverWorkspace({ dir, quiet: true });

  assert.equal(result.status, "detected");
  assert.equal(result.detected, true);
  assert.equal(result.startHere, ".aienvmp/README.md");
  assert.equal(result.artifacts.startHere.exists, true);
  assert.equal(result.artifacts.status.exists, true);
  assert.equal(result.artifacts.aiEnv.exists, true);
  assert.equal(result.freshness, "fresh");
  assert.equal(result.nextCommand, "npx aienvmp status");
  assert.deepEqual(result.agentPointers.installed, ["codex"]);
  assert.equal(result.aiDiscovery.automatic, true);
  assert.equal(result.aiDiscovery.pointerStatus, "ready: codex");
  assert.equal(result.aiDiscovery.safeStart, "npx aienvmp status");
  assert.deepEqual(result.aiDiscovery.fallbackRead, [".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "AIENV.md"]);
  assert.match(result.rule, /does not write files/);
});

test("discover JSON output is machine-readable for AI agents", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-discover-json-"));
  await syncWorkspace({ dir, quiet: true });
  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await discoverWorkspace({ dir, json: true });
  } finally {
    console.log = originalLog;
  }

  const json = JSON.parse(output);
  assert.equal(json.detected, true);
  assert.equal(json.readOrder[0], ".aienvmp/README.md");
  assert.equal(json.artifacts.dashboard.path, ".aienvmp/dashboard.html");
  assert.equal(json.localMode, "read-only");
  assert.equal(json.aiDiscovery.mode, "best-effort");
  assert.equal(json.aiDiscovery.installCommand, "npx aienvmp onboard");
  assert.match(json.aiDiscovery.rule, /Do not assume automatic pickup/);
});
