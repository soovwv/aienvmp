import { diagnose } from "../doctor.js";
import { appendJsonLine, readJson } from "../fsutil.js";
import { loadPolicy, policyWarnings } from "../policy.js";
import { intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { renderHandoff } from "../render.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";
import { changedTrust } from "../trust.js";
import { recommendedActions } from "../actions.js";
import { aiDecision } from "../decision.js";

export async function handoffWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest, { timeline, intents }), ...policyWarnings(manifest, policy)];
  const handoff = buildHandoff(manifest, timeline, warnings, intents, policy);
  if (args.record) {
    await recordHandoff(timelinePath(dir), handoff, args.actor || "agent:unknown");
  }

  if (args.json) {
    console.log(JSON.stringify(handoff, null, 2));
  } else {
    console.log(renderHandoff(handoff));
  }
  return handoff;
}

async function recordHandoff(file, handoff, actor) {
  const now = new Date();
  await appendJsonLine(file, {
    at: now.toISOString(),
    actor,
    type: "agent-handoff",
    summary: `handoff ${handoff.status}`,
    status: handoff.status,
    warnings: handoff.warnings.map((warning) => warning.code),
    trust: changedTrust(now, handoff.status !== "clear")
  });
}

export function buildHandoff(manifest, timeline = [], warnings = [], intents = [], policy = {}) {
  const reviewRequired = warnings.length > 0 || intents.length > 0;
  const actions = recommendedActions(manifest, { warnings, intents });
  return {
    status: reviewRequired ? "review-required" : "clear",
    trust: manifest.trust || {},
    schemaVersion: manifest.schemaVersion || 1,
    decision: aiDecision(warnings, intents),
    workspace: manifest.workspace,
    safeRuntime: {
      node: manifest.runtimes?.node || "not detected",
      python: manifest.runtimes?.python || manifest.runtimes?.python3 || "not detected",
      docker: manifest.containers?.docker ? "available" : "not detected"
    },
    inventory: inventorySummary(manifest.inventory),
    security: securitySummary(manifest.security),
    policy: {
      node: policy.node || "not set",
      python: policy.python || "not set",
      packageManager: policy.packageManager || "not set",
      runtimeChanges: policy.runtimeChanges || "ask-first",
      globalInstalls: policy.globalInstalls || "ask-first"
    },
    openIntents: intents.slice(-5).reverse(),
    warnings,
    recommendedActions: actions,
    recentChanges: timeline.slice(-5).reverse(),
    mustNotDo: [
      "do not change global runtimes without user approval",
      "do not install or remove global package managers without user approval",
      "do not change Docker daemon/context assumptions without user approval"
    ],
    recommendedNext: reviewRequired
      ? "review warnings and open intents before environment changes"
      : "continue with project-local work; record intent before environment changes"
  };
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
