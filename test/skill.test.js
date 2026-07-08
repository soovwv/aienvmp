import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("packaged aienvmp skill points AI agents to current startup contracts", async () => {
  const skill = await fs.readFile(path.resolve(".agents/skills/aienvmp/SKILL.md"), "utf8");

  assert.match(skill, /npx aienvmp onboard/);
  assert.match(skill, /npx aienvmp status --json/);
  assert.match(skill, /artifactFreshness\.state/);
  assert.match(skill, /npx aienvmp sync/);
  assert.match(skill, /npx aienvmp demo/);
  assert.match(skill, /Local source edits can continue/);
});
