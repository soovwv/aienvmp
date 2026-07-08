import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { onboardWorkspace } from "../src/commands/onboard.js";

test("onboard writes Codex, Claude, and Gemini pointers then syncs", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-onboard-"));

  const result = await onboardWorkspace({ dir, quiet: true });

  assert.equal(result.status, "ok");
  assert.equal(result.sync, "ok");
  assert.deepEqual(result.pointers.map((item) => item.file), ["AGENTS.md", "CLAUDE.md", "GEMINI.md"]);

  const agents = await fs.readFile(path.join(dir, "AGENTS.md"), "utf8");
  const claude = await fs.readFile(path.join(dir, "CLAUDE.md"), "utf8");
  const gemini = await fs.readFile(path.join(dir, "GEMINI.md"), "utf8");
  const status = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "status.json"), "utf8"));

  assert.match(agents, /--actor agent:codex/);
  assert.match(claude, /--actor agent:claude/);
  assert.match(gemini, /--actor agent:gemini/);
  assert.deepEqual(status.agentPointers.installed, ["codex", "claude", "gemini"]);
});

test("onboard can target one agent without syncing", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-onboard-one-"));

  const result = await onboardWorkspace({ dir, _: ["claude"], no_sync: true, quiet: true });

  assert.equal(result.sync, "skipped");
  assert.deepEqual(result.pointers.map((item) => item.file), ["CLAUDE.md"]);
  await assert.rejects(fs.readFile(path.join(dir, "AGENTS.md"), "utf8"));
});
