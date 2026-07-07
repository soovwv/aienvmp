import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";
import { intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { renderContext } from "../render.js";
import { loadPolicy, policyWarnings } from "../policy.js";
import { recommendedActions } from "../actions.js";
import { buildPlan, compactStepSummary } from "./plan.js";

export async function contextWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest, { timeline, intents }), ...policyWarnings(manifest, policy)];
  const decision = contextDecision(warnings, intents);
  const actions = recommendedActions(manifest, { warnings, intents });
  const stepSummary = compactStepSummary(buildPlan(manifest, warnings, intents, policy));
  if (args.json) {
    console.log(JSON.stringify({
      status: warnings.length ? "review-required" : "clear",
      decision,
      recommendedActions: actions,
      stepSummary,
      trust: manifest.trust || {},
      guidance: decision,
      workspace: manifest.workspace,
      runtimes: manifest.runtimes,
      packageManagers: manifest.packageManagers,
      containers: manifest.containers,
      inventory: inventorySummary(manifest.inventory),
      security: securitySummary(manifest.security),
      projectHints: manifest.projectHints,
      warnings,
      policy,
      intents: intents.slice(-5),
      recentLedger: timeline.slice(-5),
      protocol: manifest.agentProtocol
    }, null, 2));
    return;
  }
  console.log(renderContext(manifest, timeline, warnings, intents, policy, actions));
}

function securitySummary(security = {}) {
  return {
    mode: security.mode || "basic",
    enabled: security.enabled === true,
    summary: security.summary || { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
    topPackages: security.topPackages || []
  };
}

function inventorySummary(inventory = {}) {
  const tools = inventory.tools || {};
  return {
    mode: inventory.mode || "basic",
    enabled: inventory.enabled === true,
    groups: Object.fromEntries(Object.entries(tools).map(([name, items]) => [name, items.length]))
  };
}

function contextDecision(warnings, intents) {
  const reviewRequired = warnings.length > 0 || intents.length > 0;
  return {
    canProceed: !reviewRequired,
    safeForProjectLocalWork: warnings.length === 0,
    reviewRequired,
    environmentChangeRequiresIntent: true,
    globalEnvironmentChangesRequireUserApproval: true,
    pendingIntentCount: intents.length,
    mustNotDo: [
      "do not change global runtimes without user approval",
      "do not install or remove global package managers without user approval",
      "do not change Docker daemon/context assumptions without user approval",
      "do not ignore open intents or review-required warnings"
    ],
    recommendedNextActions: warnings.length
      ? ["review warnings", "ask the user before environment changes", "record intent before changes"]
      : ["continue with project-local work", "run aienvmp intent before environment changes"],
    nextCommand: warnings.length ? "review warnings before changing environment" : "continue with project-local work"
  };
}
