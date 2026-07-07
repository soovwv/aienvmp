import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { syncWorkspace } from "../src/commands/sync.js";

test("sync creates the AI-facing env map outputs with simple defaults", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sync-"));
  await fs.writeFile(path.join(dir, "package.json"), "{}\n", "utf8");

  await syncWorkspace({ dir });

  const manifest = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "manifest.json"), "utf8"));
  assert.equal(manifest.schemaName, "aienvmp.runtime-sbom");
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.trust.state, "observed");
  assert.equal(manifest.trust.verified, false);
  assert.equal(manifest.inventory.mode, "basic");
  assert.equal(manifest.inventory.enabled, false);
  assert.equal(manifest.generatedBy.name, "aienvmp");
  assert.equal(manifest.generatedBy.command, "aienvmp sync");
  assert.deepEqual(manifest.agentProtocol.afterEnvironmentChange, ["aienvmp sync"]);
  assert.equal(manifest.agentProtocol.handoffCommand, "aienvmp handoff");

  await assert.doesNotReject(fs.access(path.join(dir, "AIENV.md")));
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "dashboard.html")));
  await assert.rejects(fs.access(path.join(dir, "AGENTS.md")));
});

test("sync can return a quiet machine-readable result", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sync-json-"));
  const result = await syncWorkspace({ dir, quiet: true });

  assert.equal(result.status, "ok");
  assert.equal(result.changes, 0);
  assert.match(result.outputs.aiEnv, /AIENV\.md$/);
});
