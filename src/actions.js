export function recommendedActions(manifest = {}, context = {}) {
  const warnings = context.warnings || [];
  const intents = context.intents || [];
  const actions = [];

  if (isStaleWarning(warnings)) {
    actions.push(action("sync-snapshot", "high", "sync", "Refresh the environment snapshot before changing runtimes or package managers.", "aienvmp sync"));
  }

  if (intents.length) {
    actions.push(action("review-open-intents", "high", "coordination", "Review or resolve open environment intents before another agent changes the environment.", "aienvmp context --json"));
  }

  if (warnings.some((warning) => warning.code === "conflicting-open-intents")) {
    actions.push(action("coordinate-agents", "high", "coordination", "Multiple agents are planning changes to the same environment target. Coordinate with the user before proceeding."));
  }

  if (warnings.some((warning) => warning.code === "multi-agent-records")) {
    actions.push(action("review-agent-activity", "high", "coordination", "Multiple agents recorded changes for the same environment target. Review activity and record a handoff before more environment work.", "aienvmp handoff --record --actor agent:id"));
  }

  actions.push(...securityActions(manifest.security));
  actions.push(...sbomRiskActions(manifest.lightSbom?.riskSummary));

  if (hasRuntimePolicyWarning(warnings)) {
    actions.push(action("review-version-policy", "medium", "runtime", "Detected runtime or package manager policy drift. Prefer project-local version files and ask before global changes."));
  }

  if (warnings.some((warning) => warning.code === "handoff-stale")) {
    actions.push(action("record-handoff", "medium", "handoff", "Record an AI handoff after environment changes so the next agent starts with current context.", "aienvmp handoff --record --actor agent:id"));
  }

  if (!actions.length) {
    actions.push(action("continue-project-local", "low", "workflow", "Continue with project-local work. Record intent before environment changes.", "aienvmp intent --actor agent:id --action planned-change"));
  }

  return dedupeActions(actions).slice(0, 8);
}

function sbomRiskActions(risk = {}) {
  const actions = [];
  if (!risk.level) return actions;
  if (risk.scanner === "off" && risk.vulnerabilityCount === 0) {
    actions.push(action("scan-sbom-risk", "medium", "security", "Run a read-only security scan before dependency or release decisions.", "aienvmp sync --security"));
  }
  if (["urgent", "high"].includes(risk.level)) {
    actions.push(action("review-sbom-risk", "high", "security", `Review light SBOM risk summary before dependency changes: ${(risk.signals || []).slice(0, 2).join("; ") || risk.level}.`, "aienvmp plan --write"));
  }
  return actions;
}

function securityActions(security = {}) {
  if (!security.enabled) return [];

  const summary = security.summary || {};
  const highRisk = Number(summary.critical || 0) > 0 || Number(summary.high || 0) > 0;
  const packages = (security.topPackages || []).slice(0, 5);
  if (!highRisk && !packages.length) return [];

  const packageHints = packages.map((pkg) => {
    const fix = pkg.fixVersions?.length ? `fix ${pkg.fixVersions.slice(0, 2).join(", ")}` : pkg.fixAvailable ? "fix available" : "review required";
    const priority = pkg.remediationPriority ? `${pkg.remediationPriority.level}/${pkg.remediationPriority.score}, ` : "";
    return `${pkg.name} (${priority}${pkg.severity}, ${fix})`;
  });

  return [action(
    "review-security-remediation",
    highRisk ? "high" : "medium",
    "security",
    packageHints.length
      ? `Review dependency read set and protocol before remediation: ${packageHints.join("; ")}.`
      : "Review dependency read set and protocol before vulnerability remediation.",
    "aienvmp intent --actor agent:id --action planned-change --target dependency"
  )];
}

function action(id, priority, category, summary, command = "") {
  return { id, priority, category, summary, command };
}

function dedupeActions(actions) {
  const seen = new Set();
  return actions.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function isStaleWarning(warnings) {
  return warnings.some((warning) => warning.code === "manifest-stale" || warning.code === "stale-open-intent");
}

function hasRuntimePolicyWarning(warnings) {
  return warnings.some((warning) => [
    "node-version-mismatch",
    "python-version-mismatch",
    "mixed-node-lockfiles",
    "python-missing",
    "docker-missing",
    "policy-node-mismatch",
    "policy-python-mismatch",
    "policy-package-manager-mismatch"
  ].includes(warning.code));
}
