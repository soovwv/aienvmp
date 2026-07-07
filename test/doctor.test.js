import test from "node:test";
import assert from "node:assert/strict";
import { strictResult } from "../src/commands/doctor.js";
import { coordinationWarnings, diagnose, handoffWarnings, securityWarnings, staleIntentWarnings } from "../src/doctor.js";

test("diagnose reports mixed lockfiles and version mismatches", () => {
  const warnings = diagnose({
    runtimes: { node: "22.0.0", python: "3.10.0" },
    containers: {},
    projectHints: {
      nvmrc: "20",
      pythonVersion: "3.11",
      packageLock: true,
      pnpmLock: true
    }
  });
  assert.deepEqual(warnings.map((w) => w.code), [
    "node-version-mismatch",
    "python-version-mismatch",
    "mixed-node-lockfiles"
  ]);
});

test("securityWarnings reports high or critical vulnerability summaries", () => {
  const warnings = securityWarnings({
    enabled: true,
    summary: { total: 2, critical: 1, high: 1 }
  });

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].code, "security-vulnerabilities");
});

test("staleIntentWarnings reports old open intents", () => {
  const warnings = staleIntentWarnings([{
    id: "int_old",
    at: "2026-07-08T00:00:00.000Z",
    actor: "agent:codex",
    action: "upgrade node",
    target: "node"
  }], new Date("2026-07-08T05:00:00.000Z"));

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].code, "stale-open-intent");
});

test("handoffWarnings reports env changes without a later handoff", () => {
  const warnings = handoffWarnings([{
    at: "2026-07-08T00:00:00.000Z",
    actor: "agent:codex",
    type: "agent-record",
    target: "node",
    summary: "updated node"
  }]);

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].code, "handoff-stale");
});

test("handoffWarnings accepts a later recorded handoff", () => {
  const warnings = handoffWarnings([{
    at: "2026-07-08T00:00:00.000Z",
    actor: "agent:codex",
    type: "agent-record",
    target: "node",
    summary: "updated node"
  }, {
    at: "2026-07-08T00:01:00.000Z",
    actor: "agent:codex",
    type: "agent-handoff",
    summary: "handoff clear"
  }]);

  assert.equal(warnings.length, 0);
});

test("coordinationWarnings reports multiple agents changing the same target", () => {
  const warnings = coordinationWarnings([
    { actor: "agent:codex", action: "upgrade node", target: "node" },
    { actor: "agent:claude", action: "downgrade node", target: "node" }
  ]);

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].code, "conflicting-open-intents");
  assert.equal(warnings[0].target, "node");
});

test("strictResult filters failures by strict scope", () => {
  const warnings = [
    { code: "security-vulnerabilities", message: "security" },
    { code: "policy-version-mismatch", message: "policy" },
    { code: "conflicting-open-intents", message: "coordination" }
  ];

  assert.equal(strictResult(warnings, {}).fail, false);
  assert.deepEqual(strictResult(warnings, { strict: "security" }).matchedWarningCodes, ["security-vulnerabilities"]);
  assert.deepEqual(strictResult(warnings, { strict: "policy" }).matchedWarningCodes, ["policy-version-mismatch"]);
  assert.deepEqual(strictResult(warnings, { strict: "coordination" }).matchedWarningCodes, ["conflicting-open-intents"]);
  assert.equal(strictResult(warnings, { ci: true }).scope, "all");
  assert.equal(strictResult(warnings, { ci: true }).fail, true);
});
