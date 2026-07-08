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

export function dashboardDependencyReviewClientScript() {
  return [
    "const aiDependencyReviewHtml=aiDependencyReview.status?`<table><tr><th>Status</th><td><code>${esc(aiDependencyReview.status)}</code> ${esc(aiDependencyReview.mode||'advisory')}</td></tr><tr><th>Reason</th><td>${esc(aiDependencyReview.statusReason||'No dependency review reason provided.')}</td></tr><tr><th>Security confidence</th><td><code>${esc(aiDependencyReview.securityConfidence||'unknown')}</code></td></tr><tr><th>Read first</th><td>${esc((aiDependencyReview.readFirst||[]).join(', ')||'riskSummary')}</td></tr><tr><th>Targets</th><td>${esc((aiDependencyReview.reviewTargets||[]).join(', ')||'none')}</td></tr><tr><th>Before</th><td><code>${esc((aiDependencyReview.beforeDependencyChange||[]).slice(0,3).join(' -> ')||'aienvmp intent --actor agent:id --action dependency-review --target dependency')}</code></td></tr><tr><th>After</th><td><code>${esc((aiDependencyReview.afterDependencyChange||[]).slice(-1)[0]||'aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency')}</code></td></tr></table><div class=\"path\">${esc(aiDependencyReview.rule||'Dependency review is advisory and non-blocking.')}</div>`:'<div class=\"okline\">No AI dependency review block available. Run <code>aienvmp sync</code>.</div>';"
  ].join("\n");
}

export function dashboardReviewPlanHtmlClientScript() {
  return [
    "const aiReviewPlanHtml=aiReviewPlan.status?`<table><tr><th>Status</th><td><code>${esc(aiReviewPlan.status)}</code></td></tr><tr><th>Risk</th><td><code>${esc(aiReviewPlan.risk||'clear/0')}</code></td></tr><tr><th>Confidence</th><td><code>${esc(aiReviewPlan.securityConfidence||'unknown')}</code></td></tr><tr><th>Policy</th><td><code>${esc(aiReviewPlan.packageManagerPolicy||'not-detected')}</code></td></tr><tr><th>Before</th><td><code>${esc(aiReviewPlan.beforeChange||'aienvmp sbom --json')}</code></td></tr><tr><th>After</th><td><code>${esc(aiReviewPlan.afterChange||'aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency')}</code></td></tr></table><div class=\"path\">${esc(aiReviewPlan.rule||'Record dependency intent before dependency or lockfile changes.')}</div>`:'<div class=\"okline\">No AI review plan available. Run <code>aienvmp sbom --json</code>.</div>';"
  ].join("\n");
}

export function dashboardScannerGuidanceHtmlClientScript() {
  return [
    "const scannerGuidanceHtml=`<table><tr><th>Mode</th><td><code>${esc(scannerGuidance.mode||'optional-read-only')}</code></td></tr><tr><th>Default</th><td><code>${esc(scannerGuidance.defaultCommand||'aienvmp sbom --json')}</code></td></tr><tr><th>Scanner</th><td><code>${esc(scannerGuidance.scannerCommand||'aienvmp sync --security')}</code></td></tr><tr><th>Confidence</th><td><code>${esc(scannerGuidance.securityConfidence||'unknown')}</code></td></tr><tr><th>Run before</th><td>${esc((scannerGuidance.whenToRun||[]).join(', ')||'security-sensitive decisions')}</td></tr></table><div class=\"path\">${esc(scannerGuidance.rule||'Keep the default SBOM lightweight; use optional read-only scanners when security confidence matters.')}</div>`;"
  ].join("\n");
}

export function dashboardRiskSummaryClientScript() {
  return [
    "const riskSummaryHtml=riskSummary.level?`<table><tr><th>Level</th><td><code>${esc(riskSummary.level)}</code> ${esc(riskSummary.score||0)}</td></tr><tr><th>Scanner</th><td><code>${esc(riskSummary.scanner||'unknown')}</code></td></tr><tr><th>Next</th><td>${esc(riskSummary.next||'No SBOM action required.')}</td></tr><tr><th>Targets</th><td>${esc((riskSummary.reviewTargets||[]).join(', ')||'none')}</td></tr></table>${riskSummary.signals?.length?'<div class=\"timeline\">'+riskSummary.signals.slice(0,5).map(s=>`<div class=\"event\"><time>risk</time><div>${esc(s)}</div></div>`).join('')+'</div>':''}`:'<div class=\"okline\">No risk summary available.</div>';"
  ].join("\n");
}
