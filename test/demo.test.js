import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("multi-agent conflict demo detects dependency coordination", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("examples/multi-agent-conflict-demo.mjs")
  ], {
    cwd: path.resolve("."),
    maxBuffer: 5 * 1024 * 1024
  });

  assert.match(stdout, /aienvmp multi-agent conflict demo/);
  assert.match(stdout, /AI discovery: ready: codex, claude, gemini/);
  assert.match(stdout, /collaboration: review-before-env-change/);
  assert.match(stdout, /conflict targets: dependency/);
  assert.match(stdout, /read first: \.aienvmp\/status\.json/);
});
