import test from "node:test";
import assert from "node:assert/strict";
import { schemaWorkspace } from "../src/commands/schema.js";
import { schemaContract } from "../src/contract.js";

test("schemaContract describes stable AI output contracts", () => {
  const schema = schemaContract();

  assert.equal(schema.name, "aienvmp-contract");
  assert.equal(schema.outputs.status.contract.name, "aienvmp-preflight");
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("nextAgent"));
  assert.ok(schema.outputs.handoff.rootFields.includes("dependencyHandoff"));
  assert.equal(schema.compatibility.stability, "additive");
});

test("schemaWorkspace prints JSON without requiring a workspace", async () => {
  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await schemaWorkspace({ json: true });
  } finally {
    console.log = originalLog;
  }

  const schema = JSON.parse(output);
  assert.equal(schema.outputs.context.command, "aienvmp context --json");
  assert.match(schema.compatibility.localBehavior, /read-only/);
});
