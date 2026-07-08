import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildStatus, statusWorkspace } from "../src/commands/status.js";
import { writeJson } from "../src/fsutil.js";

test("buildStatus returns a compact clear state", () => {
  const status = buildStatus({
    runtimes: { node: "24.0.0" },
    dependencySnapshot: { summary: { packages: 2 }, manifests: ["package.json"] },
    lightSbom: {
      riskSummary: {
        level: "low",
        score: 5,
        scanner: "off",
        next: "Run read-only security scan before dependency or release decisions.",
        signals: ["security scanner summary is off"]
      },
      dependencyChangeHints: [{
        manifest: "package.json",
        ecosystem: "npm",
        manager: "npm",
        groups: ["dependencies"],
        lockfiles: [{ file: "package-lock.json" }],
        riskPackages: []
      }]
    },
    security: { summary: { total: 0 } }
  }, [], []);

  assert.equal(status.state, "clear");
  assert.equal(status.contract.name, "aienvmp-preflight");
  assert.equal(status.contract.stability, "additive");
  assert.ok(status.contract.aiEntryFields.includes("nextAgent"));
  assert.ok(status.contract.aiEntryFields.includes("dependencyReadSet"));
  assert.equal(status.counts.runtimes, 1);
  assert.equal(status.counts.dependencies, 2);
  assert.equal(status.agentUse.environmentChanges, "allowed");
  assert.equal(status.aiReadiness.level, "ready");
  assert.equal(status.aiReadiness.requiresHumanReview, false);
  assert.equal(status.aiReadiness.environmentChanges, "allowed");
  assert.match(status.aiReadiness.safeProjectLocalActions[0], /read status/);
  assert.match(status.aiReadiness.reviewOnlyEnvironmentChanges, /Record intent/);
  assert.equal(status.quickstart.label, "10-second AI flow");
  assert.equal(status.quickstart.detailCommand, "aienvmp context --json");
  assert.equal(status.quickstart.afterEnvironmentChange, "aienvmp checkpoint --actor agent:id --summary what-changed --target environment");
  assert.match(status.quickstart.rule, /Continue project-local work/);
  assert.equal(status.nextAgent.readFirst, ".aienvmp/status.json");
  assert.equal(status.nextAgent.readSummary, ".aienvmp/summary.md");
  assert.equal(status.nextAgent.handoffCommand, "aienvmp handoff --record --actor agent:id");
  assert.deepEqual(status.nextAgent.dependencyFiles, ["package.json", "package-lock.json"]);
  assert.match(status.nextAgent.dependencyProtocol, /record dependency intent/);
  assert.equal(status.intentTargets[0].target, "dependency");
  assert.equal(status.dependencyReadSet[0].manifest, "package.json");
  assert.deepEqual(status.dependencyReadSet[0].lockfiles, ["package-lock.json"]);
  assert.equal(status.dependencyChangeProtocol.mode, "advisory");
  assert.equal(status.sbomRisk.level, "low");
  assert.match(status.sbomRisk.next, /security scan/);
  assert.equal(status.dependencyChangeProtocol.commands.recordIntent, "aienvmp intent --actor agent:id --action planned-change --target dependency");
  assert.equal(status.commands.recordIntent, "aienvmp intent --actor agent:id --action planned-change --target dependency");
  assert.equal(status.commands.checkpoint, "aienvmp checkpoint --actor agent:id --summary what-changed --target environment");
  assert.equal(status.enforcementProfile.defaultMode, "advisory");
  assert.equal(status.enforcementProfile.localOperation, "non-blocking");
  assert.equal(status.enforcementProfile.gate.localDefault, "warn-only");
  assert.equal(status.enforcementProfile.gate.failCondition, "never in default mode");
  assert.equal(status.artifacts.status, ".aienvmp/status.json");
  assert.equal(status.readOrder[0], ".aienvmp/status.json");
  assert.equal(status.readOrder[1], ".aienvmp/summary.md");
  assert.equal(status.commands.context, "aienvmp context --json");
  assert.equal(status.nextCommand, "aienvmp intent --actor agent:id --action planned-change");
});

test("buildStatus exposes pending follow-ups from timeline", () => {
  const status = buildStatus({
    runtimes: {},
    dependencySnapshot: { summary: { packages: 1 } },
    security: { summary: { total: 0 } }
  }, [], [], [{
    at: "2026-07-08T00:00:00.000Z",
    actor: "agent:codex",
    summary: "dependency-change",
    followUp: {
      required: true,
      target: "dependency",
      commands: ["aienvmp sync"]
    }
  }]);

  assert.equal(status.followUps.length, 1);
  assert.equal(status.followUps[0].target, "dependency");
  assert.equal(status.followUps[0].commands[0], "aienvmp sync");
});

test("buildStatus exposes multi-agent activity since last handoff", () => {
  const status = buildStatus({
    runtimes: {},
    dependencySnapshot: { summary: { packages: 1 } },
    security: { summary: { total: 0 } }
  }, [], [], [
    {
      at: "2026-07-08T00:00:00.000Z",
      actor: "agent:codex",
      type: "agent-record",
      target: "dependency",
      summary: "dependency-change"
    },
    {
      at: "2026-07-08T00:01:00.000Z",
      actor: "agent:gemini",
      type: "agent-record",
      target: "dependency",
      summary: "security dependency fix"
    }
  ]);

  assert.equal(status.agentActivity.environmentRecordCount, 2);
  assert.deepEqual(status.agentActivity.multiActorTargets, ["dependency"]);
  assert.deepEqual(status.agentActivity.targets[0].actors, ["agent:codex", "agent:gemini"]);
  assert.match(status.agentActivity.next, /handoff/);
});

