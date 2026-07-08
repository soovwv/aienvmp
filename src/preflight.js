import { recommendedActions } from "./actions.js";
import { aiDecision } from "./decision.js";
import { enforcementAdvice, enforcementGate } from "./enforcement.js";
import { preflightContract } from "./contract.js";
import { pendingFollowUps } from "./timeline.js";

export function buildPreflight(manifest = {}, warnings = [], intents = [], timeline = []) {
  const decision = aiDecision(warnings, intents);
  const enforcement = enforcementAdvice(warnings);
  const actions = recommendedActions(manifest, { warnings, intents });
  const state = decision.reviewRequired ? "review-required" : "clear";
  const topAction = actions[0] || null;
  const intentTargets = recommendedIntentTargets(manifest, warnings, intents);
  const dependencyReadSet = dependencyPreflightReadSet(manifest);
  const dependencyChangeProtocol = dependencyProtocol(manifest, dependencyReadSet);
  const coordination = coordinationSummary(intents);
  const followUps = pendingFollowUps(timeline);
  const agentActivity = agentActivitySummary(timeline);
  const sbomRisk = manifest.lightSbom?.riskSummary || {};
  const agentPointers = agentPointerSummary(manifest.agentFiles);
  const aiReadiness = aiReadinessSummary({ state, decision, coordination, agentActivity, agentPointers, sbomRisk, followUps });
  const collaboration = collaborationSummary({ state, decision, coordination, agentActivity, followUps, aiReadiness });
  const maintenanceLoop = maintenanceLoopSummary({
    state,
    decision,
    topAction,
    followUps,
    sbomRisk,
    aiDependencyReview: manifest.lightSbom?.aiDependencyReview,
    dependencyReadSet,
    collaboration
  });
  const nextCommand = maintenanceLoop.nextCommand || topAction?.command || decision.nextCommand;
  const aiBootstrap = aiBootstrapSummary({ state, decision, nextCommand, maintenanceLoop, topAction });
  return {
    schemaVersion: 1,
    contract: preflightContract(),
    state,
    summary: state === "clear"
      ? "Project-local work can continue. Record intent before environment changes."
      : "Review warnings or open intents before environment changes.",
    decision,
    enforcement,
    enforcementProfile: {
      defaultMode: "advisory",
      localOperation: "non-blocking",
      strictMode: "optional",
      strictUse: "CI or explicit human-requested checks only",
      gate: enforcementGate(""),
      reason: "Avoid disrupting shared servers or developer machines while still making drift visible.",
      recommendedStrictCommand: enforcement.recommendedCommand,
      strictPlan: enforcement.strictPlan,
      strictDecision: enforcement.strictDecision,
      strictCommands: [
        "aienvmp doctor --strict security",
        "aienvmp doctor --strict policy",
        "aienvmp doctor --strict coordination",
        "aienvmp doctor --strict all"
      ]
    },
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
    aiBootstrap,
    quickstart: agentQuickstart(decision.reviewRequired),
    nextAgent: nextAgentHint(state, dependencyReadSet, dependencyChangeProtocol),
    coordination,
    agentActivity,
    collaboration,
    maintenanceLoop,
    agentPointers,
    aiReadiness,
    sbomRisk,
    followUps,
    intentTargets,
    dependencyReadSet,
    dependencyChangeProtocol,
    artifacts: preflightArtifacts(),
    readOrder: [
      ".aienvmp/status.json",
      ".aienvmp/summary.md",
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
      checkpoint: "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
      recordIntent: intentTargets[0]?.command || "aienvmp intent --actor agent:id --action planned-change"
    },
    topAction,
    nextCommand,
    nextSafeCommand: nextCommand
  };
}

