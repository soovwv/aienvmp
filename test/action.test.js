import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("GitHub Action writes compact status artifacts by default", async () => {
  const action = await fs.readFile("action.yml", "utf8");
  const example = await fs.readFile("examples/github-action.yml", "utf8");

  assert.match(action, /write-status:/);
  assert.match(action, /status --dir/);
  assert.match(action, /\.aienvmp\/status\.json/);
  assert.match(example, /\.aienvmp\/status\.json/);
});
