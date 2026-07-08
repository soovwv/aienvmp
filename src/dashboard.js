export const dashboardEssentialCards = Object.freeze([
  "AI Session",
  "Environment Health",
  "AI Collaboration",
  "Light SBOM",
  "Agent Pointers",
  "Agent Intents",
  "Environment Ledger",
  "Enforcement Mode",
  "Release Readiness"
]);

export function dashboardCardPriority(title) {
  return dashboardEssentialCards.includes(title) ? "essential" : "support";
}
