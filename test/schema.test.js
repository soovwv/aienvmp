import test from "node:test";
import assert from "node:assert/strict";
import { schemaWorkspace } from "../src/commands/schema.js";
import { schemaContract } from "../src/contract.js";

test("schemaContract describes stable AI output contracts", () => {
  const schema = schemaContract();

  assert.equal(schema.name, "aienvmp-contract");
  assert.equal(schema.outputs.status.contract.name, "aienvmp-preflight");
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("nextAgent"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("aiReadiness"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("followUps"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("agentPointers"));
  assert.equal(schema.outputs.summary.command, "aienvmp summary --write");
  assert.equal(schema.outputs.summary.format, "markdown");
  assert.deepEqual(schema.outputs.summary.startsWith, ["AI readiness", "AI signals", "AI next"]);
  assert.ok(schema.outputs.context.rootFields.includes("coordination"));
  assert.ok(schema.outputs.context.rootFields.includes("agentPointers"));
  assert.ok(schema.outputs.context.rootFields.includes("aiReadiness"));
  assert.ok(schema.outputs.handoff.rootFields.includes("dependencyHandoff"));
  assert.ok(schema.outputs.handoff.rootFields.includes("coordination"));
  assert.equal(schema.outputs.sbom.command, "aienvmp sbom --json");
  assert.ok(schema.outputs.sbom.rootFields.includes("riskSummary"));
  assert.ok(schema.outputs.sbom.rootFields.includes("aiDependencyReview"));
  assert.ok(schema.outputs.sbom.aiDependencyReviewFields.includes("securityConfidence"));
  assert.ok(schema.outputs.sbom.aiDependencyReviewFields.includes("statusReason"));
  assert.equal(schema.outputs.cyclonedxLite.command, "aienvmp sbom --format cyclonedx-lite --json");
  assert.equal(schema.compatibility.stability, "additive");
  assert.match(schema.compatibility.aiReadinessRule, /project-local code work/);
  assert.match(schema.compatibility.strictPlanRule, /narrowest explicit strict scope/);
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
  assert.equal(schema.outputs.summary.file, ".aienvmp/summary.md");
  assert.equal(schema.outputs.sbom.file, ".aienvmp/sbom.json");
  assert.equal(schema.outputs.cyclonedxLite.file, ".aienvmp/sbom.cdx.json");
  assert.match(schema.compatibility.localBehavior, /read-only/);
});
