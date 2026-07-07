import test from "node:test";
import assert from "node:assert/strict";
import { buildHandoff } from "../src/commands/handoff.js";
import { renderHandoff } from "../src/render.js";

test("buildHandoff summarizes next-agent environment state", () => {
  const handoff = buildHandoff({
    schemaVersion: 1,
    trust: { state: "observed", verified: false },
    workspace: { path: "/tmp/work", name: "work" },
    runtimes: { node: "24.0.0", python: "3.11.0" },
    containers: { docker: "29.0.0" }
  }, [{
    at: "2026-07-08T00:00:00.000Z",
    actor: "agent:codex",
    summary: "updated node policy"
  }], [], [], { node: "24" });

  assert.equal(handoff.status, "clear");
  assert.equal(handoff.trust.state, "observed");
  assert.equal(handoff.schemaVersion, 1);
  assert.equal(handoff.safeRuntime.node, "24.0.0");
  assert.equal(handoff.policy.node, "24");
  assert.match(renderHandoff(handoff), /AI Handoff/);
  assert.match(renderHandoff(handoff), /Recommended next/);
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
});
