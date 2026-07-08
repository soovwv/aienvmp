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

export function dashboardPriorityClientScript() {
  return [
    `const essentialCards=${JSON.stringify(dashboardEssentialCards)};`,
    "const cardPriority=title=>essentialCards.includes(title)?'essential':'support';"
  ].join("\n");
}

export function dashboardAgentClientScript() {
  return [
    "const agentNames={agents:'Codex',claude:'Claude',gemini:'Gemini'};",
    "const agentInfo=v=>typeof v==='object'&&v? v : {exists:!!v,hasAienvmpPointer:!!v,path:''};",
    "const agentHasPointer=v=>agentInfo(v).hasAienvmpPointer===true;",
    "if(agentInfo(manifest.agentFiles?.cursor).exists||agentHasPointer(manifest.agentFiles?.cursor))agentNames.cursor='Cursor';",
    "if(agentInfo(manifest.agentFiles?.copilot).exists||agentHasPointer(manifest.agentFiles?.copilot))agentNames.copilot='Copilot';",
    "const agentStatus=v=>agentHasPointer(v)?'aienvmp pointer installed':(agentInfo(v).exists?'file detected, pointer missing':'not detected');",
    "const agentCards=Object.entries(agentNames).map(([key,label])=>`<div class=\"agent\"><strong>${label}</strong><span>${esc(agentStatus(manifest.agentFiles?.[key]))}</span>${agentInfo(manifest.agentFiles?.[key]).installCommand?`<span class=\"path\">${esc(agentInfo(manifest.agentFiles?.[key]).installCommand)}</span>`:''}</div>`).join('');",
    "const agentPointerCount=entries(manifest.agentFiles).filter(([,v])=>agentHasPointer(v)).length;"
  ].join("\n");
}

export function dashboardScannerGuidanceClientScript() {
  return [
    "const scannerGuidance=lightSbom.scannerGuidance||{mode:'optional-read-only',defaultCommand:'aienvmp sbom --json',scannerCommand:'aienvmp sync --security',securityConfidence:aiDependencyReview.securityConfidence||'unknown',whenToRun:['before security claims','before vulnerability remediation','before release decisions'],rule:'Keep the default SBOM lightweight for AI coordination; use optional read-only scanners only when security confidence matters.'};"
  ].join("\n");
}

export function dashboardReviewPlanClientScript() {
  return [
    "const aiReviewPlan=lightSbom.aiReviewPlan||{status:aiDependencyReview.status||'ready',risk:(riskSummary.level||'clear')+'/'+(riskSummary.score||0),securityConfidence:aiDependencyReview.securityConfidence||'unknown',packageManagerPolicy:pmPolicy.status||'not-detected',packages:lightSbomSummary.packages||0,vulnerabilities:lightSbomSummary.vulnerabilities||0,reviewTargets:aiDependencyReview.reviewTargets||riskSummary.reviewTargets||[],beforeChange:aiDependencyReview.beforeDependencyChange?.[0]||riskSummary.commands?.[0]||'aienvmp sbom --json',afterChange:aiDependencyReview.afterDependencyChange?.slice(-1)[0]||'aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency',rule:aiDependencyReview.rule||'Record dependency intent before dependency or lockfile changes.'};"
  ].join("\n");
}