function aiBootstrapSummary({ state, decision, nextCommand, maintenanceLoop = {}, topAction = {} }) {
  const meta = nextCommandMeta({ nextCommand, maintenanceLoop, topAction, decision });
  return {
    purpose: "Shortest AI entry point for this workspace environment.",
    readFirst: ".aienvmp/status.json",
    detailCommand: "aienvmp context --json",
    nextSafeCommand: nextCommand || "aienvmp status --json",
    nextSafeCommandSource: meta.source,
    nextSafeCommandReason: meta.reason,
    localMode: "advisory",
    projectLocalWork: decision.canContinueProjectLocalWork ? "allowed" : "review-first",
    environmentChanges: decision.canChangeEnvironmentWithoutReview ? "intent-first" : "review-first",
    rule: state === "clear"
      ? "Continue project-local work; record intent before shared environment changes."
      : "Review context before shared environment changes; local checks remain non-blocking."
  };
}

function nextCommandMeta({ nextCommand, maintenanceLoop = {}, topAction = {}, decision = {} }) {
  if (nextCommand && nextCommand === maintenanceLoop.nextCommand) {
    return {
      source: maintenanceLoop.nextCommandSource || "maintenance-loop",
      reason: maintenanceLoop.nextCommandReason || maintenanceLoop.rule || "Follow the recurring AI maintenance loop."
    };
  }
  if (nextCommand && topAction.command && nextCommand === topAction.command) {
    return {
      source: "recommended-action",
      reason: topAction.summary || "Use the highest-priority recommended action."
    };
  }
  if (nextCommand && nextCommand === decision.nextCommand) {
    return {
      source: "decision",
      reason: decision.reviewRequired ? "Review is required before shared environment changes." : "Project-local work can continue; record intent before environment changes."
    };
  }
  return {
    source: "fallback",
    reason: "Read status and context before changing shared environment state."
  };
}

function maintenanceLoopSummary({ state, decision, topAction, followUps, sbomRisk, aiDependencyReview = {}, dependencyReadSet, collaboration }) {
  const followUpCommand = firstFollowUpCommand(followUps);
  const dependencyAware = dependencyReadSet.length > 0;
  const securityReview = ["urgent", "high", "medium"].includes(sbomRisk?.level || "");
  const scannerOff = sbomRisk?.scanner === "off" || aiDependencyReview.securityConfidence === "scanner-off";
  const nextCommand = followUpCommand
    || collaboration?.nextCommand
    || topAction?.command
    || decision?.nextCommand
    || "aienvmp status --json";
  const nextCommandSource = followUpCommand
    ? "follow-up"
    : collaboration?.nextCommand
      ? "collaboration"
      : topAction?.command
        ? "recommended-action"
        : decision?.nextCommand
          ? "decision"
          : "fallback";
  const nextCommandReason = followUpCommand
    ? "A previous environment-affecting record still needs refresh, status, or handoff follow-up."
    : collaboration?.nextCommand
      ? collaboration.rule || "Collaboration signals should be reviewed before shared environment changes."
      : topAction?.summary || (decision?.reviewRequired ? "Review is required before shared environment changes." : "Project-local work can continue; record intent before environment changes.");
  const triggers = [
    "start of an AI coding session",
    "before runtime, dependency, package manager, Docker, or global tool changes",
    "after accepted environment changes",
    "before handing work to another AI or human"
  ];
  if (securityReview) triggers.push("before dependency or release decisions when SBOM risk is not clear");
  return {
    mode: "advisory",
    localImpact: "read-only until an AI or human intentionally records intent, checkpoint, or handoff",
    state,
    nextCommand,
    nextCommandSource,
    nextCommandReason,
    triggers,
    readOrder: [
      ".aienvmp/status.json",
      ".aienvmp/summary.md",
      "aienvmp context --json",
      "AIENV.md"
    ],
    cycle: [
      { step: "refresh", command: "aienvmp sync", when: "workspace env map may be stale" },
      { step: "decide", command: "aienvmp status --json", when: "first AI read or quick gate" },
      { step: "inspect", command: "aienvmp context --json", when: "status is review-required or details are needed" },
      { step: "plan", command: "aienvmp plan --write", when: "warnings, SBOM risk, or multi-agent activity need a read-only plan" },
      { step: "intent", command: dependencyAware ? "aienvmp intent --actor agent:id --action planned-change --target dependency" : "aienvmp intent --actor agent:id --action planned-change --target environment", when: "before environment-affecting changes" },
      { step: "checkpoint", command: dependencyAware ? "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency" : "aienvmp checkpoint --actor agent:id --summary what-changed --target environment", when: "after accepted environment-affecting changes" },
      { step: "handoff", command: "aienvmp handoff --record --actor agent:id", when: "before another AI continues environment work" }
    ],
    sbomCommand: securityReview || scannerOff ? "aienvmp sync --security" : "aienvmp sbom --json",
    sbomReview: sbomReviewSummary({ sbomRisk, aiDependencyReview, securityReview, scannerOff }),
    rule: "Keep local operation advisory and lightweight; use strict checks only when CI or the user explicitly asks."
  };
}

