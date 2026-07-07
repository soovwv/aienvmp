import test from "node:test";
import assert from "node:assert/strict";
import { diagnose } from "../src/doctor.js";

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
