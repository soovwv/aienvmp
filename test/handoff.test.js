import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildHandoff, handoffWorkspace } from "../src/commands/handoff.js";
import { renderHandoff } from "../src/render.js";
import { writeJson } from "../src/fsutil.js";

test("buildHandoff summarizes next-agent environment state", () => {
  const handoff = buildHandoff({
    schemaVersion: 1,
    trust: { state: "observed", verified: false },
    workspace: { path: "/tmp/work", name: "work" },
    runtimes: { node: "24.0.0", python: "3.11.0" },
    containers: { docker: "29.0.0" },
    security: {
      mode: "security",
      enabled: true,
      summary: { total: 1, critical: 0, high: 1, moderate: 0, low: 0, info: 0 },
      topPackages: [{ name: "lodash", severity: "high", fixAvailable: true }]
    }
  }, [{
    at: "2026-07-08T00:00:00.000Z",
    actor: "agent:codex",
    summary: "updated node policy"
  }], [], [], { node: "24" });

  assert.equal(handoff.status, "clear");
  assert.equal(handoff.trust.state, "observed");
  assert.equal(handoff.schemaVersion, 1);
  assert.equal(handoff.safeRuntime.node, "24.0.0");
  assert.equal(handoff.security.topPackages[0].name, "lodash");
  assert.equal(handoff.policy.node, "24");
  assert.equal(handoff.recommendedActions[0].id, "review-security-remediation");
  assert.match(renderHandoff(handoff), /AI Handoff/);
  assert.match(renderHandoff(handoff), /Recommended actions/);
  assert.match(renderHandoff(handoff), /Recommended next/);
});

test("handoffWorkspace can record handoff timeline entries", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-handoff-record-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {}
  });

  const originalLog = console.log;
  console.log = () => {};
  try {
    await handoffWorkspace({ dir, record: true, actor: "agent:codex", json: true });
  } finally {
    console.log = originalLog;
  }
  const timeline = await fs.readFile(path.join(dir, ".aienvmp", "timeline.jsonl"), "utf8");

  assert.match(timeline, /agent-handoff/);
  assert.match(timeline, /agent:codex/);
});

test("buildHandoff requires review when open intents exist", () => {
  const handoff = buildHandoff({
    trust: { state: "observed", verified: false },
    workspace: { path: "/tmp/work", name: "work" },
    runtimes: {},
    containers: {}
  }, [], [], [{
    actor: "agent:claude",
    action: "install pnpm",
    target: "pnpm"
  }], {});

  assert.equal(handoff.status, "review-required");
  assert.equal(handoff.openIntents.length, 1);
  assert.equal(handoff.recommendedActions[0].id, "review-open-intents");
});
