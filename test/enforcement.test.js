import test from "node:test";
import assert from "node:assert/strict";
import { enforcementAdvice, enforcementGate, strictDecision, strictResult } from "../src/enforcement.js";

test("enforcementAdvice keeps local behavior advisory and suggests scoped strict checks", () => {
  const warnings = [
    { code: "security-vulnerabilities", message: "security" },
    { code: "node-version-mismatch", message: "policy" },
    { code: "conflicting-open-intents", message: "coordination" }
  ];
  const advice = enforcementAdvice(warnings);

  assert.equal(advice.mode, "advisory-by-default");
  assert.equal(advice.localBehavior, "non-blocking");
  assert.equal(advice.gate.localDefault, "warn-only");
  assert.equal(advice.gate.failCondition, "never in default mode");
  assert.deepEqual(advice.suggestedStrictScopes, ["security", "policy", "coordination"]);
  assert.equal(advice.scopes.find((item) => item.scope === "all").status, "fail");
  assert.equal(advice.recommendedCommand, "aienvmp doctor --strict security");
  assert.equal(advice.strictPlan.recommendedStrictScope, "security");
  assert.equal(advice.strictPlan.ciCommand, "aienvmp doctor --strict security --json");
  assert.match(advice.strictPlan.rule, /narrowest failing strict scope/);
  assert.equal(advice.strictDecision.localCommand, "aienvmp doctor --json");
  assert.equal(advice.strictDecision.shouldFailLocal, false);
  assert.equal(advice.strictDecision.recommendedScope, "security");
  assert.equal(advice.strictDecision.ciCommand, "aienvmp doctor --strict security --json");
  assert.deepEqual(advice.strictDecision.failingScopes, ["security", "policy", "coordination"]);
});

test("enforcementAdvice suggests all only when no scoped warning fails", () => {
  const advice = enforcementAdvice([]);

  assert.deepEqual(advice.suggestedStrictScopes, []);
  assert.equal(advice.strictPlan.recommendedStrictScope, "all");
  assert.equal(advice.strictPlan.ciCommand, "aienvmp doctor --strict all --json");
  assert.match(advice.strictPlan.rule, /explicit CI health checks/);
  assert.equal(advice.strictDecision.ci, "optional-health-check");
  assert.deepEqual(advice.strictDecision.passingScopes, ["security", "policy", "coordination"]);
});

test("strictDecision keeps local checks warn-only and CI scoped", () => {
  const decision = strictDecision(["coordination"], [
    { scope: "security", status: "pass" },
    { scope: "policy", status: "pass" },
    { scope: "coordination", status: "fail" },
    { scope: "all", status: "fail" }
  ]);

  assert.equal(decision.local, "warn-only");
  assert.equal(decision.shouldFailLocal, false);
  assert.equal(decision.recommendedCommand, "aienvmp doctor --strict coordination");
  assert.equal(decision.ciCommand, "aienvmp doctor --strict coordination --json");
  assert.match(decision.whenToUseStrict, /CI/);
});

test("strictResult remains advisory unless strict or ci is requested", () => {
  const warnings = [{ code: "security-vulnerabilities", message: "security" }];

  assert.equal(strictResult(warnings, {}).fail, false);
  assert.equal(strictResult(warnings, {}).gate.exitCode, "0 unless the command itself errors");
  assert.equal(strictResult(warnings, { strict: "security" }).fail, true);
  assert.equal(strictResult(warnings, { strict: "security" }).gate.failCondition, "matching warnings in security");
  assert.equal(strictResult(warnings, { ci: true }).scope, "all");
});

test("enforcementGate documents strict-only failure semantics", () => {
  assert.equal(enforcementGate("").strictMode, "off");
  assert.equal(enforcementGate("").rule, "Do not block local or shared machine operation unless --strict or --ci is explicitly requested.");
  assert.equal(enforcementGate("coordination").exitCode, "1 when matching warnings exist");
});
