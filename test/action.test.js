import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("GitHub Action writes compact status artifacts by default", async () => {
  const action = await fs.readFile("action.yml", "utf8");
  const example = await fs.readFile("examples/github-action.yml", "utf8");

  assert.match(action, /write-status:/);
  assert.match(action, /write-schema:/);
  assert.match(action, /write-doctor-json:/);
  assert.match(action, /write-sbom:/);
  assert.match(action, /status --dir/);
  assert.match(action, /--write --quiet/);
  assert.match(action, /sbom --dir.*--write --quiet/);
  assert.match(action, /--format cyclonedx-lite --write --quiet/);
  assert.match(action, /schema --json >.*schema\.json/);
  assert.match(action, /doctor --dir.*--json >.*doctor\.json/);
  assert.match(example, /\.aienvmp\/status\.json/);
  assert.match(example, /\.aienvmp\/sbom\.json/);
  assert.match(example, /\.aienvmp\/sbom\.cdx\.json/);
  assert.match(example, /\.aienvmp\/schema\.json/);
  assert.match(example, /\.aienvmp\/doctor\.json/);
});
