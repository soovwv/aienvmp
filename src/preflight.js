import { recommendedActions } from "./actions.js";
import { aiDecision } from "./decision.js";
import { enforcementAdvice } from "./enforcement.js";

export function buildPreflight(manifest = {}, warnings = [], intents = []) {
  const decision = aiDecision(warnings, intents);
  const enforcement = enforcementAdvice(warnings);
  const actions = recommendedActions(manifest, { warnings, intents });
  const state = decision.reviewRequired ? "review-required" : "clear";
  const topAction = actions[0] || null;
  return {
    schemaVersion: 1,
    state,
    summary: state === "clear"
      ? "Project-local work can continue. Record intent before environment changes."
      : "Review warnings or open intents before environment changes.",
    decision,
    enforcement,
    enforcementProfile: {
      defaultMode: "advisory",
      localOperation: "non-blocking",
      strictMode: "optional",
      strictUse: "CI or explicit human-requested checks only",
      reason: "Avoid disrupting shared servers or developer machines while still making drift visible.",
      recommendedStrictCommand: enforcement.recommendedCommand,
      strictCommands: [
        "aienvmp doctor --strict security",
        "aienvmp doctor --strict policy",
        "aienvmp doctor --strict coordination",
        "aienvmp doctor --strict all"
      ]
    },
    counts: {
      warnings: warnings.length,
      openIntents: intents.length,
      runtimes: Object.keys(manifest.runtimes || {}).length,
      dependencies: Number(manifest.dependencySnapshot?.summary?.packages || 0),
      vulnerabilities: Number(manifest.security?.summary?.total || 0)
    },
    agentUse: {
      purpose: "First AI-readable environment preflight for this workspace.",
      rule: "Read status first, use context for details, record intent before environment changes.",
      projectLocalWork: decision.canContinueProjectLocalWork ? "allowed" : "review-first",
      environmentChanges: decision.canChangeEnvironmentWithoutReview ? "allowed" : "intent-and-review-first"
    },
    quickstart: agentQuickstart(decision.reviewRequired),
    artifacts: preflightArtifacts(),
    readOrder: [
      ".aienvmp/status.json",
      "AIENV.md",
      ".aienvmp/manifest.json",
      ".aienvmp/plan.json",
      ".aienvmp/timeline.jsonl",
      ".aienvmp/intents.jsonl"
    ],
    commands: {
      refresh: "aienvmp sync",
      status: "aienvmp status --write",
      context: "aienvmp context --json",
      plan: "aienvmp plan --write",
      handoff: "aienvmp handoff --record --actor agent:id",
      recordIntent: "aienvmp intent --actor agent:id --action planned-change"
    },
    topAction,
    nextCommand: topAction?.command || decision.nextCommand
  };
}

function agentQuickstart(reviewRequired) {
  return {
    label: "10-second AI flow",
    readFirst: "aienvmp status --write",
    detailCommand: "aienvmp context --json",
    beforeEnvironmentChange: "aienvmp intent --actor agent:id --action planned-change --target <runtime|package-manager|docker|dependency>",
    afterEnvironmentChange: "aienvmp sync && aienvmp record --actor agent:id --summary what-changed",
    handoff: "aienvmp handoff --record --actor agent:id",
    rule: reviewRequired
      ? "Review warnings or open intents before environment changes; project-local work may continue."
      : "Continue project-local work; record intent before environment changes."
  };
}

export function preflightArtifacts() {
  return {
    status: ".aienvmp/status.json",
    envMap: "AIENV.md",
    manifest: ".aienvmp/manifest.json",
    dashboard: ".aienvmp/dashboard.html",
    planJson: ".aienvmp/plan.json",
    planMarkdown: ".aienvmp/plan.md",
    intents: ".aienvmp/intents.jsonl",
    timeline: ".aienvmp/timeline.jsonl"
  };
}
