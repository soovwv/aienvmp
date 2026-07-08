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
  assert.match(action, /write-summary:/);
  assert.match(action, /status --dir/);
  assert.match(action, /--write --quiet/);
  assert.match(action, /sbom --dir.*--write --quiet/);
  assert.match(action, /--format cyclonedx-lite --write --quiet/);
  assert.match(action, /summary --dir.*--write --quiet/);
  assert.match(action, /GITHUB_STEP_SUMMARY/);
  assert.match(action, /Append strict plan summary/);
  assert.match(action, /aienvmp strict plan/);
  assert.match(action, /enforcement\?\.strictPlan/);
  assert.match(action, /plan\.ciCommand/);
  assert.match(action, /Append AI loop summary/);
  assert.match(action, /aienvmp AI loop/);
  assert.match(action, /schema\.aiLoop/);
  assert.match(action, /loop\.localMode/);
  assert.match(action, /loop\.strictRule/);
  assert.match(action, /mktemp/);
  assert.match(action, /schema --json >.*schema\.json/);
  assert.match(action, /doctor --dir.*--json >.*doctor\.json/);
  assert.match(example, /\.aienvmp\/status\.json/);
  assert.match(example, /\.aienvmp\/summary\.md/);
  assert.match(example, /\.aienvmp\/sbom\.json/);
  assert.match(example, /\.aienvmp\/sbom\.cdx\.json/);
  assert.match(example, /\.aienvmp\/schema\.json/);
  assert.match(example, /\.aienvmp\/doctor\.json/);
  assert.match(example, /strict plan, and AI loop/);
});
