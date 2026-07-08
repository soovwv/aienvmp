import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { snippetWorkspace } from "../src/commands/snippet.js";

test("snippet writes only an aienvmp marker block when explicitly requested", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-snippet-"));

  await snippetWorkspace({ dir, _: ["agents"], write: true, quiet: true });

  const agents = await fs.readFile(path.join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /<!-- aienvmp:begin -->/);
  assert.match(agents, /Session start contract/);
  assert.match(agents, /aienvmp status --json/);
  assert.match(agents, /aienvmp sync/);
  assert.match(agents, /Continue project-local code work/);
  assert.match(agents, /aienvmp status --write/);
  assert.match(agents, /\.aienvmp\/summary\.md/);
  assert.match(agents, /aienvmp context --json/);
  assert.match(agents, /planned-change --target dependency/);
  assert.match(agents, /checkpoint --actor agent:id/);
  assert.match(agents, /<!-- aienvmp:end -->/);
});

test("snippet renders agent-specific actors for Claude and Gemini", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-snippet-agents-"));

  await snippetWorkspace({ dir, _: ["claude"], write: true, quiet: true });
  await snippetWorkspace({ dir, _: ["gemini"], write: true, quiet: true });

  const claude = await fs.readFile(path.join(dir, "CLAUDE.md"), "utf8");
  const gemini = await fs.readFile(path.join(dir, "GEMINI.md"), "utf8");

  assert.match(claude, /--actor agent:claude/);
  assert.match(claude, /Fast read order/);
  assert.match(gemini, /--actor agent:gemini/);
  assert.match(gemini, /dependencies, lockfiles/);
});