test("buildStatus exposes agent pointer discovery hints", () => {
  const status = buildStatus({
    runtimes: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { summary: { total: 0 } },
    agentFiles: {
      agents: { path: "AGENTS.md", exists: true, hasAienvmpPointer: true, installCommand: "aienvmp snippet codex --write", role: "codex" },
      claude: { path: "CLAUDE.md", exists: true, hasAienvmpPointer: false, installCommand: "aienvmp snippet claude --write", role: "claude" },
      gemini: { path: "GEMINI.md", exists: false, hasAienvmpPointer: false, installCommand: "aienvmp snippet gemini --write", role: "gemini" }
    }
  }, [], []);

  assert.deepEqual(status.agentPointers.installed, ["codex"]);
  assert.deepEqual(status.agentPointers.missing, ["claude", "gemini"]);
  assert.equal(status.aiReadiness.level, "ready");
  assert.equal(status.agentPointers.targets[1].file, "CLAUDE.md");
  assert.match(status.agentPointers.next, /snippet claude/);
});

test("buildStatus marks AI readiness review when no agent pointer is installed", () => {
  const status = buildStatus({
    runtimes: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { summary: { total: 0 } },
    agentFiles: {
      agents: { path: "AGENTS.md", exists: false, hasAienvmpPointer: false, installCommand: "aienvmp snippet codex --write", role: "codex" }
    }
  }, [], []);

  assert.equal(status.aiReadiness.level, "review");
  assert.equal(status.aiReadiness.requiresHumanReview, true);
  assert.match(status.aiReadiness.signals.join(" "), /pointer/);
  assert.match(status.aiReadiness.safeProjectLocalActions.join(" "), /code-only work/);
  assert.match(status.aiReadiness.reviewOnlyEnvironmentChanges, /review signals/);
});

test("buildStatus treats legacy boolean agent files as installed pointers", () => {
  const status = buildStatus({
    runtimes: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { summary: { total: 0 } },
    agentFiles: { agents: true }
  }, [], []);

  assert.deepEqual(status.agentPointers.installed, ["codex"]);
  assert.equal(status.agentPointers.missingCount, 0);
});

test("statusWorkspace JSON reports review-required and strict suggestion", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-status-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: { node: "24.0.0" },
    packageManagers: {},
    containers: {},
    projectHints: { nvmrc: "20" },
    dependencySnapshot: { summary: { packages: 1 } },
    security: { enabled: false, summary: { total: 0 } }
  });

  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await statusWorkspace({ dir, json: true });
  } finally {
    console.log = originalLog;
  }

  const json = JSON.parse(output);
  assert.equal(json.state, "review-required");
  assert.equal(json.contract.version, 1);
  assert.equal(json.enforcement.suggestedStrictScopes[0], "policy");
  assert.equal(json.counts.warnings, 1);
  assert.equal(json.counts.dependencies, 1);
  assert.equal(json.agentUse.environmentChanges, "intent-and-review-first");
  assert.match(json.quickstart.rule, /Review warnings/);
  assert.match(json.nextAgent.rule, /review warnings/i);
  assert.equal(json.intentTargets[0].target, "node");
  assert.equal(json.artifacts.envMap, "AIENV.md");
});

test("statusWorkspace text prints the next-agent handoff command", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-status-text-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { enabled: false, summary: { total: 0 } }
  });

  const originalLog = console.log;
  const lines = [];
  console.log = (value) => { lines.push(value); };
  try {
    await statusWorkspace({ dir });
  } finally {
    console.log = originalLog;
  }

  assert.match(lines.join("\n"), /handoff: aienvmp handoff --record --actor agent:id/);
  assert.match(lines.join("\n"), /checkpoint: aienvmp checkpoint/);
  assert.match(lines.join("\n"), /ai-readiness: ready/);
});

test("buildStatus summarizes open intent coordination by target", () => {
  const status = buildStatus({
    runtimes: {},
    dependencySnapshot: { summary: { packages: 1 } },
    security: { summary: { total: 0 } }
  }, [], [
    { actor: "agent:codex", action: "update dependency", target: "dependency" },
    { actor: "agent:claude", action: "fix vulnerable package" }
  ]);

  assert.equal(status.coordination.openIntentCount, 2);
  assert.equal(status.coordination.targets[0].target, "dependency");
  assert.deepEqual(status.coordination.targets[0].actors, ["agent:codex", "agent:claude"]);
  assert.deepEqual(status.coordination.conflictTargets, ["dependency"]);
  assert.match(status.coordination.next, /conflicting intents/);
});

test("statusWorkspace can write the compact AI status artifact", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-status-write-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { enabled: false, summary: { total: 0 } }
  });

  const result = await statusWorkspace({ dir, write: true, quiet: true });
  assert.match(result.artifact, /\.aienvmp[\\\/]status\.json$/);

  const written = JSON.parse(await fs.readFile(result.artifact, "utf8"));
  assert.equal(written.schemaVersion, 1);
  assert.equal(written.state, "clear");
  assert.equal(written.readOrder[0], ".aienvmp/status.json");
  assert.equal(written.readOrder[1], ".aienvmp/summary.md");
  assert.equal(written.commands.refresh, "aienvmp sync");
});
