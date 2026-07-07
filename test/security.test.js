import test from "node:test";
import assert from "node:assert/strict";
import { parseNpmAudit, scanSecurity, summarizeScanners } from "../src/security.js";

test("scanSecurity is disabled by default", async () => {
  const security = await scanSecurity(process.cwd());

  assert.equal(security.mode, "basic");
  assert.equal(security.enabled, false);
  assert.match(security.note, /--security/);
});

test("parseNpmAudit returns severity counts and package summaries", () => {
  const parsed = parseNpmAudit(JSON.stringify({
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 1,
        moderate: 2,
        high: 1,
        critical: 1,
        total: 5
      }
    },
    vulnerabilities: {
      lodash: { severity: "high", via: ["CVE-1"], fixAvailable: true },
      minimist: { severity: "critical", via: ["CVE-2", "CVE-3"], fixAvailable: false }
    }
  }));

  assert.equal(parsed.available, true);
  assert.equal(parsed.summary.total, 5);
  assert.equal(parsed.summary.critical, 1);
  assert.equal(parsed.summary.high, 1);
  assert.deepEqual(parsed.vulnerablePackages, [
    { name: "lodash", severity: "high", viaCount: 1, fixAvailable: true },
    { name: "minimist", severity: "critical", viaCount: 2, fixAvailable: false }
  ]);
});

test("summarizeScanners combines available scanner totals", () => {
  const summary = summarizeScanners({
    npmAudit: {
      available: true,
      summary: { total: 2, critical: 1, high: 1, moderate: 0, low: 0, info: 0 }
    },
    missing: { available: false }
  });

  assert.deepEqual(summary, { total: 2, critical: 1, high: 1, moderate: 0, low: 0, info: 0 });
});