function sbomReviewSummary({ sbomRisk = {}, aiDependencyReview = {}, securityReview = false, scannerOff = false }) {
  const status = securityReview || aiDependencyReview.status === "review" ? "review" : "ready";
  const before = aiDependencyReview.beforeDependencyChange?.length
    ? aiDependencyReview.beforeDependencyChange
    : [
        scannerOff ? "aienvmp sync --security" : "aienvmp sbom --json",
        "aienvmp intent --actor agent:id --action dependency-review --target dependency",
        "aienvmp plan --write"
      ];
  const after = aiDependencyReview.afterDependencyChange?.length
    ? aiDependencyReview.afterDependencyChange
    : [
        "run the narrowest relevant project validation",
        "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"
      ];
  return {
    status,
    riskLevel: sbomRisk.level || "unknown",
    score: Number(sbomRisk.score || 0),
    securityConfidence: aiDependencyReview.securityConfidence || (scannerOff ? "scanner-off" : "unknown"),
    reviewTargets: aiDependencyReview.reviewTargets || sbomRisk.reviewTargets || [],
    nextCommand: before[0] || "aienvmp sbom --json",
    beforeDependencyChange: before,
    afterDependencyChange: after,
    rule: status === "review"
      ? "Review SBOM risk, package manager policy, and dependency read set before dependency changes."
      : "Keep SBOM review lightweight; run security scan before dependency or release decisions when scanner confidence is low."
  };
}

function collaborationSummary({ state, decision, coordination, agentActivity, followUps, aiReadiness }) {
  const conflictTargets = coordination?.conflictTargets || [];
  const multiActorTargets = agentActivity?.multiActorTargets || [];
  const followUpTargets = (followUps || []).map((item) => item.target || "environment");
  const activeTargets = unique([...conflictTargets, ...multiActorTargets, ...followUpTargets]);
  const reviewSignals = [];
  if (conflictTargets.length) reviewSignals.push("open intent conflict");
  if (multiActorTargets.length) reviewSignals.push("multi-agent environment record");
  if ((followUps || []).length) reviewSignals.push("pending post-change follow-up");
  if (state !== "clear") reviewSignals.push("preflight review required");

  const nextCommand = firstFollowUpCommand(followUps)
    || (multiActorTargets.length ? "aienvmp handoff --record --actor agent:id" : "")
    || (conflictTargets.length ? "aienvmp plan --write" : "")
    || (decision?.canChangeEnvironmentWithoutReview
      ? "aienvmp intent --actor agent:id --action planned-change --target environment"
      : "aienvmp context --json");

  const status = reviewSignals.length ? "review-before-env-change" : "clear";
  return {
    status,
    mode: "advisory",
    activeTargets,
    reviewSignals,
    projectLocalWork: aiReadiness?.projectLocalWork || (decision?.canContinueProjectLocalWork ? "allowed" : "review-first"),
    environmentChanges: reviewSignals.length ? "intent-review-handoff-first" : "intent-first",
    nextCommand,
    rule: reviewSignals.length
      ? "Do not install, remove, upgrade, downgrade, or switch shared environment tools until the listed collaboration signals are reviewed."
      : "Multiple AI agents may continue project-local work; record intent before shared environment changes.",
    commands: {
      read: "aienvmp status --json",
      plan: "aienvmp plan --write",
      handoff: "aienvmp handoff --record --actor agent:id",
      checkpoint: "aienvmp checkpoint --actor agent:id --summary what-changed --target environment"
    }
  };
}

