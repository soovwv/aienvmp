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
    topAction,
    nextCommand: topAction?.command || decision.nextCommand
  };
}
