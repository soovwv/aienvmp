import test from "node:test";
import assert from "node:assert/strict";
import { recommendedActions } from "../src/actions.js";

test("recommendedActions returns a simple default project-local action", () => {
  const actions = recommendedActions({}, { warnings: [], intents: [] });

  assert.equal(actions.length, 1);
  assert.equal(actions[0].id, "continue-project-local");
  assert.equal(actions[0].category, "workflow");
});

test("recommendedActions prioritizes security remediation with fix versions", () => {
  const actions = recommendedActions({
    security: {
      enabled: true,
      summary: { total: 2, critical: 0, high: 1, moderate: 1, low: 0, info: 0 },
      topPackages: [{
        name: "lodash",
        severity: "high",
        remediationPriority: { level: "high", score: 90, reasons: [] },
        fixAvailable: true,
        fixVersions: ["4.17.21"],
        advisories: [{ id: "GHSA-test" }]
      }]
    }
  }, { warnings: [{ code: "security-vulnerabilities", message: "high risk" }], intents: [] });

  assert.equal(actions[0].id, "review-security-remediation");
  assert.equal(actions[0].priority, "high");
  assert.match(actions[0].summary, /lodash/);
  assert.match(actions[0].summary, /high\/90/);
  assert.match(actions[0].summary, /4\.17\.21/);
});

test("recommendedActions reports coordination work for open intents", () => {
  const actions = recommendedActions({}, {
    warnings: [{ code: "conflicting-open-intents", message: "conflict" }],
    intents: [{ actor: "agent:codex", action: "install node", target: "node" }]
  });

  assert.deepEqual(actions.map((item) => item.id).slice(0, 2), ["review-open-intents", "coordinate-agents"]);
});
