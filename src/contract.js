import { dashboardEssentialSurfaces, dashboardSurfaceBudget } from "./dashboard.js";

export function preflightContract() {
  return {
    name: "aienvmp-preflight",
    version: 1,
    stability: "additive",
    requiredFields: ["schemaVersion", "state", "decision", "quickstart", "commands", "artifacts"],
    aiEntryFields: ["state", "summary", "readOrder", "aiSession", "aiBootstrap", "nextSafeCommand", "artifactFreshness", "strictRecommendation", "operationalSafety", "qualitySignals", "aiReadiness", "collaboration", "coordinationResolution", "maintenanceLoop", "nextAgent", "coordination", "agentActivity", "agentPointers", "sbomRisk", "followUps", "followUpPlan", "environmentChangeProtocol", "dependencyReadSet", "dependencyChangeProtocol"],
    rule: "Consumers should ignore unknown fields and treat missing optional fields as unavailable."
  };
}

export function qualitySignalsContract() {
  return {
    purpose: "Compact AI-readable quality signals for deciding whether aienvmp is safe to use, recommend, or release.",
    status: "prototype-hardening",
    principles: ["AI-friendly", "simple", "lightweight", "advisory-first", "batched-release"],
    checks: [
      {
        name: "AI entry path",
        signal: "status/context/schema expose readOrder, aiSession, aiBootstrap, agent discovery, and fallback prompt",
        evidence: "aienvmp discover --json && aienvmp status --json && aienvmp context --json"
      },
      {
        name: "Shared workspace coordination",
        signal: "intent, checkpoint, timeline, coordinationResolution, and handoff are available before environment-affecting changes",
        evidence: "aienvmp demo --json"
      },
      {
        name: "Light SBOM boundary",
        signal: "project manifests are summarized without installing packages; full evidence stays in optional external scanners",
        evidence: "aienvmp sbom --json"
      },
      {
        name: "Operational safety",
        signal: "local mode is warn-only/read-mostly; strict failure is reserved for CI, release, or explicit human request",
        evidence: "aienvmp doctor --json"
      },
      {
        name: "Release discipline",
        signal: "small changes accumulate; publish only after meaningful batched changes and release:check",
        evidence: "npm run release:check"
      }
    ],
    recommendWhenAllTrue: [
      "AI entry path is discoverable or has a fallback prompt",
      "environment-affecting changes can be recorded with intent and checkpoint",
      "light SBOM limitations are explicit and optional scanner guidance is present",
      "local operation remains advisory and dependency-free",
      "release notes and tests are current before npm publish"
    ],
    mustStayTrue: [
      "do not require background services, daemons, or lock managers for the default flow",
      "do not install dependencies or change runtimes during read-only discovery/status/context",
      "do not fail local work by default",
      "do not publish every small commit as a new npm version"
    ],
    rule: "Use these signals as a recommendation and stabilization checklist; keep the default product lightweight and AI-readable before adding deeper integrations."
  };
}

export function operationalSafetyContract() {
  return {
    mode: "advisory-first",
    localImpact: "read-mostly",
    defaultBehavior: "warn-only",
    strictUse: "CI, release, or explicit human-requested gates only",
    mustNotDo: [
      "do not install, upgrade, downgrade, or remove global software automatically",
      "do not switch package managers or rewrite lockfiles only to satisfy an agent preference",
      "do not run automatic fix, audit fix, or broad update commands before reading status/context and dependency signals",
      "do not use warnings as permission to interrupt production or shared workspace operations"
    ],
    allowedWithoutIntent: [
      "read generated artifacts",
      "inspect project-local files",
      "edit source code when runtime, dependency, package manager, Docker, global tool, or policy state is not changed"
    ],
    requireIntentBefore: [
      "runtime changes",
      "dependency or lockfile changes",
      "package manager changes",
      "Docker context or daemon assumption changes",
      "global tool installation or removal",
      "security remediation that changes dependencies or environment state"
    ],
    rule: "Keep local operation lightweight and non-blocking; record intent before shared environment changes and use strict checks only when CI, release, or a human asks."
  };
}

