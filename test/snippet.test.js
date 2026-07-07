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
  assert.match(agents, /aienvmp status --write/);
  assert.match(agents, /aienvmp context --json/);
  assert.match(agents, /planned-change --target dependency/);
  assert.match(agents, /<!-- aienvmp:end -->/);
});
