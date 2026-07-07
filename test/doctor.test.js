import test from "node:test";
import assert from "node:assert/strict";
import { coordinationWarnings, diagnose } from "../src/doctor.js";

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

test("coordinationWarnings reports multiple agents changing the same target", () => {
  const warnings = coordinationWarnings([
    { actor: "agent:codex", action: "upgrade node", target: "node" },
    { actor: "agent:claude", action: "downgrade node", target: "node" }
  ]);

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].code, "conflicting-open-intents");
  assert.equal(warnings[0].target, "node");
});
