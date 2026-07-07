export function preflightContract() {
  return {
    name: "aienvmp-preflight",
    version: 1,
    stability: "additive",
    requiredFields: ["schemaVersion", "state", "decision", "quickstart", "commands", "artifacts"],
    aiEntryFields: ["state", "summary", "nextAgent", "coordination", "agentActivity", "followUps", "dependencyReadSet", "dependencyChangeProtocol"],
    rule: "Consumers should ignore unknown fields and treat missing optional fields as unavailable."
  };
}

export function schemaContract() {
  return {
    schemaVersion: 1,
    name: "aienvmp-contract",
    purpose: "Stable AI-readable contract for aienvmp outputs.",
    outputs: {
      status: {
        file: ".aienvmp/status.json",
        command: "aienvmp status --json",
        contract: preflightContract()
      },
      context: {
        command: "aienvmp context --json",
        rootFields: ["status", "preflight", "coordination", "decision", "recommendedActions", "workspace", "dependencySnapshot", "lightSbom", "warnings"]
      },
      handoff: {
        command: "aienvmp handoff --json",
        rootFields: ["status", "decision", "preflight", "coordination", "dependencyHandoff", "openIntents", "warnings", "recommendedActions", "recentChanges"]
      },
      manifest: {
        file: ".aienvmp/manifest.json",
        rootFields: ["schemaVersion", "workspace", "runtimes", "packageManagers", "dependencySnapshot", "lightSbom", "security", "trust"]
      }
    },
    compatibility: {
      stability: "additive",
      consumerRule: "Ignore unknown fields. Do not require optional fields unless listed in requiredFields.",
      localBehavior: "read-only; this command does not scan, install, update, or lock anything."
    }
  };
}
