export const aiDiscoveryEntry = ".aienvmp/discovery.json";
export const aiStartHere = ".aienvmp/README.md";
export const aiStatus = ".aienvmp/status.json";
export const aiSummary = ".aienvmp/summary.md";
export const aiEnvMap = "AIENV.md";
export const aiContextCommand = "aienvmp context --json";
export const npxAiContextCommand = "npx aienvmp context --json";

export const aiDefaultReadOrder = [
  aiDiscoveryEntry,
  aiStartHere,
  aiStatus,
  aiSummary,
  aiEnvMap,
  aiContextCommand
];

export const aiFallbackRead = [
  aiDiscoveryEntry,
  aiStartHere,
  aiStatus,
  aiSummary,
  aiContextCommand
];

export const aiStartupChecklist = [
  "run aienvmp start --json when automatic discovery is uncertain",
  "read .aienvmp/discovery.json, .aienvmp/status.json, and .aienvmp/summary.md",
  "check dependencyQuickCheck before dependency, lockfile, security, or release work",
  "record intent before shared environment changes, then checkpoint and hand off after accepted changes"
];

export const npxAiStartupChecklist = [
  "run npx aienvmp start --json when automatic discovery is uncertain",
  ...aiStartupChecklist.slice(1)
];

export const aiFallbackPrompt = "Use aienvmp as the workspace env map. Read .aienvmp/discovery.json, then .aienvmp/status.json, then run aienvmp context --json before environment changes.";
export const npxAiFallbackPrompt = "Use aienvmp as the workspace env map. Read .aienvmp/discovery.json, then .aienvmp/status.json, then run npx aienvmp context --json before environment changes.";
export const npxAiMissingFallbackPrompt = "Run npx aienvmp sync to create the AI env map, then read .aienvmp/discovery.json and .aienvmp/status.json.";

export const sbomReadOrder = [
  aiDiscoveryEntry,
  ".aienvmp/sbom.json",
  aiStatus,
  aiSummary,
  aiContextCommand
];

export function aiEntryContract({
  decision = "fallback-required",
  readFirst = aiFallbackRead,
  nextCommand = aiContextCommand,
  nextSetupCommand = "aienvmp onboard",
  beforeEnvironmentChange = "aienvmp intent --actor agent:id --action planned-change --target environment",
  afterEnvironmentChange = "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
  handoff = "aienvmp handoff --record --actor agent:id",
  copyPastePrompt = aiFallbackPrompt
} = {}) {
  return {
    purpose: "Small AI startup contract for hosts that missed automatic instruction-file discovery.",
    decision,
    readFirst,
    nextCommand,
    nextSetupCommand,
    beforeEnvironmentChange,
    afterEnvironmentChange,
    handoff,
    copyPastePrompt,
    rule: "Read aiEntry first when automatic discovery is uncertain; keep local work advisory and record intent before shared environment changes."
  };
}

export function aiSessionUseContract({
  decision = "fallback-required",
  nextCommand = aiContextCommand,
  nextSetupCommand = "aienvmp onboard",
  copyPastePrompt = aiFallbackPrompt,
  proofCommand = "aienvmp discover --json"
} = {}) {
  return {
    purpose: "Shortest cross-agent startup decision for using this workspace env map.",
    useAt: [
      "start of a new AI coding session",
      "before runtime, dependency, package manager, Docker, global tool, or security-remediation changes",
      "when another AI or human may share the same environment"
    ],
    proofCommand,
    decisionField: "aiDiscovery.decision",
    decision,
    nextCommand,
    nextSetupCommand,
    fallbackPromptField: "copyPastePrompt",
    copyPastePrompt,
    beforeEnvironmentChange: "aienvmp intent --actor agent:id --action planned-change --target environment",
    afterEnvironmentChange: "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
    handoff: "aienvmp handoff --record --actor agent:id",
    rule: "If decision is fallback-required, do not assume the AI host auto-read a pointer file; use copyPastePrompt or run start --json before environment-affecting work."
  };
}