function aiReadinessSummary({ state, decision, coordination, agentActivity, agentPointers, sbomRisk, followUps }) {
  const blockers = [];
  const review = [];
  if (state !== "clear") review.push("status review required");
  if ((coordination?.conflictTargets || []).length) review.push("open intent conflicts");
  if ((agentActivity?.multiActorTargets || []).length) review.push("multi-agent environment activity");
  if ((followUps || []).length) review.push("pending environment follow-ups");
  if (["urgent", "high"].includes(sbomRisk?.level)) review.push("high light SBOM risk");
  if ((agentPointers?.targets || []).length && (agentPointers?.installedCount || 0) === 0) review.push("no agent instruction pointer installed");

  const level = review.length ? "review" : "ready";
  const next = level === "ready"
    ? "AI agents can continue project-local work; record intent before environment changes."
    : "Review listed signals before another AI changes runtimes, dependencies, package managers, Docker, or global tools.";
  const safeProjectLocalActions = [
    "read status, summary, context, env map, SBOM, and timeline artifacts",
    "continue code-only work that does not install, remove, upgrade, downgrade, or switch tools",
    "write a plan or intent before changing runtimes, dependencies, package managers, Docker, or global tools"
  ];
  const reviewOnlyEnvironmentChanges = review.length
    ? "Record intent and review signals before environment changes; strict failure remains opt-in."
    : "Record intent before environment changes; strict failure remains opt-in.";
  return {
    level,
    requiresHumanReview: review.length > 0,
    projectLocalWork: decision?.canContinueProjectLocalWork ? "allowed" : "review-first",
    environmentChanges: decision?.canChangeEnvironmentWithoutReview ? "allowed" : "intent-and-review-first",
    safeProjectLocalActions,
    reviewOnlyEnvironmentChanges,
    signals: review,
    blockers,
    next,
    mode: "advisory"
  };
}

function agentActivitySummary(timeline = []) {
  const lastHandoffAt = lastTime(timeline, (item) => item.type === "agent-handoff");
  const envRecords = timeline
    .filter((item) => isEnvironmentRecord(item))
    .filter((item) => !lastHandoffAt || timeOf(item) > lastHandoffAt);
  const byTarget = new Map();
  for (const item of envRecords) {
    const target = normalizeTarget(item.target || targetFromText(`${item.summary || ""} ${item.action || ""}`) || "environment") || "environment";
    const summary = byTarget.get(target) || { target, count: 0, actors: [], latest: null, multiActor: false };
    summary.count += 1;
    if (item.actor && !summary.actors.includes(item.actor)) summary.actors.push(item.actor);
    if (!summary.latest || timeOf(item) > timeOf(summary.latest)) summary.latest = item;
    byTarget.set(target, summary);
  }
  const targets = [...byTarget.values()].map((item) => ({
    target: item.target,
    count: item.count,
    actors: item.actors.slice(0, 5),
    latestAt: item.latest?.at || "",
    latestSummary: item.latest?.summary || item.latest?.action || item.latest?.type || "",
    multiActor: item.actors.length > 1
  }));
  const multiActorTargets = targets.filter((item) => item.multiActor).map((item) => item.target);
  return {
    sinceLastHandoff: lastHandoffAt ? "after-last-handoff" : "all-recorded",
    environmentRecordCount: envRecords.length,
    targets,
    multiActorTargets,
    next: multiActorTargets.length
      ? "Run handoff and review follow-ups before another environment change."
      : envRecords.length
        ? "Run handoff before another AI continues environment work."
        : "No environment records need coordination."
  };
}

