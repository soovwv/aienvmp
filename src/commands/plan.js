import fs from "node:fs/promises";
import { diagnose } from "../doctor.js";
import { readJson, writeJson } from "../fsutil.js";
import { loadPolicy, policyWarnings } from "../policy.js";
import { intentsPath, manifestPath, planJsonPath, planMdPath, timelinePath, workspaceDir } from "../paths.js";
import { renderPlan } from "../render.js";
import { recommendedActions } from "../actions.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";

export async function planWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest, { timeline, intents }), ...policyWarnings(manifest, policy)];
  const plan = buildPlan(manifest, warnings, intents, policy);

  if (args.write) {
    await writeJson(planJsonPath(dir), plan);
    await fs.writeFile(planMdPath(dir), renderPlan(plan), "utf8");
  }

  if (args.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(renderPlan(plan));
  }
  return plan;
}

export function buildPlan(manifest, warnings = [], intents = [], policy = {}) {
  const actions = recommendedActions(manifest, { warnings, intents });
  const status = warnings.length || intents.length ? "review-required" : "clear";
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status,
    workspace: manifest.workspace || {},
    trust: manifest.trust || {},
    policy: {
      node: policy.node || "not set",
      python: policy.python || "not set",
      packageManager: policy.packageManager || "not set",
      runtimeChanges: policy.runtimeChanges || "ask-first",
      globalInstalls: policy.globalInstalls || "ask-first"
    },
    recommendedActions: actions,
    reviewGates: reviewGates(warnings, intents, manifest.security),
    warnings,
    openIntents: intents.slice(-5).reverse(),
    security: {
      mode: manifest.security?.mode || "basic",
      enabled: manifest.security?.enabled === true,
      summary: manifest.security?.summary || { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
      topPackages: manifest.security?.topPackages || []
    },
    notes: [
      "This plan is read-only.",
      "Ask the user before global runtime, package manager, Docker, or global package changes.",
      "Prefer project-local version files and local environments."
    ]
  };
}

function reviewGates(warnings, intents, security = {}) {
  const gates = [];
  if (warnings.length) gates.push("Review warnings before changing the environment.");
  if (intents.length) gates.push("Resolve or coordinate open intents before overlapping environment changes.");
  const summary = security.summary || {};
  if (security.enabled && (Number(summary.critical || 0) > 0 || Number(summary.high || 0) > 0)) {
    gates.push("Review high or critical vulnerability remediation before dependency or deployment changes.");
  }
  if (!gates.length) gates.push("No blocking gates detected; continue project-local work and record intent before environment changes.");
  return gates;
}
