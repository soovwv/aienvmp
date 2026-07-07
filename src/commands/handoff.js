import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { loadPolicy, policyWarnings } from "../policy.js";
import { intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { renderHandoff } from "../render.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";

export async function handoffWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest, { timeline, intents }), ...policyWarnings(manifest, policy)];
  const handoff = buildHandoff(manifest, timeline, warnings, intents, policy);

  if (args.json) {
    console.log(JSON.stringify(handoff, null, 2));
  } else {
    console.log(renderHandoff(handoff));
  }
  return handoff;
}

export function buildHandoff(manifest, timeline = [], warnings = [], intents = [], policy = {}) {
  const reviewRequired = warnings.length > 0 || intents.length > 0;
  return {
    status: reviewRequired ? "review-required" : "clear",
    trust: manifest.trust || {},
    schemaVersion: manifest.schemaVersion || 1,
    workspace: manifest.workspace,
    safeRuntime: {
      node: manifest.runtimes?.node || "not detected",
      python: manifest.runtimes?.python || manifest.runtimes?.python3 || "not detected",
      docker: manifest.containers?.docker ? "available" : "not detected"
    },
    inventory: inventorySummary(manifest.inventory),
    policy: {
      node: policy.node || "not set",
      python: policy.python || "not set",
      packageManager: policy.packageManager || "not set",
      runtimeChanges: policy.runtimeChanges || "ask-first",
      globalInstalls: policy.globalInstalls || "ask-first"
    },
    openIntents: intents.slice(-5).reverse(),
    warnings,
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

function inventorySummary(inventory = {}) {
  const tools = inventory.tools || {};
  return {
    mode: inventory.mode || "basic",
    enabled: inventory.enabled === true,
    groups: Object.fromEntries(Object.entries(tools).map(([name, items]) => [name, items.length]))
  };
}