export function agentPointerSummary(agentFiles = {}) {
  const entries = Object.entries(agentFiles || {}).filter(([name]) => ["agents", "claude", "gemini"].includes(name));
  const targets = entries.map(([name, item]) => {
    const normalized = normalizeAgentFile(item);
    return {
      name,
      role: normalized.role || (name === "agents" ? "codex" : name),
      file: normalized.path || defaultAgentFile(name),
      exists: normalized.exists,
      hasPointer: normalized.hasAienvmpPointer,
      installCommand: normalized.installCommand || defaultInstallCommand(name)
    };
  });
  const installed = targets.filter((item) => item.hasPointer);
  const missing = targets.filter((item) => !item.hasPointer);
  return {
    installedCount: installed.length,
    missingCount: missing.length,
    installed: installed.map((item) => item.role),
    missing: missing.map((item) => item.role),
    targets,
    discovery: installed.length
      ? `ready: ${installed.map((item) => item.role).join(", ")}`
      : "missing: run aienvmp onboard",
    onboardCommand: "aienvmp onboard",
    next: missing.length
      ? `Run aienvmp onboard for Codex, Claude, and Gemini, or install one pointer with ${missing[0].installCommand}.`
      : "Agent instruction pointers are installed for detected AI instruction files.",
    mode: "advisory"
  };
}

function normalizeAgentFile(item) {
  if (typeof item === "boolean") {
    return { exists: item, hasAienvmpPointer: item };
  }
  return {
    path: item?.path || "",
    exists: item?.exists === true,
    hasAienvmpPointer: item?.hasAienvmpPointer === true,
    installCommand: item?.installCommand || "",
    role: item?.role || ""
  };
}

function defaultAgentFile(name) {
  if (name === "claude") return "CLAUDE.md";
  if (name === "gemini") return "GEMINI.md";
  return "AGENTS.md";
}

function defaultInstallCommand(name) {
  if (name === "claude") return "aienvmp snippet claude --write";
  if (name === "gemini") return "aienvmp snippet gemini --write";
  return "aienvmp snippet codex --write";
}

function coordinationSummary(intents = []) {
  const byTarget = new Map();
  for (const intent of intents) {
    const target = normalizeTarget(intent.target || targetFromText(intent.action) || "environment") || "environment";
    const item = byTarget.get(target) || { target, count: 0, actors: [], actions: [], conflict: false };
    item.count += 1;
    if (intent.actor && !item.actors.includes(intent.actor)) item.actors.push(intent.actor);
    if (intent.action) item.actions.push(intent.action);
    byTarget.set(target, item);
  }
  const targets = [...byTarget.values()].map((item) => ({
    target: item.target,
    count: item.count,
    actors: item.actors.slice(0, 5),
    actions: item.actions.slice(-3),
    conflict: item.count > 1 && item.actors.length > 1
  }));
  const conflictTargets = targets.filter((item) => item.conflict).map((item) => item.target);
  return {
    openIntentCount: intents.length,
    targets,
    conflictTargets,
    next: conflictTargets.length
      ? "Review or resolve conflicting intents before environment changes."
      : intents.length
        ? "Check open intents before environment changes."
        : "No open environment intents."
  };
}

function isEnvironmentRecord(item = {}) {
  if (item.type === "detected-change") return false;
  const text = `${item.type || ""} ${item.target || ""} ${item.summary || ""} ${item.action || ""} ${item.change?.scope || ""} ${item.change?.key || ""}`.toLowerCase();
  return [
    "dependency",
    "dependencies",
    "package",
    "lockfile",
    "vulnerability",
    "runtime",
    "node",
    "python",
    "docker",
    "package manager",
    "package-manager",
    "npm",
    "pnpm",
    "yarn",
    "uv",
    "pip",
    "pipx",
    "global"
  ].some((token) => text.includes(token));
}

function lastTime(items = [], predicate) {
  const item = [...items].reverse().find(predicate);
  return item ? timeOf(item) : 0;
}

