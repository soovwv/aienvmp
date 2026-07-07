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
