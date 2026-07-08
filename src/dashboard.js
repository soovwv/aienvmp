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
