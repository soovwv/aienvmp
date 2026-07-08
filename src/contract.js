export function preflightContract() {
  return {
    name: "aienvmp-preflight",
    version: 1,
    stability: "additive",
    requiredFields: ["schemaVersion", "state", "decision", "quickstart", "commands", "artifacts"],
    aiEntryFields: ["state", "summary", "aiBootstrap", "nextSafeCommand", "aiReadiness", "collaboration", "maintenanceLoop", "nextAgent", "coordination", "agentActivity", "agentPointers", "sbomRisk", "followUps", "dependencyReadSet", "dependencyChangeProtocol"],
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
    aiBootstrapFields: ["purpose", "readFirst", "detailCommand", "nextSafeCommand", "nextSafeCommandSource", "nextSafeCommandReason", "localMode", "projectLocalWork", "environmentChanges", "rule"],
    aiLoop: {
      name: "AI maintenance loop",
      purpose: "Shared lightweight workflow for AI agents that maintain one workspace environment.",
      localMode: "warn-only",
      steps: [
        { step: "sync", command: "aienvmp sync", purpose: "refresh AIENV.md, status, summary, SBOM, ledger, and dashboard" },
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
      installCommand: "aienvmp onboard",
      sessionStart: [
        "Treat the aienvmp marker block as the live environment pointer.",
        "Run aienvmp status --json before environment-affecting work.",
        "Run aienvmp sync if .aienvmp/status.json is missing or stale.",
        "Continue project-local code work unless status/context requires environment review."
      ],
      rule: "aienvmp does not replace agent instruction files; it gives them a shared live env map and light SBOM."
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
    outputs: {
      status: {
        file: ".aienvmp/status.json",
        command: "aienvmp status --json",
        rootFields: ["state", "aiBootstrap", "nextCommand", "nextSafeCommand", "decision", "counts", "aiReadiness", "collaboration", "maintenanceLoop", "coordination", "agentPointers", "sbomRisk"],
        agentPointerFields: ["installedCount", "missingCount", "installed", "missing", "discovery", "onboardCommand", "next", "targets"],
        contract: preflightContract()
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
        rootFields: ["schemaVersion", "status", "aiBootstrap", "nextSafeCommand", "preflight", "decision", "enforcement", "recommendedActions", "reviewGates", "remediationSteps", "environmentSteps"]
      },
      context: {
        command: "aienvmp context --json",
        rootFields: ["status", "aiBootstrap", "nextSafeCommand", "preflight", "aiReadiness", "collaboration", "maintenanceLoop", "coordination", "agentPointers", "decision", "enforcement", "recommendedActions", "workspace", "dependencySnapshot", "lightSbom", "warnings"]
      },
      handoff: {
        command: "aienvmp handoff --json",
        rootFields: ["status", "aiBootstrap", "nextSafeCommand", "decision", "preflight", "continuation", "coordination", "dependencyHandoff", "openIntents", "warnings", "recommendedActions", "recentChanges"]
      },
      manifest: {
        file: ".aienvmp/manifest.json",
        rootFields: ["schemaVersion", "workspace", "runtimes", "packageManagers", "dependencySnapshot", "lightSbom", "security", "trust"]
      },
      sbom: {
        file: ".aienvmp/sbom.json",
        command: "aienvmp sbom --json",
        rootFields: ["schemaVersion", "schemaName", "workspace", "aiBootstrap", "nextSafeCommand", "aiReviewPlan", "summary", "riskSummary", "topRisk", "packageManagerPolicy", "dependencyChangeHints", "aiDependencyReview"],
        aiReviewPlanFields: ["status", "risk", "securityConfidence", "packageManagerPolicy", "packages", "vulnerabilities", "reviewTargets", "beforeChange", "afterChange", "rule"],
        aiDependencyReviewFields: ["status", "statusReason", "securityConfidence", "readFirst", "reviewTargets", "beforeDependencyChange", "afterDependencyChange", "rule"]
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
      agentDiscoveryRule: "Use agentPointers.discovery and agentPointers.onboardCommand to decide whether AI instruction-file pointers can discover aienvmp automatically.",
      sessionStartRule: "Use agentDiscovery.sessionStart as the shortest AI startup routine; read status first, sync only when stale or missing, and keep local work advisory.",
      maintenanceLoopRule: "Use maintenanceLoop as the short recurring AI workflow: refresh, decide, inspect, plan, intent, checkpoint, and handoff without blocking local operation.",
      enforcementPolicyRule: "Use enforcement.policy for the shortest local/CI/release gate summary: local stays warn-only, CI uses the recommended strict scope, release uses strict all.",
      strictDecisionRule: "Use enforcement.strictDecision or preflight.enforcementProfile.strictDecision for the shortest local warn-only vs CI strict decision.",
      strictPlanRule: "Use enforcement.strictPlan or preflight.enforcementProfile.strictPlan to choose the narrowest explicit strict scope for CI.",
      releaseGateRule: "Use releaseGate.localCommand and releaseGate.workflow before npm publish; releases should be manually batched instead of published per commit."
    }
  };
}