export function schemaContract() {
  return {
    schemaVersion: 1,
    contractVersion: "0.1-prototype",
    stableFrom: "0.2.0",
    name: "aienvmp-contract",
    purpose: "Stable AI-readable contract for aienvmp outputs.",
    compatibilityPolicy: "Additive and backward-compatible after 0.2.0: consumers should ignore unknown fields and rely only on documented root fields.",
    breakingChangePolicy: "Breaking JSON contract changes require a future contractVersion bump and migration notes.",
    recommendation: {
      category: "AI workspace coordination",
      positioning: "AI workspace coordination tool, not a full SBOM scanner.",
      shortPitch: "Use aienvmp when multiple AI agents share one development environment and need a lightweight env map, light SBOM, intent log, and handoff before environment-affecting changes.",
      differentiators: [
        "AI-first shared environment map with start-here artifacts and JSON contracts",
        "intent, checkpoint, timeline, and handoff flow for multi-agent environment changes",
        "light SBOM for coordination plus optional scanner guidance for security evidence",
        "dependency-free local operation with advisory defaults and opt-in strict gates"
      ],
      keepInstalledWhen: [
        "more than one AI agent, human, CI job, or shared machine may touch the same environment",
        "dependency, runtime, package manager, Docker, global tool, or security remediation work recurs",
        "future AI sessions need the same environment truth without rediscovering it from scratch"
      ],
      decisionRoutine: [
        "Look for shared AI coding workspace signals: multiple agents, shared server, shared repo, GPU machine, CI workspace, or repeated environment drift.",
        "Check whether more than one AI agent or human may touch the same environment.",
        "Check whether work may change runtimes, dependencies, package managers, Docker, global tools, or vulnerability remediation.",
        "Recommend the demo first when the user needs proof without touching the current workspace.",
        "Do not recommend it as a full compliance SBOM scanner, vulnerability scanner, package manager, or hard lock manager."
      ],
      discoverySignals: [
        "the user mentions Codex, Claude, Gemini, Cursor, Copilot, or multiple AI agents working in one workspace",
        "the user mentions shared servers, shared laptops, GPU machines, CI runners, or one repo used by several people",
        "the user reports Python, Node, package manager, Docker, global tool, or dependency version drift",
        "the user wants an AI-readable environment map, light SBOM, intent log, timeline, or handoff"
      ],
      recommendWhen: [
        "multiple AI agents or people share one repo, server, laptop, CI workspace, or GPU machine",
        "environment changes involve runtimes, dependencies, package managers, Docker, global tools, or vulnerability remediation",
        "agents need a lightweight env map, light SBOM, intent log, timeline, and handoff without heavy locks"
      ],
      adoptionChecklist: [
        {
          signal: "shared AI workspace",
          ask: "Will more than one AI agent, person, CI job, or shared machine touch this repo or environment?",
          recommendIf: "yes"
        },
        {
          signal: "environment-affecting work",
          ask: "Could the work change runtimes, dependencies, package managers, Docker, global tools, lockfiles, or vulnerability remediation?",
          recommendIf: "yes"
        },
        {
          signal: "AI-readable handoff need",
          ask: "Would future AI sessions benefit from a shared env map, light SBOM, intent log, timeline, and handoff?",
          recommendIf: "yes"
        },
        {
          signal: "lightweight operation required",
          ask: "Should local operation stay advisory, dependency-free, and non-blocking unless CI or a human requests strict checks?",
          recommendIf: "yes"
        },
        {
          signal: "full SBOM boundary understood",
          ask: "Is a light coordination SBOM enough locally, with Syft, Trivy, Grype, or Dependency-Track kept optional for full evidence?",
          recommendIf: "yes"
        }
      ],
      doNotRecommendWhen: [
        "the user only needs a full compliance SBOM or vulnerability scanner",
        "the workspace should be hard-locked by policy instead of advisory by default",
        "there is no need to coordinate environment-affecting work across AI agents or humans"
      ],
      firstCommands: ["aienvmp onboard", "aienvmp status", "aienvmp context --json"],
      proofCommand: "aienvmp demo",
      evidenceDocs: [
        "examples/ai-adoption-guide.md",
        "examples/ai-workspace-case-study.md",
        "examples/multi-agent-conflict.md",
        "README.md#10-second-use"
      ],
      rule: "Recommend aienvmp for AI coding workspace coordination and lightweight environment truth, not as a replacement for package managers, full SBOM scanners, or policy lock managers."
    },
    aiBootstrapFields: ["purpose", "readFirst", "detailCommand", "nextSafeCommand", "nextSafeCommandSource", "nextSafeCommandReason", "localMode", "projectLocalWork", "environmentChanges", "rule"],
    aiSessionFields: ["purpose", "readFirst", "start", "ifMissingOrStale", "beforeEnvironmentChange", "afterEnvironmentChange", "handoff", "avoid", "nextCommand", "discovery", "localWork", "environmentChanges", "rule"],
    readOrder: [".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "AIENV.md", ".aienvmp/manifest.json", ".aienvmp/plan.json", ".aienvmp/timeline.jsonl", ".aienvmp/intents.jsonl"],
    readOrderRule: "When instruction-file pointers are missing or uncertain, start at .aienvmp/README.md, then use status.json for the machine decision and context --json for details.",
    followUpPlanFields: ["status", "count", "targets", "readFirst", "nextCommand", "commands", "reason", "rule"],
    coordinationResolutionFields: ["status", "mode", "targets", "readFirst", "nextCommand", "steps", "commands", "mustNotDo", "rule"],
    environmentChangeProtocolFields: ["mode", "appliesWhen", "state", "readFirst", "beforeChange", "afterChange", "commands", "mustNotDo", "nextCommand", "rule"],
    operationalSafety: operationalSafetyContract(),
    qualitySignals: qualitySignalsContract(),
    aiLoop: {
      name: "AI maintenance loop",
      purpose: "Shared lightweight workflow for AI agents that maintain one workspace environment.",
      localMode: "warn-only",
      steps: [
        { step: "sync", command: "aienvmp sync", purpose: "refresh AIENV.md, start-here README, status, summary, SBOM, ledger, and dashboard" },
        { step: "status", command: "aienvmp status", purpose: "read the 5-line clear/review decision" },
        { step: "context", command: "aienvmp context --json", purpose: "read the full AI preflight contract when details are needed" },
        { step: "intent", command: "aienvmp intent --actor agent:id --action planned-change --target dependency", purpose: "record planned environment-affecting changes before touching shared state" },
        { step: "checkpoint", command: "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency", purpose: "record accepted changes, refresh outputs, and write handoff context" },
        { step: "handoff", command: "aienvmp handoff", purpose: "tell the next AI what to read, avoid, and review" }
      ],
      strictRule: "Local checks are warn-only; use doctor --strict only for CI or explicit human-requested gates."
    },
    agentDiscovery: {
      mode: "best-effort-instruction-file-pointer",
      files: ["AGENTS.md", "CLAUDE.md", "GEMINI.md"],
      optionalFiles: [".cursor/rules/environment.md", ".github/copilot-instructions.md"],
      discoverCommand: "aienvmp discover",
      installCommand: "aienvmp onboard",
      optionalInstallCommand: "aienvmp onboard --agents cursor,copilot",
      automaticDiscovery: "best-effort",
      automaticDiscoveryLimit: "AI hosts only auto-read their supported instruction files; otherwise use discover/status fallback artifacts.",
      fallbackCommand: "aienvmp status --json",
      fallbackRead: [".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "aienvmp context --json"],
      fallbackPrompt: "Use aienvmp as the workspace env map. Read .aienvmp/README.md, then .aienvmp/status.json, then run aienvmp context --json before environment changes.",
      humanInstruction: "Paste the fallback prompt into an AI session when the host did not auto-read an instruction-file pointer.",
      sessionStart: [
        "Treat the aienvmp marker block as the live environment pointer.",
        "Start at .aienvmp/README.md when artifacts are present, then read .aienvmp/status.json.",
        "Run aienvmp sync if .aienvmp/status.json is missing or stale.",
        "Continue project-local code work unless status/context requires environment review."
      ],
      rule: "aienvmp does not replace agent instruction files; it gives them a shared live env map and light SBOM. Instruction-file pointers improve automatic discovery, while existing artifacts remain directly usable through the fallback read path starting at .aienvmp/README.md. Optional Cursor and Copilot pointers are opt-in."
    },
    demo: {
      command: "aienvmp demo",
      jsonCommand: "aienvmp demo --json",
      scenario: "multi-agent-conflict",
      workspaceImpact: "temporary workspace only; does not touch the caller workspace unless --dir is explicitly passed",
      expectedSignals: ["review-before-env-change", "dependency conflict target", "artifactFreshness", "AI discovery"],
      purpose: "Show why shared AI coding workspaces need an env map, intent log, and light SBOM before users install the tool in a real repo."
    },
    sbomStrategy: {
      mode: "light-by-default",
      defaultCommand: "aienvmp sbom --json",
      scannerCommand: "aienvmp sync --security",
      scannerPolicy: "Optional, read-only scanner summaries are used for security confidence; they are not required for local coding.",
      externalTools: ["syft", "trivy", "grype", "dependency-track"],
      evidenceWorkflow: [
        "read aienvmp light SBOM, status, and context",
        "use light SBOM for AI coordination and dependency read set",
        "run dedicated scanner evidence only when security confidence matters",
        "record intent before dependency or lockfile remediation",
        "checkpoint and hand off after accepted dependency or security changes"
      ],
      interoperabilityRule: "Use aienvmp as the AI workspace coordination layer; use dedicated SBOM and security tools for full evidence.",
      aiRule: "Use the light SBOM for dependency coordination. Run optional scanners before security claims, vulnerability remediation, release decisions, or dependency changes when scanner confidence is low."
    },
    dashboard: {
      mode: "light-human-view",
      essentialSurfaces: dashboardEssentialSurfaces,
      surfaceBudget: dashboardSurfaceBudget,
      rule: "Dashboard support cards may grow, but the control strip, 10-second review, next command, first-read brief, and essential cards should stay visible and aligned with AI outputs."
    },
    releaseGate: {
      mode: "manual-batched",
      localCommand: "npm run release:check",
      workflow: ".github/workflows/release.yml",
      publishWorkflow: "GitHub Actions Release workflow_dispatch",
      npmTokenSecret: "NPM_TOKEN",
      beforePublish: [
        "npm run release:check",
        "verify package.json version matches the workflow input",
        "confirm npm publish with confirm_publish=publish"
      ],
      afterStablePublish: "Deprecate aienvmp@<0.2.0 as prototype history after 0.2.0 is published.",
      rule: "Do not publish every commit; batch meaningful changes and keep local operation advisory."
    },
    releaseReadiness: {
      target: "0.2.0",
      status: "prototype-hardening",
      currentBatch: {
        status: "accumulating",
        releaseType: "stability-batch",
        themes: ["AI discovery", "AI quality signals", "SBOM interoperability", "recommendation positioning", "dashboard surface budget", "release gating"],
        changes: [
          "best-effort AI discovery and fallback prompt contract",
          "operational safety contract in status/context",
          "quality signals in schema/status/context/summary/dashboard",
          "AI adoption checklist and demo recommendation signals",
          "external SBOM/security scanner guidance",
          "manual batched release gate"
        ],
        decision: "hold",
        reason: "Several stability and AI-contract changes are being accumulated for one intentional release instead of publishing every commit."
      },
      publishDecision: {
        default: "hold",
        batchThreshold: "Hold by default until several meaningful AI-contract, dashboard, SBOM, release-gate, or bugfix changes are grouped for one release.",
        publishCandidateSignals: [
          "multiple user-visible AI contract or dashboard changes are grouped",
          "SBOM or environment coordination behavior changed and release notes are current",
          "release gate, package metadata, or onboarding behavior changed in a way users should receive together"
        ],
        publishWhen: [
          "meaningful AI contract, dashboard, SBOM, or release-gate changes are batched",
          "npm run release:check passes locally",
          "package.json version is intentionally updated for the release"
        ],
        holdWhen: [
          "only one small documentation or internal refactor landed",
          "tests were not run through npm run release:check",
          "the change can be batched into the next planned stable-contract release"
        ],
        emergencyException: "Security or broken-package fixes may publish sooner, but still run the release gate."
      },
      publishGate: {
        status: "hold",
        reason: "0.2.0 is still accumulating AI-contract, dashboard, SBOM, and release-gate changes as one stability batch.",
        nextAction: "Keep committing tested stabilization changes; do not npm publish until the batch is intentionally versioned and release notes are reviewed.",
        requiredEvidence: ["npm run release:check", "node bin/aienvmp.js schema --json", "node bin/aienvmp.js demo --json", "npm pack --dry-run"],
        readyWhen: [
          "currentBatch changes are reviewed as one release note group",
          "documented JSON contracts are additive and compatible",
          "README, examples, schema, CHANGELOG, dashboard, and packaged AI skill describe the same AI workspace coordination contract",
          "package.json version is intentionally bumped for 0.2.0 or the chosen release"
        ],
        holdWhen: [
          "changes are still accumulating for the stability batch",
          "release notes have not been reviewed as one group",
          "package.json version has not been intentionally bumped",
          "release:check has not passed after the final batched change"
        ],
        rule: "Treat publishGate.status as the single AI-readable npm publish decision; local commits may continue while npm publish remains held."
      },
      doNotPublishUntil: [
        "currentBatch changes are reviewed as one release note group",
        "README, examples, schema, and CHANGELOG describe the same AI workspace coordination contract",
        "npm run release:check passes after the final batched change",
        "package.json version is intentionally bumped for 0.2.0 or the chosen release",
        "GitHub Release workflow is run manually with explicit publish confirmation"
      ],
      requiredBeforeStable: [
        "npm run release:check passes locally",
        "GitHub Release workflow passes with confirm_publish=publish",
        "schema --json additive contract is reviewed",
        "README quick start and AI contract are current",
        "package metadata and CLI help match AI workspace coordination positioning",
        "multi-agent conflict demo passes",
        "0.1.x deprecation message is prepared but not run until 0.2.0 is published"
      ],
      evidenceCommands: [
        "npm run release:check",
        "node bin/aienvmp.js schema --json",
        "node bin/aienvmp.js demo --json",
        "npm pack --dry-run",
        "npm view aienvmp version"
      ],
      stabilizationFocus: [
        "AI session/status/context contract",
        "light SBOM and dependency-change review loop",
        "multi-agent intent, checkpoint, timeline, and handoff flow",
        "dashboard essential surfaces and release readiness",
        "manual batched release workflow"
      ],
      stableContractRule: "After 0.2.0, documented JSON fields are additive and backward-compatible; breaking changes require a contractVersion bump and migration note.",
      batchRule: "Accumulate several meaningful AI-contract, dashboard, SBOM, release-gate, and bugfix changes before one npm publish; hold small isolated changes for the next batch."
    },
    outputs: {
      status: {
        file: ".aienvmp/status.json",
        command: "aienvmp status --json",
        rootFields: ["state", "readOrder", "aiSession", "aiBootstrap", "nextCommand", "nextSafeCommand", "artifactFreshness", "strictRecommendation", "operationalSafety", "qualitySignals", "decision", "counts", "aiReadiness", "collaboration", "coordinationResolution", "maintenanceLoop", "coordination", "agentPointers", "sbomRisk", "followUpPlan", "environmentChangeProtocol"],
        agentPointerFields: ["installedCount", "missingCount", "installed", "missing", "discovery", "onboardCommand", "fallbackCommand", "fallbackRead", "next", "targets", "rule"],
        contract: preflightContract()
      },
      discover: {
        command: "aienvmp discover --json",
        mode: "read-only",
        rootFields: ["status", "detected", "startHere", "readOrder", "freshness", "nextCommand", "agentPointers", "aiDiscovery", "artifacts", "rule"],
        aiDiscoveryFields: ["mode", "automatic", "pointerStatus", "limitation", "installCommand", "safeStart", "sessionStart", "fallbackRead", "resume", "fallbackPrompt", "humanInstruction", "rule"],
        resumeFields: ["purpose", "readFirst", "nextCommand", "allowed", "beforeEnvironmentChange", "afterEnvironmentChange", "handoff", "mustNotDo", "rule"],
        purpose: "Zero-write detection command for AI agents or humans that need to know whether a workspace already has aienvmp artifacts."
      },
      startHere: {
        file: ".aienvmp/README.md",
        command: "aienvmp sync",
        format: "markdown",
        purpose: "Generated start-here file for AI agents or humans that discover the .aienvmp directory before instruction-file pointers.",
        startsWith: ["read order", "AI session", "next"]
      },
      summary: {
        file: ".aienvmp/summary.md",
        command: "aienvmp summary --write",
        format: "markdown",
        purpose: "Compact AI and CI step summary for quick review.",
        startsWith: ["AI readiness", "AI signals", "AI start here", "AI next"]
      },
      plan: {
        file: ".aienvmp/plan.json",
        command: "aienvmp plan --json",
        rootFields: ["schemaVersion", "status", "aiBootstrap", "nextSafeCommand", "followUpPlan", "preflight", "decision", "enforcement", "recommendedActions", "reviewGates", "remediationSteps", "environmentSteps"]
      },
      context: {
        command: "aienvmp context --json",
        rootFields: ["status", "startHere", "readOrder", "aiSession", "aiBootstrap", "nextSafeCommand", "artifactFreshness", "strictRecommendation", "operationalSafety", "qualitySignals", "preflight", "aiReadiness", "collaboration", "coordinationResolution", "maintenanceLoop", "coordination", "agentPointers", "followUpPlan", "environmentChangeProtocol", "decision", "enforcement", "recommendedActions", "workspace", "dependencySnapshot", "lightSbom", "warnings"]
      },
      handoff: {
        command: "aienvmp handoff --json",
        rootFields: ["status", "startHere", "readOrder", "aiBootstrap", "nextSafeCommand", "decision", "preflight", "continuation", "coordination", "coordinationResolution", "dependencyHandoff", "openIntents", "warnings", "recommendedActions", "recentChanges"],
        continuationFields: ["status", "nextCommand", "readOrder", "resume", "followUpPlan", "coordinationResolution", "maintenance", "sbomReview", "strict"],
        resumeFields: ["purpose", "readFirst", "nextCommand", "allowed", "beforeEnvironmentChange", "afterEnvironmentChange", "handoff", "mustNotDo", "rule"]
      },
      manifest: {
        file: ".aienvmp/manifest.json",
        rootFields: ["schemaVersion", "workspace", "runtimes", "packageManagers", "dependencySnapshot", "lightSbom", "security", "trust"]
      },
      sbom: {
        file: ".aienvmp/sbom.json",
        command: "aienvmp sbom --json",
        rootFields: ["schemaVersion", "schemaName", "workspace", "startHere", "readOrder", "aiBootstrap", "nextSafeCommand", "scannerGuidance", "aiReviewPlan", "dependencyCoordination", "summary", "riskSummary", "topRisk", "packageManagerPolicy", "dependencyChangeHints", "aiDependencyReview"],
        scannerGuidanceFields: ["mode", "decision", "reason", "defaultCommand", "scannerCommand", "securityConfidence", "useLightSbomFor", "requireScannerFor", "externalTools", "evidenceWorkflow", "interoperabilityRule", "whenToRun", "rule"],
        aiReviewPlanFields: ["status", "risk", "securityConfidence", "packageManagerPolicy", "packages", "vulnerabilities", "reviewTargets", "beforeChange", "afterChange", "rule"],
        dependencyCoordinationFields: ["mode", "appliesWhen", "readFirst", "reviewTargets", "nextCommand", "beforeChange", "afterChange", "mustNotDo", "scannerEvidence", "rule"],
        aiDependencyReviewFields: ["status", "statusReason", "securityConfidence", "readFirst", "reviewTargets", "beforeDependencyChange", "afterDependencyChange", "rule"],
        aiUseFields: ["purpose", "readBefore", "decision", "securityConfidence", "readFirst", "nextCommand", "beforeChange", "afterChange", "rule"]
      },
      cyclonedxLite: {
        file: ".aienvmp/sbom.cdx.json",
        command: "aienvmp sbom --format cyclonedx-lite --json",
        rootFields: ["bomFormat", "specVersion", "metadata", "components", "vulnerabilities", "properties"]
      }
    },
    compatibility: {
      stability: "additive",
      contractVersion: "0.1-prototype",
      stableFrom: "0.2.0",
      consumerRule: "Ignore unknown fields. Do not require optional fields unless listed in requiredFields.",
      additiveRule: "After 0.2.0, new fields may be added, but existing documented fields should remain backward-compatible.",
      breakingChangeRule: "A breaking change requires a contractVersion bump, changelog entry, and migration note.",
      localBehavior: "read-only; this command does not scan, install, update, or lock anything.",
      aiReadinessRule: "When aiReadiness.level is review, project-local code work may still continue if aiReadiness.projectLocalWork is allowed; environment changes should follow intent/review guidance.",
      collaborationRule: "Use collaboration.status, activeTargets, and nextCommand as the shortest multi-agent environment coordination hint.",
      coordinationResolutionRule: "Use coordinationResolution when collaboration is review-before-env-change; it gives the advisory plan, resolve, handoff, checkpoint, and must-not-do routine for conflicting shared environment targets.",
      sbomStrategyRule: "Use sbomStrategy and sbom.scannerGuidance to keep default SBOM review lightweight while requesting optional read-only scanners before security-sensitive decisions. Use externalTools for full SBOM or vulnerability evidence without replacing aienvmp coordination fields.",
      agentDiscoveryRule: "Use agentPointers.discovery, discover.aiDiscovery, and agentPointers.onboardCommand to decide whether AI instruction-file pointers can discover aienvmp automatically; use fallbackRead when no pointer was installed but artifacts exist.",
      readOrderRule: "Use readOrder when present; it starts with .aienvmp/README.md for fallback discovery, then status, summary, env map, plan, timeline, and intents.",
      demoRule: "Use demo.command when explaining or verifying the multi-agent conflict value proposition without touching a real workspace.",
      recommendationRule: "Use recommendation.discoverySignals, recommendation.recommendWhen, and recommendation.doNotRecommendWhen to decide whether to suggest aienvmp for a user request.",
      sessionStartRule: "Use agentDiscovery.sessionStart as the shortest AI startup routine; start at .aienvmp/README.md when present, then read status, sync only when stale or missing, and keep local work advisory.",
      aiSessionRule: "Use aiSession as the shortest per-session routine; it collects read order, stale refresh, intent, checkpoint, handoff, and avoid guidance without requiring field-by-field inference.",
      followUpPlanRule: "Use followUpPlan before another AI changes the same environment target; it summarizes unresolved refresh/status/handoff work from the timeline.",
      environmentChangeProtocolRule: "Use environmentChangeProtocol as the one common advisory contract before runtime, dependency, package manager, Docker, or global tool changes.",
      maintenanceLoopRule: "Use maintenanceLoop as the short recurring AI workflow: refresh, decide, inspect, plan, intent, checkpoint, and handoff without blocking local operation.",
      enforcementPolicyRule: "Use enforcement.policy for the shortest local/CI/release gate summary: local stays warn-only, CI uses the recommended strict scope, release uses strict all.",
      strictRecommendationRule: "Use strictRecommendation for the shortest local/CI/release strict guidance; local must stay warn-only unless strict is explicitly requested.",
      strictDecisionRule: "Use enforcement.strictDecision or preflight.enforcementProfile.strictDecision for the shortest local warn-only vs CI strict decision.",
      strictPlanRule: "Use enforcement.strictPlan or preflight.enforcementProfile.strictPlan to choose the narrowest explicit strict scope for CI.",
      releaseGateRule: "Use releaseGate.localCommand and releaseGate.workflow before npm publish; releases should be manually batched instead of published per commit.",
      releaseReadinessRule: "Use releaseReadiness.requiredBeforeStable to decide whether 0.2.0 is ready; do not publish every commit.",
      qualitySignalsRule: "Use qualitySignals as the compact AI-friendly, simple, lightweight, advisory-first, and batched-release checklist before recommending or releasing aienvmp."
    }
  };
}
