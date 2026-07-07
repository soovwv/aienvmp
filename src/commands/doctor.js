import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";
import { intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { loadPolicy, policyWarnings } from "../policy.js";
import { recommendedActions } from "../actions.js";

export async function doctorWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const policy = await loadPolicy(dir);
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const warnings = [...diagnose(manifest, { timeline, intents }), ...policyWarnings(manifest, policy)];
  const actions = recommendedActions(manifest, { warnings, intents });
  const strict = strictResult(warnings, args);
  if (args.json) {
    console.log(JSON.stringify({
      status: strict.fail ? "fail" : warnings.length ? "warning" : "ok",
      trust: manifest.trust || {},
      policy,
      openIntentCount: intents.length,
      warnings,
      recommendedActions: actions,
      strict
    }, null, 2));
    if (strict.fail) {
      process.exitCode = 1;
    }
    return;
  }
  if (!warnings.length) {
    console.log("doctor: no blocking environment warnings detected");
    return;
  }
  for (const warning of warnings) {
    console.log(`[${warning.code}] ${warning.message}`);
  }
  console.log("recommended actions:");
  for (const item of actions) {
    console.log(`- [${item.priority}] ${item.summary}${item.command ? ` (${item.command})` : ""}`);
  }
  console.log(`doctor: warnings are non-blocking by default; pass --ci or --strict ${strict.availableScopes.join("|")} to fail automation.`);
  if (strict.fail) {
    process.exitCode = 1;
  }
}

export function strictResult(warnings = [], args = {}) {
  const scope = normalizeStrictScope(args.strict || (args.ci ? "all" : ""));
  const matchedWarnings = scope ? warnings.filter((warning) => warningMatchesScope(warning, scope)) : [];
  return {
    enabled: Boolean(scope),
    scope: scope || "off",
    fail: matchedWarnings.length > 0,
    matchedWarningCodes: matchedWarnings.map((warning) => warning.code),
    availableScopes: ["security", "policy", "coordination", "all"]
  };
}

function normalizeStrictScope(value) {
  if (value === true) return "all";
  const scope = String(value || "").trim().toLowerCase();
  if (!scope || scope === "false" || scope === "off") return "";
  if (["security", "policy", "coordination", "all"].includes(scope)) return scope;
  return "all";
}

function warningMatchesScope(warning, scope) {
  if (scope === "all") return true;
  return warningScope(warning.code) === scope;
}

function warningScope(code = "") {
  if (code === "security-vulnerabilities") return "security";
  if (["conflicting-open-intents", "stale-open-intent", "handoff-stale"].includes(code)) return "coordination";
  return "policy";
}