function timeOf(item = {}) {
  const value = new Date(item.at || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function nextAgentHint(state, dependencyReadSet = [], dependencyChangeProtocol = {}) {
  const firstDependency = dependencyReadSet[0];
  const dependencyFiles = firstDependency
    ? [firstDependency.manifest, ...(firstDependency.lockfiles || [])].filter(Boolean)
    : [];
  return {
    handoffCommand: dependencyChangeProtocol.commands?.handoff || "aienvmp handoff --record --actor agent:id",
    readFirst: ".aienvmp/status.json",
    readSummary: ".aienvmp/summary.md",
    readNext: "aienvmp context --json",
    reviewState: state,
    dependencyFiles,
    dependencyProtocol: dependencyChangeProtocol.commands?.recordIntent
      ? "record dependency intent, sync after change, then record dependency-change"
      : "no dependency protocol detected",
    rule: state === "clear"
      ? "Next AI may continue project-local work; record intent before environment changes."
      : "Next AI should review warnings or open intents before environment changes."
  };
}

function dependencyProtocol(manifest = {}, dependencyReadSet = []) {
  const pmPolicy = manifest.lightSbom?.packageManagerPolicy || {};
  return {
    mode: "advisory",
    appliesWhen: "Before package, lockfile, or vulnerability remediation changes.",
    packageManagerPolicy: pmPolicy.status || "not-detected",
    beforeChange: [
      "Read dependencyReadSet manifests and lockfiles.",
      "Check lightSbom.packageManagerPolicy before choosing npm, pnpm, yarn, pip, uv, or another manager.",
      "Record dependency intent before edits."
    ],
    commands: {
      readContext: "aienvmp context --json",
      recordIntent: "aienvmp intent --actor agent:id --action planned-change --target dependency",
      refreshAfterChange: "aienvmp sync",
      recordAfterChange: "aienvmp record --actor agent:id --summary dependency-change --target dependency",
      checkpointAfterChange: "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency",
      handoff: "aienvmp handoff --record --actor agent:id"
    },
    mustNotDo: [
      "Do not switch package managers because another lockfile exists without user approval.",
      "Do not delete lockfiles or rewrite dependency manifests only to satisfy a tool preference.",
      "Do not run automatic fix commands without reviewing the dependency read set first."
    ],
    readSetCount: dependencyReadSet.length
  };
}

function dependencyPreflightReadSet(manifest = {}) {
  const hints = manifest.lightSbom?.dependencyChangeHints || [];
  const readSet = hints.map((hint) => ({
    manifest: hint.manifest,
    ecosystem: hint.ecosystem || "unknown",
    manager: hint.manager || "unknown",
    groups: hint.groups || [],
    lockfiles: (hint.lockfiles || []).map((item) => item.file).filter(Boolean),
    riskPackages: (hint.riskPackages || []).map((item) => item.name).filter(Boolean).slice(0, 5),
    reason: hint.riskPackages?.length
      ? "Read before dependency or security remediation; vulnerable packages are linked to this manifest."
      : "Read before dependency changes; this manifest defines project packages."
  }));
  if (readSet.length) return readSet.slice(0, 8);

  const manifests = manifest.lightSbom?.summary?.manifests || manifest.dependencySnapshot?.manifests || [];
  const lockfiles = (manifest.lightSbom?.summary?.lockfiles || manifest.dependencySnapshot?.lockfiles || [])
    .map((item) => item.file || item)
    .filter(Boolean);
  if (!manifests.length && !lockfiles.length) return [];
  return [{
    manifest: manifests[0] || "",
    ecosystem: "unknown",
    manager: "unknown",
    groups: [],
    lockfiles,
    riskPackages: [],
    reason: "Read detected dependency files before package changes."
  }];
}

function recommendedIntentTargets(manifest = {}, warnings = [], intents = []) {
  const targets = [];
  for (const warning of warnings) {
    addTarget(targets, targetFromWarning(warning), warning.message || warning.code, warning.code);
  }
  for (const intent of intents) {
    addTarget(targets, intent.target || targetFromText(intent.action), `Open intent from ${intent.actor || "unknown"}.`, "open-intent");
  }
  const pmPolicy = manifest.lightSbom?.packageManagerPolicy;
  if (pmPolicy?.status === "review-required") {
    addTarget(targets, "package-manager", pmPolicy.guidance, "package-manager-policy");
  }
  if (Number(manifest.security?.summary?.total || 0) > 0) {
    addTarget(targets, "dependency", "Security findings are dependency-related; record dependency intent before remediation.", "security");
  }
  if (Number(manifest.dependencySnapshot?.summary?.packages || 0) > 0) {
    addTarget(targets, "dependency", "Dependency manifests detected; use this target before package changes.", "dependency-snapshot");
  }
  if (!targets.length) {
    addTarget(targets, "environment", "Default target when the change affects runtime, dependency, container, or global tool state.", "default");
  }
  return targets.slice(0, 5).map((item) => ({
    ...item,
    command: `aienvmp intent --actor agent:id --action planned-change --target ${item.target}`
  }));
}

function addTarget(targets, target, reason, source) {
  const normalized = normalizeTarget(target);
  if (!normalized) return;
  const existing = targets.find((item) => item.target === normalized);
  if (existing) {
    if (source && !existing.sources.includes(source)) existing.sources.push(source);
    return;
  }
  targets.push({ target: normalized, reason: reason || "Environment change target.", sources: source ? [source] : [] });
}

function targetFromWarning(warning = {}) {
  if (warning.target) return warning.target;
  const code = warning.code || "";
  if (code.includes("node")) return "node";
  if (code.includes("python")) return "python";
  if (code.includes("docker")) return "docker";
  if (code.includes("lockfile") || code.includes("package-manager")) return "package-manager";
  if (code.includes("security")) return "dependency";
  if (code.includes("intent") || code.includes("handoff")) return "coordination";
  return targetFromText(`${warning.message || ""} ${code}`);
}

function targetFromText(text = "") {
  const normalized = String(text).toLowerCase();
  for (const target of ["node", "python", "docker", "package-manager", "dependency", "npm", "pnpm", "yarn", "uv", "pip", "pipx"]) {
    if (normalized.includes(target)) return target;
  }
  if (normalized.includes("package manager") || normalized.includes("lockfile")) return "package-manager";
  if (normalized.includes("vulnerab") || normalized.includes("package")) return "dependency";
  return "";
}

function normalizeTarget(target = "") {
  const normalized = String(target).trim().toLowerCase();
  if (["npm", "pnpm", "yarn"].includes(normalized)) return "package-manager";
  if (["pip", "pipx", "uv"].includes(normalized)) return "python";
  return normalized;
}

function unique(items = []) {
  return [...new Set(items.map((item) => normalizeTarget(item)).filter(Boolean))];
}

function firstFollowUpCommand(followUps = []) {
  for (const item of followUps || []) {
    const command = item.commands?.find(Boolean);
    if (command) return command;
  }
  return "";
}

function agentQuickstart(reviewRequired) {
  return {
    label: "10-second AI flow",
    readFirst: "aienvmp status --write",
    detailCommand: "aienvmp context --json",
    beforeEnvironmentChange: "aienvmp intent --actor agent:id --action planned-change --target <runtime|package-manager|docker|dependency>",
    afterEnvironmentChange: "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
    checkpointAfterChange: "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
    handoff: "aienvmp handoff --record --actor agent:id",
    rule: reviewRequired
      ? "Review warnings or open intents before environment changes; project-local work may continue."
      : "Continue project-local work; record intent before environment changes."
  };
}

export function preflightArtifacts() {
  return {
    status: ".aienvmp/status.json",
    summary: ".aienvmp/summary.md",
    envMap: "AIENV.md",
    manifest: ".aienvmp/manifest.json",
    sbom: ".aienvmp/sbom.json",
    cyclonedx: ".aienvmp/sbom.cdx.json",
    dashboard: ".aienvmp/dashboard.html",
    planJson: ".aienvmp/plan.json",
    planMarkdown: ".aienvmp/plan.md",
    intents: ".aienvmp/intents.jsonl",
    timeline: ".aienvmp/timeline.jsonl"
  };
}
