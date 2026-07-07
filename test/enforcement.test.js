import test from "node:test";
import assert from "node:assert/strict";
import { enforcementAdvice, strictResult } from "../src/enforcement.js";

test("enforcementAdvice keeps local behavior advisory and suggests scoped strict checks", () => {
  const warnings = [
    { code: "security-vulnerabilities", message: "security" },
    { code: "node-version-mismatch", message: "policy" },
    { code: "conflicting-open-intents", message: "coordination" }
  ];
  const advice = enforcementAdvice(warnings);

  assert.equal(advice.mode, "advisory-by-default");
  assert.equal(advice.localBehavior, "non-blocking");
  assert.deepEqual(advice.suggestedStrictScopes, ["security", "policy", "coordination"]);
  assert.equal(advice.scopes.find((item) => item.scope === "all").status, "fail");
  assert.equal(advice.recommendedCommand, "aienvmp doctor --strict security");
});

test("strictResult remains advisory unless strict or ci is requested", () => {
  const warnings = [{ code: "security-vulnerabilities", message: "security" }];

  assert.equal(strictResult(warnings, {}).fail, false);
  assert.equal(strictResult(warnings, { strict: "security" }).fail, true);
  assert.equal(strictResult(warnings, { ci: true }).scope, "all");
});
