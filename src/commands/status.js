import fs from "node:fs/promises";
import path from "node:path";
import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { loadPolicy, policyWarnings } from "../policy.js";
import { intentsPath, manifestPath, statusJsonPath, timelinePath, workspaceDir } from "../paths.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";
import { recommendedActions } from "../actions.js";
import { aiDecision } from "../decision.js";
import { enforcementAdvice } from "../enforcement.js";

export async function statusWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const policy = await loadPolicy(dir);
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const warnings = [...diagnose(manifest, { timeline, intents }), ...policyWarnings(manifest, policy)];
  const status = buildStatus(manifest, warnings, intents);
  const artifact = args.write ? await writeStatusArtifact(dir, status) : "";
  const output = artifact ? { ...status, artifact } : status;
  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else if (!args.quiet) {
    console.log(`${output.state}: ${output.summary}`);
    console.log(`next: ${output.nextCommand}`);
    console.log(`strict: ${output.enforcement.recommendedCommand}`);
    if (artifact) console.log(`status: ${artifact}`);
  }
  return output;
}

export async function writeStatusArtifact(dir, status) {
  const out = statusJsonPath(dir);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(status, null, 2), "utf8");
  return out;
}

export function buildStatus(manifest = {}, warnings = [], intents = []) {
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
    artifacts: statusArtifacts(),
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

function statusArtifacts() {
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
