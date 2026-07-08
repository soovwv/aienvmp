import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { syncWorkspace } from "../src/commands/sync.js";
import { renderSummary, summaryWorkspace } from "../src/commands/summary.js";

test("renderSummary keeps the AI handoff compact and actionable", () => {
  const markdown = renderSummary({
    state: "review-required",
    counts: { warnings: 1, openIntents: 2, runtimes: 3, dependencies: 4, vulnerabilities: 5 },
    sbomRisk: { level: "medium", score: 42, scanner: "not run", signals: ["scanner unavailable"], next: "Run a dedicated scanner." },
    nextCommand: "aienvmp handoff",
    quickstart: { detailCommand: "aienvmp context --json" },
    nextAgent: { readFirst: ".aienvmp/status.json" },
    enforcement: { recommendedCommand: "aienvmp doctor --strict security" },
    agentUse: { environmentChanges: "intent-and-review-first" },
    coordination: { next: "Check open intents.", conflictTargets: ["dependency"] },
    agentActivity: { next: "Run handoff.", multiActorTargets: ["node"] },
    dependencyReadSet: [{ manifest: "package.json", lockfiles: ["package-lock.json"] }],
    dependencyChangeProtocol: {
      packageManagerPolicy: "clear",
      commands: {
        recordIntent: "aienvmp intent --actor agent:id --action planned-change --target dependency",
        checkpointAfterChange: "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"
      }
    },
    agentPointers: {
      installed: ["codex"],
      missing: ["claude"],
      next: "Install a pointer with aienvmp snippet claude --write if this workspace uses that AI."
    }
  }, {
    workspace: { root: "/repo" },
    lightSbom: {
      source: { dependencies: "project manifests" },
      confidence: { transitiveDependencies: "not-resolved" }
    }
  });

  assert.match(markdown, /# aienvmp summary/);
  assert.match(markdown, /state: review-required/);
  assert.match(markdown, /light SBOM risk: medium \(42\)/);
  assert.match(markdown, /AI read first: \.aienvmp\/status\.json/);
  assert.match(markdown, /conflict targets: dependency/);
  assert.match(markdown, /multi-actor targets: node/);
  assert.match(markdown, /## Dependency changes/);
  assert.match(markdown, /read files: package\.json, package-lock\.json/);
  assert.match(markdown, /checkpoint --actor agent:id --summary dependency-change --target dependency/);
  assert.match(markdown, /## Agent pointers/);
  assert.match(markdown, /installed: codex/);
  assert.match(markdown, /missing: claude/);
  assert.match(markdown, /\.aienvmp\/sbom\.cdx\.json/);
});

test("summaryWorkspace writes summary.md after sync", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-summary-"));
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ dependencies: { express: "^4.18.0" } }), "utf8");

  await syncWorkspace({ dir, quiet: true });
  const result = await summaryWorkspace({ dir, write: true, quiet: true });
  const summary = await fs.readFile(path.join(dir, ".aienvmp", "summary.md"), "utf8");

  assert.match(result.artifact, /\.aienvmp[\\\/]summary\.md$/);
  assert.match(summary, /## AI handoff/);
  assert.match(summary, /## SBOM/);
  assert.match(summary, /## Dependency changes/);
  assert.match(summary, /## Agent pointers/);
  assert.match(summary, /next:/);
});
