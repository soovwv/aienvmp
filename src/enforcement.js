const STRICT_SCOPES = ["security", "policy", "coordination", "all"];

export function strictResult(warnings = [], args = {}) {
  const scope = normalizeStrictScope(args.strict || (args.ci ? "all" : ""));
  const matchedWarnings = scope ? warnings.filter((warning) => warningMatchesScope(warning, scope)) : [];
  const gate = enforcementGate(scope);
  return {
    enabled: Boolean(scope),
    scope: scope || "off",
    fail: matchedWarnings.length > 0,
    matchedWarningCodes: matchedWarnings.map((warning) => warning.code),
    availableScopes: STRICT_SCOPES,
    gate
  };
}

export function enforcementAdvice(warnings = []) {
  const scopeResults = STRICT_SCOPES.map((scope) => {
    const result = strictResult(warnings, { strict: scope });
    return {
      scope,
      status: result.fail ? "fail" : "pass",
      matchedWarningCodes: result.matchedWarningCodes
    };
  });
  const suggestedStrictScopes = scopeResults
    .filter((item) => item.scope !== "all" && item.status === "fail")
    .map((item) => item.scope);
  return {
    mode: "advisory-by-default",
    localBehavior: "non-blocking",
    ciBehavior: "strict-only-when-requested",
    gate: enforcementGate(""),
    suggestedStrictScopes,
    scopes: scopeResults,
    strictPlan: strictScopePlan(suggestedStrictScopes, scopeResults),
    recommendedCommand: suggestedStrictScopes.length
      ? `aienvmp doctor --strict ${suggestedStrictScopes[0]}`
      : "aienvmp doctor --strict all",
    note: "Use strict mode in CI or explicit checks; do not block local operation unless the user requests it."
  };
}

export function strictScopePlan(suggestedStrictScopes = [], scopeResults = []) {
  const firstScope = suggestedStrictScopes[0] || "all";
  return {
    mode: "advisory-local-strict-ci",
    localDefault: "aienvmp doctor --json",
    recommendedStrictScope: firstScope,
    recommendedStrictCommand: `aienvmp doctor --strict ${firstScope}`,
    ciCommand: `aienvmp doctor --strict ${firstScope} --json`,
    allScopesCommand: "aienvmp doctor --strict all --json",
    scopeStatuses: scopeResults.map((item) => ({
      scope: item.scope,
      status: item.status,
      matchedWarningCodes: item.matchedWarningCodes || []
    })),
    rule: suggestedStrictScopes.length
      ? "Use the narrowest failing strict scope first; keep local operation advisory unless CI or the user explicitly requests failure."
      : "No scope currently fails; use --strict all only for explicit CI health checks."
  };
}

export function enforcementGate(scope = "") {
  const strictScope = normalizeStrictScope(scope);
  return {
    defaultMode: "advisory",
    strictMode: strictScope || "off",
    localDefault: "warn-only",
    failCondition: strictScope ? `matching warnings in ${strictScope}` : "never in default mode",
    exitCode: strictScope ? "1 when matching warnings exist" : "0 unless the command itself errors",
    rule: "Do not block local or shared machine operation unless --strict or --ci is explicitly requested."
  };
}

function normalizeStrictScope(value) {
  if (value === true) return "all";
  const scope = String(value || "").trim().toLowerCase();
  if (!scope || scope === "false" || scope === "off") return "";
  if (STRICT_SCOPES.includes(scope)) return scope;
  return "all";
}

function warningMatchesScope(warning, scope) {
  if (scope === "all") return true;
  return warningScope(warning.code) === scope;
}

function warningScope(code = "") {
  if (code === "security-vulnerabilities") return "security";
  if (["conflicting-open-intents", "stale-open-intent", "handoff-stale", "multi-agent-records"].includes(code)) return "coordination";
  return "policy";
}
