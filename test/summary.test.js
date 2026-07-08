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
    aiReadiness: {
      level: "review",
      next: "Review listed signals before another AI changes the environment.",
      signals: ["open intent conflicts", "multi-agent environment activity"],
      safeProjectLocalActions: ["read status and summary artifacts before changing the environment"]
    },
    aiBootstrap: {
      readFirst: ".aienvmp/status.json",
      detailCommand: "aienvmp context --json",
      nextSafeCommand: "aienvmp sync",
      localMode: "advisory",
      projectLocalWork: "allowed",
      environmentChanges: "review-first",
      rule: "Review context before shared environment changes; local checks remain non-blocking."
    },
    aiSession: {
      start: ["aienvmp status --json", "aienvmp sync"],
      rule: "Read status first, sync only when stale or missing, and record intent before shared environment changes."
    },
    artifactFreshness: {
      state: "stale",
      nextCommand: "aienvmp sync"
    },
    collaboration: {
      status: "review-before-env-change",
      activeTargets: ["dependency", "node"],
      nextCommand: "aienvmp handoff --record --actor agent:id",
      rule: "Do not install shared tools until collaboration signals are reviewed."
    },
    followUpPlan: {
      status: "pending",
      nextCommand: "aienvmp sync"
    },
    maintenanceLoop: {
      nextCommand: "aienvmp handoff --record --actor agent:id",
      sbomCommand: "aienvmp sync --security",
      sbomReview: {
        status: "review",
        securityConfidence: "scanner-summary",
        nextCommand: "aienvmp sync --security"
      },
      rule: "Keep local operation advisory and lightweight; use strict checks only when CI or the user explicitly asks."
    },
    environmentChangeProtocol: {
      rule: "Read status/context, record intent, checkpoint, and hand off around shared environment changes.",
      readFirst: [".aienvmp/status.json", ".aienvmp/summary.md", "aienvmp context --json"],
      commands: {
        recordIntent: "aienvmp intent --actor agent:id --action planned-change --target dependency",
        checkpointAfterChange: "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"
      }
    },
    nextCommand: "aienvmp handoff",
    quickstart: { detailCommand: "aienvmp context --json" },
    nextAgent: { readFirst: ".aienvmp/status.json" },
    enforcement: {
      recommendedCommand: "aienvmp doctor --strict security",
      strictPlan: { ciCommand: "aienvmp doctor --strict security --json" },
      strictDecision: {
        local: "warn-only",
        localCommand: "aienvmp doctor --json",
        ciCommand: "aienvmp doctor --strict security --json"
      }
    },
    strictRecommendation: {
      localCommand: "aienvmp doctor --json",
      localBehavior: "warn-only",
      ciCommand: "aienvmp doctor --strict security --json",
      releaseCommand: "aienvmp doctor --strict all --json"
    },
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
      confidence: { transitiveDependencies: "not-resolved" },
      aiDependencyReview: {
        status: "review",
        securityConfidence: "scanner-summary",
        beforeDependencyChange: ["aienvmp intent --actor agent:id --action dependency-review --target dependency"]
      },
      aiReviewPlan: {
        status: "review",
        risk: "medium/42",
        securityConfidence: "scanner-summary",
        beforeChange: "aienvmp sync --security"
      }
    }
  });

  assert.match(markdown, /# aienvmp summary/);
  assert.match(markdown, /# aienvmp summary\n\n- AI readiness: review\n- AI signals: open intent conflicts; multi-agent environment activity\n- AI bootstrap: allowed \/ review-first \/ advisory\n- AI session: aienvmp status --json -> aienvmp sync\n- AI artifact freshness: stale \/ aienvmp sync\n- AI next: aienvmp sync/);
  assert.match(markdown, /AI bootstrap: allowed \/ review-first \/ advisory/);
  assert.match(markdown, /AI session: aienvmp status --json -> aienvmp sync/);
  assert.match(markdown, /AI artifact freshness: stale \/ aienvmp sync/);
  assert.match(markdown, /AI next: aienvmp sync \(Review listed signals/);
  assert.match(markdown, /AI safe local work: read status and summary artifacts/);
  assert.match(markdown, /AI collaboration: review-before-env-change \/ dependency, node \/ aienvmp handoff --record --actor agent:id/);
  assert.match(markdown, /AI follow-up: pending \/ aienvmp sync/);
  assert.match(markdown, /AI environment protocol: aienvmp intent --actor agent:id --action planned-change --target dependency -> aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency/);
  assert.match(markdown, /AI maintenance loop: aienvmp handoff --record --actor agent:id/);
  assert.match(markdown, /state: review-required/);
  assert.match(markdown, /light SBOM risk: medium \(42\)/);
  assert.match(markdown, /AI readiness: review/);
  assert.match(markdown, /AI read first: \.aienvmp\/status\.json/);
  assert.match(markdown, /AI bootstrap rule: Review context before shared environment changes/);
  assert.match(markdown, /session rule: Read status first, sync only when stale or missing/);
  assert.match(markdown, /local check: aienvmp doctor --json \(warn-only\)/);
  assert.match(markdown, /CI strict: aienvmp doctor --strict security --json/);
  assert.match(markdown, /release strict: aienvmp doctor --strict all --json/);
  assert.match(markdown, /release readiness: 0\.2\.0 \/ prototype-hardening \/ hold \/ npm run release:check passes locally/);
  assert.match(markdown, /collaboration rule: Do not install shared tools/);
  assert.match(markdown, /maintenance rule: Keep local operation advisory and lightweight/);
  assert.match(markdown, /environment rule: Read status\/context, record intent, checkpoint/);
  assert.match(markdown, /conflict targets: dependency/);
  assert.match(markdown, /multi-actor targets: node/);
  assert.match(markdown, /AI SBOM plan: review \/ medium\/42 \/ scanner-summary \/ aienvmp sync --security/);
  assert.match(markdown, /AI dependency review: review \/ scanner-summary \/ aienvmp intent --actor agent:id --action dependency-review --target dependency/);
  assert.match(markdown, /maintenance SBOM review: review \/ scanner-summary \/ aienvmp sync --security/);
  assert.match(markdown, /## Dependency changes/);
  assert.match(markdown, /environment read: \.aienvmp\/status\.json, \.aienvmp\/summary\.md, aienvmp context --json/);
  assert.match(markdown, /environment before: aienvmp intent --actor agent:id --action planned-change --target dependency/);
  assert.match(markdown, /environment after: aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency/);
  assert.match(markdown, /read files: package\.json, package-lock\.json/);
  assert.match(markdown, /checkpoint --actor agent:id --summary dependency-change --target dependency/);
  assert.match(markdown, /## Agent pointers/);
  assert.match(markdown, /installed: codex/);
  assert.match(markdown, /missing: claude/);
  assert.match(markdown, /## Release readiness/);
  assert.match(markdown, /target: 0\.2\.0/);
  assert.match(markdown, /default decision: hold/);
  assert.match(markdown, /publish when: meaningful AI contract/);
  assert.match(markdown, /hold when: only one small documentation/);
  assert.match(markdown, /publish: Accumulate meaningful AI-contract, dashboard, SBOM, and release-gate changes before one npm publish/);
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
  assert.match(summary, /AI bootstrap:/);
  assert.match(summary, /AI session:/);
  assert.match(summary, /AI artifact freshness:/);
  assert.match(summary, /AI collaboration:/);
  assert.match(summary, /AI follow-up:/);
  assert.match(summary, /AI environment protocol:/);
  assert.match(summary, /AI maintenance loop:/);
  assert.match(summary, /## SBOM/);
  assert.match(summary, /AI SBOM plan:/);
  assert.match(summary, /## Dependency changes/);
  assert.match(summary, /environment before:/);
  assert.match(summary, /## Agent pointers/);
  assert.match(summary, /## Release readiness/);
  assert.match(summary, /release readiness: 0\.2\.0 \/ prototype-hardening \/ hold/);
  assert.match(summary, /next:/);
});
