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

export const dashboardEssentialSurfaces = Object.freeze({
  controlStrip: ["AI readiness", "Freshness", "Collaboration", "SBOM risk"],
  tenSecondReview: ["Start here", "Next command", "Review target", "Mode"],
  nextCommand: "Next command",
  firstRead: ["AI bootstrap", "Status", "Freshness", "Start here", "Read first", "AI discovery", "Review targets", "Local mode"],
  essentialCards: dashboardEssentialCards,
  rule: "Keep the control strip, 10-second review, next command, first-read brief, and essential cards visible before adding support cards; the dashboard is a human view of the AI startup contract."
});

export const dashboardSurfaceBudget = Object.freeze({
  mode: "essential-first",
  primaryReviewTime: "10 seconds",
  defaultPriority: ["controlStrip", "tenSecondReview", "nextCommand", "firstRead", "essentialCards"],
  supportCardRule: "Support cards may exist, but must not hide or replace the essential AI startup surfaces.",
  noGrowthRule: "Prefer reusing existing Light SBOM, AI Session, Collaboration, Release Readiness, and Agent Pointers cards before adding new dashboard cards."
});

export function dashboardCardPriority(title) {
  return dashboardEssentialCards.includes(title) ? "essential" : "support";
}

export function dashboardEssentialSurfaceClientScript() {
  return [
    `const essentialSurfaces=${JSON.stringify(dashboardEssentialSurfaces)};`
  ].join("\n");
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
    "const scannerGuidance=lightSbom.scannerGuidance||{mode:'optional-read-only',defaultCommand:'aienvmp sbom --json',scannerCommand:'aienvmp sync --security',securityConfidence:aiDependencyReview.securityConfidence||'unknown',externalTools:[{tool:'syft'},{tool:'trivy'},{tool:'grype'},{tool:'dependency-track'}],interoperabilityRule:'Use aienvmp as the AI coordination layer and dedicated scanners for full evidence.',whenToRun:['before security claims','before vulnerability remediation','before release decisions'],rule:'Keep the default SBOM lightweight for AI coordination; use optional read-only scanners only when security confidence matters.'};"
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

export function dashboardDependencyCoordinationClientScript() {
  return [
    "const dependencyCoordination=lightSbom.dependencyCoordination||{mode:'advisory',readFirst:['.aienvmp/README.md','.aienvmp/sbom.json','.aienvmp/status.json','aienvmp context --json'],reviewTargets:aiDependencyReview.reviewTargets||riskSummary.reviewTargets||[],nextCommand:aiDependencyReview.beforeDependencyChange?.[0]||riskSummary.commands?.[0]||'aienvmp sbom --json',beforeChange:aiDependencyReview.beforeDependencyChange||['aienvmp intent --actor agent:id --action dependency-review --target dependency'],afterChange:aiDependencyReview.afterDependencyChange||['run the narrowest relevant project validation','aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency'],mustNotDo:['do not run broad install, update, audit fix, or lockfile rewrite commands before reading SBOM and status'],scannerEvidence:scannerGuidance.decision||'light-sbom-ok-for-coordination',rule:'Use the light SBOM to coordinate dependency work; record intent, use scanner evidence when needed, then checkpoint and hand off.'};",
    "const dependencyCoordinationHtml=`<table><tr><th>Mode</th><td><code>${esc(dependencyCoordination.mode||'advisory')}</code></td></tr><tr><th>Read</th><td><code>${esc((dependencyCoordination.readFirst||[]).join(' -> '))}</code></td></tr><tr><th>Next</th><td><code>${esc(dependencyCoordination.nextCommand||'aienvmp sbom --json')}</code></td></tr><tr><th>Targets</th><td>${esc((dependencyCoordination.reviewTargets||[]).join(', ')||'none')}</td></tr><tr><th>Scanner evidence</th><td><code>${esc(dependencyCoordination.scannerEvidence||'light-sbom-ok-for-coordination')}</code></td></tr><tr><th>Before</th><td><code>${esc((dependencyCoordination.beforeChange||[]).slice(0,3).join(' -> '))}</code></td></tr><tr><th>After</th><td><code>${esc((dependencyCoordination.afterChange||[]).slice(-1)[0]||'aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency')}</code></td></tr></table><div class=\"timeline\">${(dependencyCoordination.mustNotDo||[]).slice(0,3).map(item=>`<div class=\"event\"><time>avoid</time><div>${esc(item)}</div></div>`).join('')}</div><div class=\"path\">${esc(dependencyCoordination.rule||'Coordinate dependency work through SBOM, intent, scanner evidence, checkpoint, and handoff.')}</div>`;"
  ].join("\n");
}

export function dashboardReviewPlanHtmlClientScript() {
  return [
    "const aiReviewPlanHtml=aiReviewPlan.status?`<table><tr><th>Status</th><td><code>${esc(aiReviewPlan.status)}</code></td></tr><tr><th>Risk</th><td><code>${esc(aiReviewPlan.risk||'clear/0')}</code></td></tr><tr><th>Confidence</th><td><code>${esc(aiReviewPlan.securityConfidence||'unknown')}</code></td></tr><tr><th>Policy</th><td><code>${esc(aiReviewPlan.packageManagerPolicy||'not-detected')}</code></td></tr><tr><th>Before</th><td><code>${esc(aiReviewPlan.beforeChange||'aienvmp sbom --json')}</code></td></tr><tr><th>After</th><td><code>${esc(aiReviewPlan.afterChange||'aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency')}</code></td></tr></table><div class=\"path\">${esc(aiReviewPlan.rule||'Record dependency intent before dependency or lockfile changes.')}</div>`:'<div class=\"okline\">No AI review plan available. Run <code>aienvmp sbom --json</code>.</div>';"
  ].join("\n");
}

export function dashboardScannerGuidanceHtmlClientScript() {
  return [
    "const scannerTools=(scannerGuidance.externalTools||[]).map(t=>t.tool||t).filter(Boolean).join(', ');",
    "const scannerWorkflow=scannerGuidance.evidenceWorkflow||['read aienvmp light SBOM, status, and context','run dedicated scanner evidence only when security confidence matters','record intent, checkpoint, and hand off after accepted changes'];",
    "const scannerGuidanceHtml=`<table><tr><th>Mode</th><td><code>${esc(scannerGuidance.mode||'optional-read-only')}</code></td></tr><tr><th>Decision</th><td><code>${esc(scannerGuidance.decision||'light-sbom-ok-for-coordination')}</code></td></tr><tr><th>Reason</th><td>${esc(scannerGuidance.reason||'Use scanner evidence only when security confidence matters.')}</td></tr><tr><th>Default</th><td><code>${esc(scannerGuidance.defaultCommand||'aienvmp sbom --json')}</code></td></tr><tr><th>Scanner</th><td><code>${esc(scannerGuidance.scannerCommand||'aienvmp sync --security')}</code></td></tr><tr><th>Tools</th><td>${esc(scannerTools||'Syft, Trivy, Grype, Dependency-Track')}</td></tr><tr><th>Confidence</th><td><code>${esc(scannerGuidance.securityConfidence||'unknown')}</code></td></tr><tr><th>Run before</th><td>${esc((scannerGuidance.whenToRun||[]).join(', ')||'security-sensitive decisions')}</td></tr><tr><th>Evidence rule</th><td>${esc(scannerGuidance.interoperabilityRule||'Use aienvmp as the AI coordination layer and dedicated scanners for full evidence.')}</td></tr></table><div class=\"timeline\">${scannerWorkflow.slice(0,5).map(step=>`<div class=\"event\"><time>evidence</time><div>${esc(step)}</div></div>`).join('')}</div><div class=\"path\">${esc(scannerGuidance.rule||'Keep the default SBOM lightweight; use optional read-only scanners when security confidence matters.')}</div>`;"
  ].join("\n");
}

export function dashboardRiskSummaryClientScript() {
  return [
    "const riskSummaryHtml=riskSummary.level?`<table><tr><th>Level</th><td><code>${esc(riskSummary.level)}</code> ${esc(riskSummary.score||0)}</td></tr><tr><th>Scanner</th><td><code>${esc(riskSummary.scanner||'unknown')}</code></td></tr><tr><th>Next</th><td>${esc(riskSummary.next||'No SBOM action required.')}</td></tr><tr><th>Targets</th><td>${esc((riskSummary.reviewTargets||[]).join(', ')||'none')}</td></tr></table>${riskSummary.signals?.length?'<div class=\"timeline\">'+riskSummary.signals.slice(0,5).map(s=>`<div class=\"event\"><time>risk</time><div>${esc(s)}</div></div>`).join('')+'</div>':''}`:'<div class=\"okline\">No risk summary available.</div>';"
  ].join("\n");
}

export function dashboardPackageManagerPolicyClientScript() {
  return [
    "const pmPolicyHtml='<table><tr><th>Status</th><td><code>'+esc(pmPolicy.status||'no-lockfile')+'</code></td></tr><tr><th>Guidance</th><td>'+esc(pmPolicy.guidance||'No lockfile policy detected.')+'</td></tr></table>';"
  ].join("\n");
}

export function dashboardDependencyHintsClientScript() {
  return [
    "const dependencyHintsHtml=dependencyHints.length?'<div class=\"timeline\">'+dependencyHints.slice(0,5).map(h=>`<div class=\"event\"><time>${esc(h.ecosystem||'deps')}</time><div><b>${esc(h.manifest)}</b> <code>${esc(h.manager||'unknown')}</code> ${esc(h.packages||0)} packages${h.riskPackages?.length?`<div class=\"path\">risk: ${esc(h.riskPackages.map(p=>p.name).join(', '))}</div>`:''}<div class=\"path\">${esc((h.groups||[]).join(', ')||'no groups')}${h.lockfiles?.length?` / lockfiles: ${esc(h.lockfiles.map(l=>l.file).join(', '))}`:''}</div></div></div>`).join('')+'</div>':'<div class=\"okline\">No dependency change hints available.</div>';"
  ].join("\n");
}

export function dashboardDependencyReadSetClientScript() {
  return [
    "const dependencyReadSetHtml=dependencyReadSet.length?'<div class=\"timeline\">'+dependencyReadSet.slice(0,5).map(d=>`<div class=\"event\"><time>${esc(d.ecosystem||'deps')}</time><div><b>${esc(d.manifest||'dependency files')}</b> <code>${esc(d.manager||'unknown')}</code><div class=\"path\">${esc([d.manifest,...(d.lockfiles||[])].filter(Boolean).join(', '))}</div>${d.riskPackages?.length?`<div class=\"path\">risk: ${esc(d.riskPackages.join(', '))}</div>`:''}</div></div>`).join('')+'</div>':'<div class=\"okline\">No dependency files detected.</div>';"
  ].join("\n");
}

export function dashboardDependencyProtocolClientScript() {
  return [
    "const dependencyProtocolHtml=dependencyProtocol.commands?'<table><tr><th>Mode</th><td><code>'+esc(dependencyProtocol.mode||'advisory')+'</code></td></tr><tr><th>Policy</th><td><code>'+esc(dependencyProtocol.packageManagerPolicy||'not-detected')+'</code></td></tr><tr><th>Intent</th><td><code>'+esc(dependencyProtocol.commands.recordIntent)+'</code></td></tr><tr><th>After</th><td><code>'+esc(dependencyProtocol.commands.checkpointAfterChange||dependencyProtocol.commands.recordAfterChange)+'</code></td></tr></table><div class=\"timeline\">'+(dependencyProtocol.mustNotDo||[]).slice(0,3).map(item=>`<div class=\"event\"><time>avoid</time><div>${esc(item)}</div></div>`).join('')+'</div>':'<div class=\"okline\">No dependency change protocol available.</div>';"
  ].join("\n");
}

export function dashboardEnvironmentProtocolClientScript() {
  return [
    "const environmentProtocol=manifest.preflight?.environmentChangeProtocol||{};",
    "const environmentProtocolHtml=environmentProtocol.commands?`<table><tr><th>Mode</th><td><code>${esc(environmentProtocol.mode||'advisory')}</code></td></tr><tr><th>Applies</th><td>${esc(environmentProtocol.appliesWhen||'Before shared environment changes.')}</td></tr><tr><th>Read</th><td><code>${esc((environmentProtocol.readFirst||[]).join(' -> ')||'aienvmp status --json')}</code></td></tr><tr><th>Intent</th><td><code>${esc(environmentProtocol.commands.recordIntent||'aienvmp intent --actor agent:id --action planned-change --target environment')}</code></td></tr><tr><th>After</th><td><code>${esc(environmentProtocol.commands.checkpointAfterChange||'aienvmp checkpoint --actor agent:id --summary what-changed --target environment')}</code></td></tr><tr><th>Handoff</th><td><code>${esc(environmentProtocol.commands.handoff||'aienvmp handoff --record --actor agent:id')}</code></td></tr></table><div class=\"timeline\">${(environmentProtocol.mustNotDo||[]).slice(0,3).map(item=>`<div class=\"event\"><time>avoid</time><div>${esc(item)}</div></div>`).join('')}</div><div class=\"path\">${esc(environmentProtocol.rule||'Keep shared environment changes advisory and recorded.')}</div>`:'<div class=\"okline\">No environment change protocol available. Run <code>aienvmp status --write</code>.</div>';"
  ].join("\n");
}

export function dashboardReleaseReadinessClientScript() {
  return [
    "const releaseChecks=releaseReadiness?.requiredBeforeStable||[];",
    "const publishDecision=releaseReadiness?.publishDecision||{};",
    "const currentBatch=releaseReadiness?.currentBatch||{};",
    "const releaseEvidence=releaseReadiness?.evidenceCommands||[];",
    "const releaseFocus=releaseReadiness?.stabilizationFocus||[];",
    "const releaseReadinessHtml=`<table><tr><th>Target</th><td><code>${esc(releaseReadiness?.target||'0.2.0')}</code></td></tr><tr><th>Status</th><td><code>${esc(releaseReadiness?.status||'prototype-hardening')}</code></td></tr><tr><th>Decision</th><td><code>${esc(publishDecision.default||'hold')}</code></td></tr><tr><th>Batch</th><td><code>${esc(currentBatch.status||'accumulating')}</code> ${esc(currentBatch.releaseType||'stability-batch')}</td></tr><tr><th>Gate</th><td><code>${esc(releaseChecks[0]||'npm run release:check passes locally')}</code></td></tr><tr><th>Evidence</th><td><code>${esc(releaseEvidence[0]||'npm run release:check')}</code></td></tr><tr><th>Focus</th><td>${esc(releaseFocus[0]||'AI contract stabilization')}</td></tr><tr><th>Publish when</th><td>${esc((publishDecision.publishWhen||[])[0]||'meaningful changes are batched')}</td></tr><tr><th>Hold when</th><td>${esc((publishDecision.holdWhen||[])[0]||'changes can be batched')}</td></tr></table><div class=\"timeline\">${(currentBatch.themes||[]).slice(0,5).map(item=>`<div class=\"event\"><time>batch</time><div>${esc(item)}</div></div>`).join('')}</div><div class=\"timeline\">${releaseChecks.slice(1,5).map(item=>`<div class=\"event\"><time>check</time><div>${esc(item)}</div></div>`).join('')}</div><div class=\"timeline\">${releaseEvidence.slice(1,4).map(cmd=>`<div class=\"event\"><time>proof</time><div><code>${esc(cmd)}</code></div></div>`).join('')}</div><div class=\"path\">${esc(currentBatch.reason||releaseReadiness?.batchRule||'Batch meaningful changes before one npm publish.')}</div><div class=\"path\">${esc(publishDecision.emergencyException||'Security fixes may publish sooner after the release gate.')}</div><div class=\"path\">${esc(releaseReadiness?.stableContractRule||'After 0.2.0, documented JSON fields stay additive and backward-compatible.')}</div>`;"
  ].join("\n");
}

export function dashboardQualitySignalsClientScript() {
  return [
    "const qualitySignals=manifest.preflight?.qualitySignals||schemaQualitySignals||{};",
    "const qualityPrinciples=qualitySignals.principles||['AI-friendly','simple','lightweight','advisory-first','batched-release'];",
    "const qualityChecks=qualitySignals.checks||[];",
    "const qualitySignalsHtml=`<table><tr><th>Status</th><td><code>${esc(qualitySignals.status||'prototype-hardening')}</code></td></tr><tr><th>Principles</th><td>${esc(qualityPrinciples.join(', '))}</td></tr><tr><th>First check</th><td>${esc(qualityChecks[0]?.name||'AI entry path')}</td></tr><tr><th>Evidence</th><td><code>${esc(qualityChecks[0]?.evidence||'aienvmp discover --json && aienvmp status --json && aienvmp context --json')}</code></td></tr></table><div class=\"timeline\">${qualityChecks.slice(0,5).map(item=>`<div class=\"event\"><time>quality</time><div><b>${esc(item.name)}</b> ${esc(item.signal||'')}</div></div>`).join('')}</div><div class=\"path\">${esc((qualitySignals.mustStayTrue||[])[0]||'do not require background services, daemons, or lock managers for the default flow')}</div><div class=\"path\">${esc(qualitySignals.rule||'Keep the default product lightweight and AI-readable before adding deeper integrations.')}</div>`;"
  ].join("\n");
}
