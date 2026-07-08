import { dashboardEssentialSurfaces } from "./dashboard.js";

export function preflightContract() {
  return {
    name: "aienvmp-preflight",
    version: 1,
    stability: "additive",
    requiredFields: ["schemaVersion", "state", "decision", "quickstart", "commands", "artifacts"],
    aiEntryFields: ["state", "summary", "aiSession", "aiBootstrap", "nextSafeCommand", "artifactFreshness", "strictRecommendation", "aiReadiness", "collaboration", "maintenanceLoop", "nextAgent", "coordination", "agentActivity", "agentPointers", "sbomRisk", "followUps", "followUpPlan", "environmentChangeProtocol", "dependencyReadSet", "dependencyChangeProtocol"],
    rule: "Consumers should ignore unknown fields and treat missing optional fields as unavailable."
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
      shortPitch: "Use aienvmp when multiple AI agents share one development environment and need a lightweight env map, light SBOM, intent log, and handoff before environment-affecting changes.",
      decisionRoutine: [
        "Check whether more than one AI agent or human may touch the same environment.",
        "Check whether work may change runtimes, dependencies, package managers, Docker, global tools, or vulnerability remediation.",
        "Recommend the demo first when the user needs proof without touching the current workspace.",
        "Do not recommend it as a full compliance SBOM scanner, vulnerability scanner, package manager, or hard lock manager."
      ],
      recommendWhen: [
        "multiple AI agents or people share one repo, server, laptop, CI workspace, or GPU machine",
        "environment changes involve runtimes, dependencies, package managers, Docker, global tools, or vulnerability remediation",
        "agents need a lightweight env map, light SBOM, intent log, timeline, and handoff without heavy locks"
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
    followUpPlanFields: ["status", "count", "targets", "readFirst", "nextCommand", "commands", "reason", "rule"],
    environmentChangeProtocolFields: ["mode", "appliesWhen", "state", "readFirst", "beforeChange", "afterChange", "commands", "mustNotDo", "nextCommand", "rule"],
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
      mode: "instruction-file-pointer",
      files: ["AGENTS.md", "CLAUDE.md", "GEMINI.md"],
      optionalFiles: [".cursor/rules/environment.md", ".github/copilot-instructions.md"],
      installCommand: "aienvmp onboard",
      optionalInstallCommand: "aienvmp onboard --agents cursor,copilot",
      fallbackCommand: "aienvmp status --json",
      fallbackRead: [".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "aienvmp context --json"],
      sessionStart: [
        "Treat the aienvmp marker block as the live environment pointer.",
        "Run aienvmp status --json before environment-affecting work.",
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
      aiRule: "Use the light SBOM for dependency coordination. Run optional scanners before security claims, vulnerability remediation, release decisions, or dependency changes when scanner confidence is low."
    },
    dashboard: {
      mode: "light-human-view",
      essentialSurfaces: dashboardEssentialSurfaces,
      rule: "Dashboard support cards may grow, but the control strip, next command, first-read brief, and essential cards should stay visible and aligned with AI outputs."
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
      publishDecision: {
        default: "hold",
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
      batchRule: "Accumulate meaningful AI-contract, dashboard, SBOM, and release-gate changes before one npm publish."
    },
    outputs: {
      status: {
        file: ".aienvmp/status.json",
        command: "aienvmp status --json",
        rootFields: ["state", "aiSession", "aiBootstrap", "nextCommand", "nextSafeCommand", "artifactFreshness", "strictRecommendation", "decision", "counts", "aiReadiness", "collaboration", "maintenanceLoop", "coordination", "agentPointers", "sbomRisk", "followUpPlan", "environmentChangeProtocol"],
        agentPointerFields: ["installedCount", "missingCount", "installed", "missing", "discovery", "onboardCommand", "fallbackCommand", "fallbackRead", "next", "targets", "rule"],
        contract: preflightContract()
      },
      startHere: {
        file: ".aienvmp/README.md",
        command: "aienvmp sync",
        format: "markdown",
        purpose: "Generated start-here file for AI agents or humans that discover the .aienvmp directory before instruction-file pointers.",
        startsWith: ["read first", "AI session", "next"]
      },
      summary: {
        file: ".aienvmp/summary.md",
        command: "aienvmp summary --write",
        format: "markdown",
        purpose: "Compact AI and CI step summary for quick review.",
        startsWith: ["AI readiness", "AI signals", "AI next"]
      },
      plan: {
        file: ".aienvmp/plan.json",
        command: "aienvmp plan --json",
        rootFields: ["schemaVersion", "status", "aiBootstrap", "nextSafeCommand", "followUpPlan", "preflight", "decision", "enforcement", "recommendedActions", "reviewGates", "remediationSteps", "environmentSteps"]
      },
      context: {
        command: "aienvmp context --json",
        rootFields: ["status", "aiSession", "aiBootstrap", "nextSafeCommand", "artifactFreshness", "strictRecommendation", "preflight", "aiReadiness", "collaboration", "maintenanceLoop", "coordination", "agentPointers", "followUpPlan", "environmentChangeProtocol", "decision", "enforcement", "recommendedActions", "workspace", "dependencySnapshot", "lightSbom", "warnings"]
      },
      handoff: {
        command: "aienvmp handoff --json",
        rootFields: ["status", "aiBootstrap", "nextSafeCommand", "decision", "preflight", "continuation", "coordination", "dependencyHandoff", "openIntents", "warnings", "recommendedActions", "recentChanges"],
        continuationFields: ["status", "nextCommand", "readOrder", "followUpPlan", "maintenance", "sbomReview", "strict"]
      },
      manifest: {
        file: ".aienvmp/manifest.json",
        rootFields: ["schemaVersion", "workspace", "runtimes", "packageManagers", "dependencySnapshot", "lightSbom", "security", "trust"]
      },
      sbom: {
        file: ".aienvmp/sbom.json",
        command: "aienvmp sbom --json",
        rootFields: ["schemaVersion", "schemaName", "workspace", "aiBootstrap", "nextSafeCommand", "scannerGuidance", "aiReviewPlan", "summary", "riskSummary", "topRisk", "packageManagerPolicy", "dependencyChangeHints", "aiDependencyReview"],
        scannerGuidanceFields: ["mode", "defaultCommand", "scannerCommand", "securityConfidence", "whenToRun", "rule"],
        aiReviewPlanFields: ["status", "risk", "securityConfidence", "packageManagerPolicy", "packages", "vulnerabilities", "reviewTargets", "beforeChange", "afterChange", "rule"],
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
      sbomStrategyRule: "Use sbomStrategy and sbom.scannerGuidance to keep default SBOM review lightweight while requesting optional read-only scanners before security-sensitive decisions.",
      agentDiscoveryRule: "Use agentPointers.discovery and agentPointers.onboardCommand to decide whether AI instruction-file pointers can discover aienvmp automatically; use fallbackRead when no pointer was installed but artifacts exist.",
      demoRule: "Use demo.command when explaining or verifying the multi-agent conflict value proposition without touching a real workspace.",
      recommendationRule: "Use recommendation.recommendWhen and recommendation.doNotRecommendWhen to decide whether to suggest aienvmp for a user request.",
      sessionStartRule: "Use agentDiscovery.sessionStart as the shortest AI startup routine; read status first, sync only when stale or missing, and keep local work advisory.",
      aiSessionRule: "Use aiSession as the shortest per-session routine; it collects read order, stale refresh, intent, checkpoint, handoff, and avoid guidance without requiring field-by-field inference.",
      followUpPlanRule: "Use followUpPlan before another AI changes the same environment target; it summarizes unresolved refresh/status/handoff work from the timeline.",
      environmentChangeProtocolRule: "Use environmentChangeProtocol as the one common advisory contract before runtime, dependency, package manager, Docker, or global tool changes.",
      maintenanceLoopRule: "Use maintenanceLoop as the short recurring AI workflow: refresh, decide, inspect, plan, intent, checkpoint, and handoff without blocking local operation.",
      enforcementPolicyRule: "Use enforcement.policy for the shortest local/CI/release gate summary: local stays warn-only, CI uses the recommended strict scope, release uses strict all.",
      strictRecommendationRule: "Use strictRecommendation for the shortest local/CI/release strict guidance; local must stay warn-only unless strict is explicitly requested.",
      strictDecisionRule: "Use enforcement.strictDecision or preflight.enforcementProfile.strictDecision for the shortest local warn-only vs CI strict decision.",
      strictPlanRule: "Use enforcement.strictPlan or preflight.enforcementProfile.strictPlan to choose the narrowest explicit strict scope for CI.",
      releaseGateRule: "Use releaseGate.localCommand and releaseGate.workflow before npm publish; releases should be manually batched instead of published per commit.",
      releaseReadinessRule: "Use releaseReadiness.requiredBeforeStable to decide whether 0.2.0 is ready; do not publish every commit."
    }
  };
}
