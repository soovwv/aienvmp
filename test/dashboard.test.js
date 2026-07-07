import test from "node:test";
import assert from "node:assert/strict";
import { renderDashboard } from "../src/render.js";

test("renderDashboard includes the audit summary surface", () => {
  const html = renderDashboard({
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { name: "sample", path: "/tmp/sample" },
    os: { platform: "linux", release: "test", arch: "x64", shell: "bash" },
    runtimes: { node: "24.0.0" },
    packageManagers: { npm: "11.0.0" },
    containers: {},
    projectHints: {},
    agentFiles: {},
    security: {
      mode: "security",
      enabled: true,
      summary: { total: 1, critical: 0, high: 1, moderate: 0, low: 0, info: 0 },
      topPackages: [{ name: "lodash", severity: "high", fixAvailable: true }]
    }
  }, [], [], [], {});

  assert.match(html, /Audit summary/);
  assert.match(html, /AI decision/);
  assert.match(html, /Runtime drift/);
  assert.match(html, /Open env changes/);
  assert.match(html, /Trust/);
  assert.match(html, /AI Handoff/);
  assert.match(html, /Global Inventory/);
  assert.match(html, /Security Summary/);
  assert.match(html, /lodash/);
});
