import test from "node:test";
import assert from "node:assert/strict";
import { schemaWorkspace } from "../src/commands/schema.js";
import { schemaContract } from "../src/contract.js";

test("schemaContract describes stable AI output contracts", () => {
  const schema = schemaContract();

  assert.equal(schema.name, "aienvmp-contract");
  assert.equal(schema.contractVersion, "0.1-prototype");
  assert.equal(schema.stableFrom, "0.2.0");
  assert.match(schema.compatibilityPolicy, /backward-compatible/);
  assert.match(schema.breakingChangePolicy, /contractVersion bump/);
  assert.ok(schema.aiBootstrapFields.includes("nextSafeCommandSource"));
  assert.ok(schema.aiBootstrapFields.includes("nextSafeCommandReason"));
  assert.equal(schema.aiLoop.name, "AI maintenance loop");
  assert.equal(schema.aiLoop.localMode, "warn-only");
  assert.deepEqual(schema.aiLoop.steps.map((item) => item.step), ["sync", "status", "context", "intent", "checkpoint", "handoff"]);
  assert.equal(schema.aiLoop.steps[0].command, "aienvmp sync");
  assert.equal(schema.aiLoop.steps[5].command, "aienvmp handoff");
  assert.match(schema.aiLoop.strictRule, /warn-only/);
  assert.equal(schema.outputs.status.contract.name, "aienvmp-preflight");
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("nextAgent"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("aiBootstrap"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("nextSafeCommand"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("aiReadiness"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("collaboration"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("maintenanceLoop"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("followUps"));
  assert.ok(schema.outputs.status.contract.aiEntryFields.includes("agentPointers"));
  assert.ok(schema.outputs.status.rootFields.includes("nextSafeCommand"));
  assert.ok(schema.outputs.status.rootFields.includes("aiBootstrap"));
  assert.ok(schema.outputs.status.agentPointerFields.includes("discovery"));
  assert.ok(schema.outputs.status.agentPointerFields.includes("onboardCommand"));
  assert.equal(schema.outputs.summary.command, "aienvmp summary --write");
  assert.equal(schema.outputs.summary.format, "markdown");
  assert.deepEqual(schema.outputs.summary.startsWith, ["AI readiness", "AI signals", "AI next"]);
  assert.equal(schema.outputs.plan.command, "aienvmp plan --json");
  assert.ok(schema.outputs.plan.rootFields.includes("aiBootstrap"));
  assert.ok(schema.outputs.plan.rootFields.includes("nextSafeCommand"));
  assert.ok(schema.outputs.context.rootFields.includes("coordination"));
  assert.ok(schema.outputs.context.rootFields.includes("aiBootstrap"));
  assert.ok(schema.outputs.context.rootFields.includes("nextSafeCommand"));
  assert.ok(schema.outputs.context.rootFields.includes("collaboration"));
  assert.ok(schema.outputs.context.rootFields.includes("maintenanceLoop"));
  assert.ok(schema.outputs.context.rootFields.includes("agentPointers"));
  assert.ok(schema.outputs.context.rootFields.includes("aiReadiness"));
  assert.ok(schema.outputs.handoff.rootFields.includes("dependencyHandoff"));
  assert.ok(schema.outputs.handoff.rootFields.includes("aiBootstrap"));
  assert.ok(schema.outputs.handoff.rootFields.includes("nextSafeCommand"));
  assert.ok(schema.outputs.handoff.rootFields.includes("continuation"));
  assert.ok(schema.outputs.handoff.rootFields.includes("coordination"));
  assert.equal(schema.outputs.sbom.command, "aienvmp sbom --json");
  assert.ok(schema.outputs.sbom.rootFields.includes("aiBootstrap"));
  assert.ok(schema.outputs.sbom.rootFields.includes("nextSafeCommand"));
  assert.ok(schema.outputs.sbom.rootFields.includes("aiReviewPlan"));
  assert.ok(schema.outputs.sbom.aiReviewPlanFields.includes("beforeChange"));
  assert.ok(schema.outputs.sbom.rootFields.includes("riskSummary"));
  assert.ok(schema.outputs.sbom.rootFields.includes("aiDependencyReview"));
  assert.ok(schema.outputs.sbom.aiDependencyReviewFields.includes("securityConfidence"));
  assert.ok(schema.outputs.sbom.aiDependencyReviewFields.includes("statusReason"));
  assert.equal(schema.outputs.cyclonedxLite.command, "aienvmp sbom --format cyclonedx-lite --json");
  assert.equal(schema.compatibility.stability, "additive");
  assert.equal(schema.compatibility.contractVersion, "0.1-prototype");
  assert.equal(schema.compatibility.stableFrom, "0.2.0");
  assert.match(schema.compatibility.additiveRule, /After 0.2.0/);
  assert.match(schema.compatibility.breakingChangeRule, /migration note/);
  assert.match(schema.compatibility.aiReadinessRule, /project-local code work/);
  assert.match(schema.compatibility.collaborationRule, /multi-agent environment coordination/);
  assert.match(schema.compatibility.agentDiscoveryRule, /onboardCommand/);
  assert.match(schema.compatibility.maintenanceLoopRule, /recurring AI workflow/);
  assert.match(schema.compatibility.enforcementPolicyRule, /local\/CI\/release/);
  assert.match(schema.compatibility.strictDecisionRule, /local warn-only vs CI strict/);
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

test("schemaWorkspace text prints the AI loop", async () => {
  const originalLog = console.log;
  const output = [];
  console.log = (value) => { output.push(value); };
  try {
    await schemaWorkspace({});
  } finally {
    console.log = originalLog;
  }

  assert.match(output.join("\n"), /loop: aienvmp sync -> aienvmp status -> aienvmp context --json/);
  assert.match(output.join("\n"), /aienvmp handoff/);
});
