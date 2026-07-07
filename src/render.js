const markerBegin = "<!-- aienvmp:begin -->";
const markerEnd = "<!-- aienvmp:end -->";

export { markerBegin, markerEnd };

export function renderAIEnv(manifest, timeline = [], warnings = [], intents = [], policy = {}) {
  const lines = [];
  lines.push("# AI Environment Protocol", "");
  lines.push("This workspace uses `aienvmp` as the shared environment source of truth for humans and AI agents.", "");
  lines.push("## Read Me First", "");
  lines.push("Before changing runtimes, package managers, Docker settings, or global packages:");
  lines.push("1. Run `aienvmp context`.");
  lines.push("2. Prefer project-local version files such as `.nvmrc`, `.python-version`, `mise.toml`, and `.tool-versions`.");
  lines.push("3. Ask the user before changing global environment state.");
  lines.push("4. Record planned environment changes with `aienvmp intent --actor agent:id --action planned-change`.");
  lines.push("5. After environment changes, run `aienvmp sync`.");
  lines.push("6. Record what changed with `aienvmp record --actor agent:id --summary what-changed`.");
  lines.push("7. At handoff, run `aienvmp handoff --record --actor agent:id`.", "");
  lines.push("## Current Policy", "");
  lines.push(...policyLines(policy));
  lines.push("- Enforcement: non-blocking by default; warnings require review but do not lock the machine.");
  lines.push("- Project-local dependency installs: allowed when required by the user task.", "");
  lines.push("## Trust State", "");
  lines.push(`- State: ${manifest.trust?.state || "observed"}`);
  lines.push("- Rule: AI agents may observe, plan, and record changes, but verified requires human or CI review.", "");
  lines.push("## AI Preflight Summary", "");
  lines.push(...contextLines(manifest, warnings, intents), "");
  lines.push("## Runtime Map", "");
  pushMap(lines, "Runtimes", manifest.runtimes);
  pushMap(lines, "Package Managers", manifest.packageManagers);
  pushMap(lines, "Containers", manifest.containers);
  lines.push("## Global Tool Inventory", "");
  lines.push(...inventoryLines(manifest.inventory), "");
  lines.push("## Dependency Snapshot", "");
  lines.push(...dependencyLines(manifest.dependencySnapshot), "");
  lines.push("## Light SBOM", "");
  lines.push(...lightSbomLines(manifest.lightSbom), "");
  lines.push("## Security Summary", "");
  lines.push(...securityLines(manifest.security), "");
  lines.push("## Project Requirements And Hints", "");
  pushMap(lines, "Detected", manifest.projectHints);
  lines.push("## Drift And Warnings", "");
  if (warnings.length) {
    for (const warning of warnings) lines.push(`- ${warning.message}`);
  } else {
    lines.push("- No blocking environment warnings detected.");
  }
  lines.push("", "## Pending Agent Intents", "");
  if (intents.length) {
    for (const intent of intents.slice(-8).reverse()) {
      lines.push(`- ${intent.at}: ${intent.actor} plans ${intent.action}${intent.target ? ` (${intent.target})` : ""}`);
    }
  } else {
    lines.push("- No pending agent intents recorded.");
  }
  lines.push("", "## Environment Ledger", "");
  if (timeline.length) {
    for (const item of timeline.slice(-8).reverse()) {
      lines.push(`- ${item.at}: ${formatTimeline(item)}`);
    }
  } else {
    lines.push("- No previous environment changes recorded.");
  }
  lines.push("", "## Snapshot", "");
  lines.push(`- Generated: ${manifest.generatedAt}`);
  lines.push(`- Workspace: ${manifest.workspace.path}`);
  lines.push(`- OS: ${manifest.os.platform} ${manifest.os.release} ${manifest.os.arch}`);
  lines.push("");
  return lines.join("\n");
}

export function renderAgentPointer(target = "agents") {
  const label = target === "claude" ? "Claude" : target === "gemini" ? "Gemini" : "AI agents";
  return `## aienvmp Environment Map

${label} should use \`aienvmp\` as the workspace environment source of truth.

Before changing runtimes, package managers, Docker settings, global packages, or environment policy:

1. Run \`aienvmp context\`.
2. Read \`AIENV.md\`.
3. If the context says \`review-required\`, ask the user before changing the environment.
4. Record planned environment changes with \`aienvmp intent\`.
5. After environment changes, run \`aienvmp sync\`.
6. Record what changed with \`aienvmp record\`.
7. At handoff, run \`aienvmp handoff --record --actor agent:id\`.

\`aienvmp\` does not replace this instruction file. It provides the live env map, lightweight runtime SBOM, intent log, timeline, and dashboard.`;
}

export function renderContext(manifest, timeline = [], warnings = [], intents = [], policy = {}, recommendedActions = []) {
  const status = warnings.length ? "review-required" : "clear";
  const next = warnings.length ? "Review warnings before changing the environment." : "Continue with project-local work. Record intent before environment changes.";
  return [
    "# AI Preflight Context",
    "",
    `Status: ${status}`,
    `Next: ${next}`,
    "Project-local work: allowed; environment changes require intent and review when warnings or open intents exist.",
    "Enforcement: advisory by default; use `aienvmp doctor --strict <scope>` only when explicit CI failure is wanted.",
    `Trust: ${manifest.trust?.state || "observed"} (verified requires human or CI)`,
    `Workspace: ${manifest.workspace.path}`,
    `Node: ${manifest.runtimes.node || "not detected"}`,
    `Python: ${manifest.runtimes.python || manifest.runtimes.python3 || "not detected"}`,
    `Docker: ${manifest.containers.docker ? "available" : "not detected"}`,
    `Inventory: ${manifest.inventory?.mode || "basic"}${manifest.inventory?.enabled ? " enabled" : " disabled"}`,
    `Dependencies: ${manifest.dependencySnapshot?.summary?.packages || 0} packages across ${(manifest.dependencySnapshot?.summary?.ecosystems || []).join(", ") || "no ecosystems"}`,
    `Security: ${manifest.security?.mode || "basic"}${manifest.security?.enabled ? ` enabled (${manifest.security.summary?.total || 0} vulnerabilities)` : " disabled"}`,
    `Policy Node: ${policy.node || "not set"}`,
    `Policy Python: ${policy.python || "not set"}`,
    `Policy Package Manager: ${policy.packageManager || "not set"}`,
    "",
    "Must follow:",
    "- Ask the user before global runtime, package manager, Docker, or global package changes.",
    "- Treat policy mismatches as review-required, not as permission to break ongoing operations.",
    "- Prefer project-local version files and local environments.",
    "- Before planned env changes, run `aienvmp intent --actor agent:id --action planned-change`.",
    "- After env changes, run `aienvmp sync`.",
    "- Then run `aienvmp record --actor agent:id --summary what-changed`.",
    "- Before handing work to another AI, run `aienvmp handoff --record --actor agent:id`.",
    "",
    "Warnings:",
    ...(warnings.length ? warnings.map((w) => `- ${w.message}`) : ["- none"]),
    "",
    "Recommended actions:",
    ...(recommendedActions.length ? recommendedActions.map((item) => `- [${item.priority}] ${item.summary}${item.command ? ` (${item.command})` : ""}`) : ["- none"]),
    "",
    "Open intents:",
    ...(intents.length ? intents.slice(-5).reverse().map((i) => `- ${i.actor}: ${i.action}`) : ["- none"]),
    "",
    "Recent ledger:",
    ...(timeline.length ? timeline.slice(-5).reverse().map((t) => `- ${formatTimeline(t)}`) : ["- none"]),
    ""
  ].join("\n");
}

export function renderHandoff(handoff) {
  const lines = [
    "# AI Handoff",
    "",
    `Status: ${handoff.status}`,
    `Decision: ${handoff.decision?.mode || handoff.status}`,
    `Trust: ${handoff.trust?.state || "observed"} (not AI-verified)`,
    `Schema: ${handoff.schemaVersion}`,
    `Workspace: ${handoff.workspace?.path || "unknown"}`,
    "",
    "Safe runtime:",
    `- Node: ${handoff.safeRuntime.node}`,
    `- Python: ${handoff.safeRuntime.python}`,
    `- Docker: ${handoff.safeRuntime.docker}`,
    `- Inventory: ${handoff.inventory?.mode || "basic"}${handoff.inventory?.enabled ? " enabled" : " disabled"}`,
    `- Security: ${handoff.security?.mode || "basic"}${handoff.security?.enabled ? ` enabled (${handoff.security.summary?.total || 0} vulnerabilities)` : " disabled"}`,
    "",
    "Open intents:",
    ...(handoff.openIntents.length ? handoff.openIntents.map((i) => `- ${i.actor}: ${i.action}${i.target ? ` (${i.target})` : ""}`) : ["- none"]),
    "",
    "Warnings:",
    ...(handoff.warnings.length ? handoff.warnings.map((w) => `- ${w.message}`) : ["- none"]),
    "",
    "Recommended actions:",
    ...(handoff.recommendedActions?.length ? handoff.recommendedActions.map((item) => `- [${item.priority}] ${item.summary}${item.command ? ` (${item.command})` : ""}`) : ["- none"]),
    "",
    "Recent changes:",
    ...(handoff.recentChanges.length ? handoff.recentChanges.map((t) => `- ${formatTimeline(t)}`) : ["- none"]),
    "",
    "Must not do:",
    ...handoff.mustNotDo.map((item) => `- ${item}`),
    "",
    `Recommended next: ${handoff.recommendedNext}`,
    ""
  ];
  return lines.join("\n");
}

export function renderPlan(plan) {
  const lines = [
    "# AI Environment Plan",
    "",
    `Status: ${plan.status}`,
    `Decision: ${plan.decision?.mode || plan.status}`,
    `Enforcement: ${plan.enforcement?.mode || "advisory-by-default"} (${plan.enforcement?.localBehavior || "non-blocking"})`,
    `Generated: ${plan.generatedAt}`,
    `Workspace: ${plan.workspace?.path || "unknown"}`,
    "",
    "Purpose: read-only review plan for AI agents and humans. It does not install, remove, upgrade, downgrade, or lock anything.",
    "",
    "Recommended actions:",
    ...(plan.recommendedActions.length
      ? plan.recommendedActions.map((item) => `- [${item.priority}] ${item.category}: ${item.summary}${item.command ? ` (${item.command})` : ""}`)
      : ["- none"]),
    "",
    "Review gates:",
    ...plan.reviewGates.map((item) => `- ${item}`),
    "",
    "Remediation steps:",
    ...(plan.remediationSteps?.length ? plan.remediationSteps.slice(0, 5).flatMap(remediationLines) : ["- none"]),
    "",
    "Environment steps:",
    ...(plan.environmentSteps?.length ? plan.environmentSteps.slice(0, 5).flatMap(environmentLines) : ["- none"]),
    "",
    "Warnings:",
    ...(plan.warnings.length ? plan.warnings.map((warning) => `- [${warning.code}] ${warning.message}`) : ["- none"]),
    ""
  ];
  return lines.join("\n");
}

function environmentLines(item) {
  return [
    `- ${item.category}: ${item.summary}`,
    ...item.steps.slice(0, 4).map((step) => `  - ${step}`)
  ];
}

function remediationLines(item) {
  const fix = item.fixVersions?.length ? `fix ${item.fixVersions.join(", ")}` : item.fixAvailable ? "fix available" : "review required";
  const advisories = (item.advisories || []).map((advisory) => advisory.id || advisory.title).filter(Boolean).slice(0, 2);
  const dependency = item.directDependency && item.dependency ? `; declared in ${item.dependency.manifest} ${item.dependency.version}` : "; not found in dependency snapshot";
  const priority = item.remediationPriority ? `priority ${item.remediationPriority.level}/${item.remediationPriority.score}` : "priority unscored";
  return [
    `- ${item.package}: ${item.severity}; ${priority}; ${fix}${dependency}${advisories.length ? `; advisories ${advisories.join(", ")}` : ""}`,
    ...item.steps.slice(0, 4).map((step) => `  - ${step}`)
  ];
}

export function renderDashboard(manifest, timeline = [], warnings = [], intents = [], policy = {}) {
  const data = JSON.stringify({ manifest, timeline, warnings, intents, policy });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>aienvmp dashboard</title>
<style>
:root{color-scheme:dark;--bg:#08110f;--panel:#0d1815;--panel2:#101e1a;--line:#214138;--line2:#172b26;--text:#eefcf5;--muted:#91aa9d;--green:#47e58d;--green2:#133d2a;--amber:#f4bf5f;--red:#ff6b6b;--code:#d7ffe9}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--bg);color:var(--text)}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(71,229,141,.12),transparent 38%),radial-gradient(circle at 74% 0,rgba(244,191,95,.08),transparent 28%)}
.shell{position:relative;max-width:1180px;margin:0 auto;padding:26px 22px 36px}
header{border:1px solid var(--line);background:linear-gradient(135deg,rgba(16,30,26,.96),rgba(8,17,15,.94));border-radius:8px;padding:22px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:start}
.eyebrow{color:var(--green);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
h1,h2,h3,p{margin:0}h1{font-size:clamp(28px,4vw,46px);line-height:1.02;margin-top:8px;letter-spacing:0}h2{font-size:17px;letter-spacing:0}h3{font-size:13px;color:var(--muted);font-weight:600;letter-spacing:0}
.sub{color:var(--muted);margin-top:12px;max-width:680px;line-height:1.55}
.stamp{min-width:220px;border:1px solid var(--line2);background:#091310;border-radius:8px;padding:14px}
.stamp b{display:block;color:var(--green);font-size:24px;margin-bottom:3px}.stamp span{display:block;color:var(--muted);font-size:12px;overflow-wrap:anywhere}
.audit{display:grid;grid-template-columns:1.2fr repeat(3,minmax(0,.8fr));gap:12px;margin:14px 0}
.audit-item{border:1px solid var(--line);background:rgba(13,24,21,.92);border-radius:8px;padding:14px;min-width:0}
.audit-item.primary{background:linear-gradient(135deg,rgba(19,61,42,.88),rgba(9,19,16,.95))}
.audit-item.review{background:linear-gradient(135deg,rgba(81,53,17,.88),rgba(9,19,16,.95));border-color:rgba(244,191,95,.42)}
.audit-k{color:var(--muted);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.audit-v{margin-top:7px;font-size:20px;font-weight:800;color:var(--text);overflow-wrap:anywhere}
.audit-hint{margin-top:6px;color:var(--muted);font-size:12px;line-height:1.4}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0 18px}
.metric,.card{border:1px solid var(--line);background:rgba(13,24,21,.9);border-radius:8px}
.metric{padding:14px}.metric .num{font-size:28px;font-weight:800;color:var(--green);line-height:1}.metric .label{margin-top:7px;color:var(--muted);font-size:12px}
.layout{display:grid;grid-template-columns:1.35fr .9fr;gap:14px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.card{padding:16px;min-width:0}.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.pill{display:inline-flex;align-items:center;border:1px solid var(--line);background:var(--green2);color:var(--green);border-radius:999px;padding:4px 9px;font-size:12px;font-weight:700}
.pill.warn{background:rgba(244,191,95,.12);border-color:rgba(244,191,95,.35);color:var(--amber)}
.pill.off{background:#1c2421;color:var(--muted)}
table{width:100%;border-collapse:collapse}td,th{border-top:1px solid var(--line2);padding:10px 0;text-align:left;vertical-align:top}th{width:42%;color:var(--muted);font-weight:600}td{color:var(--text);overflow-wrap:anywhere}
code{color:var(--code);background:#0a2017;border:1px solid #17462f;padding:2px 6px;border-radius:5px}
.warnings{display:grid;gap:9px}.warning{border:1px solid rgba(244,191,95,.35);background:rgba(244,191,95,.08);border-radius:8px;padding:11px;color:#ffe3a9}
.okline{border:1px solid rgba(71,229,141,.32);background:rgba(71,229,141,.08);border-radius:8px;padding:12px;color:var(--green)}
.agents{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.agent{border:1px solid var(--line2);border-radius:8px;padding:10px;background:#0a1412}.agent strong{display:block}.agent span{color:var(--muted);font-size:12px}
.timeline{display:grid;gap:10px}.event{display:grid;grid-template-columns:108px 1fr;gap:12px;border-top:1px solid var(--line2);padding-top:10px}.event time{color:var(--muted);font-size:12px}.event b{color:var(--green)}
.path{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--muted);font-size:12px;overflow-wrap:anywhere}
@media (max-width:860px){header,.layout{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.agents{grid-template-columns:1fr}}
@media (max-width:860px){.audit{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.shell{padding:14px}.metrics{grid-template-columns:1fr}.event{grid-template-columns:1fr}h1{font-size:32px}}
@media (max-width:520px){.audit{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="shell" id="app"></main>
<script type="application/json" id="data">${escapeHtml(data)}</script>
<script>
const {manifest,timeline,warnings,intents,policy}=JSON.parse(document.getElementById('data').textContent);
function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
const entries=o=>Object.entries(o||{});
const rows=o=>entries(o).map(([k,v])=>\`<tr><th>\${esc(k)}</th><td><code>\${esc(String(v))}</code></td></tr>\`).join('')||'<tr><td colspan="2">None detected</td></tr>';
const inventoryGroups=manifest.inventory?.tools||{};
const inventoryCount=Object.values(inventoryGroups).reduce((sum,items)=>sum+(Array.isArray(items)?items.length:0),0);
const inventoryHtml=manifest.inventory?.enabled?('<table>'+Object.entries(inventoryGroups).map(([k,v])=>\`<tr><th>\${esc(k)}</th><td><code>\${Array.isArray(v)?v.length:0} tools</code></td></tr>\`).join('')+'</table>'):'<div class="okline">Deep global inventory is off. Run <code>aienvmp sync --deep</code> when an AI needs global tool awareness.</div>';
const deps=manifest.dependencySnapshot||{};
const depSummary=deps.summary||{ecosystems:[],manifests:0,packages:0};
const depPackages=deps.packages||[];
const depHtml=depPackages.length?'<table><tr><th>Packages</th><td><code>'+esc(depSummary.packages||0)+'</code></td></tr><tr><th>Ecosystems</th><td><code>'+esc((depSummary.ecosystems||[]).join(', ')||'none')+'</code></td></tr><tr><th>Manifests</th><td><code>'+esc((deps.manifests||[]).join(', ')||'none')+'</code></td></tr></table><div class="timeline">'+depPackages.slice(0,8).map(p=>\`<div class="event"><time>\${esc(p.ecosystem)}</time><div><b>\${esc(p.name)}</b> <code>\${esc(p.version)}</code><div class="path">\${esc(p.manifest)} / \${esc(p.group)}</div></div></div>\`).join('')+'</div>':'<div class="okline">No project dependency manifests detected.</div>';
const lightSbom=manifest.lightSbom||{};
const lightSbomSummary=lightSbom.summary||{};
const pmPolicy=lightSbom.packageManagerPolicy||{};
const topRisk=lightSbom.topRisk||[];
const dependencyHints=lightSbom.dependencyChangeHints||[];
const dependencyHintsHtml=dependencyHints.length?'<div class="timeline">'+dependencyHints.slice(0,5).map(h=>\`<div class="event"><time>\${esc(h.ecosystem||'deps')}</time><div><b>\${esc(h.manifest)}</b> <code>\${esc(h.manager||'unknown')}</code> \${esc(h.packages||0)} packages\${h.riskPackages?.length?\`<div class="path">risk: \${esc(h.riskPackages.map(p=>p.name).join(', '))}</div>\`:''}<div class="path">\${esc((h.groups||[]).join(', ')||'no groups')}\${h.lockfiles?.length?\` / lockfiles: \${esc(h.lockfiles.map(l=>l.file).join(', '))}\`:''}</div></div></div>\`).join('')+'</div>':'<div class="okline">No dependency change hints available.</div>';
const pmPolicyHtml='<table><tr><th>Status</th><td><code>'+esc(pmPolicy.status||'no-lockfile')+'</code></td></tr><tr><th>Guidance</th><td>'+esc(pmPolicy.guidance||'No lockfile policy detected.')+'</td></tr></table>';
const lightSbomHtml=\`<table><tr><th>Packages</th><td><code>\${esc(lightSbomSummary.packages||0)}</code></td></tr><tr><th>Vulnerabilities</th><td><code>\${esc(lightSbomSummary.vulnerabilities||0)}</code></td></tr><tr><th>Direct vulnerable</th><td><code>\${esc(lightSbomSummary.directVulnerablePackages||0)}</code></td></tr><tr><th>Manifests</th><td><code>\${esc((lightSbomSummary.manifests||[]).join(', ')||'none')}</code></td></tr><tr><th>Lockfiles</th><td><code>\${esc((lightSbomSummary.lockfiles||[]).map(l=>l.file).join(', ')||'none')}</code></td></tr></table><h3 style="margin-top:12px">Package manager policy</h3>\${pmPolicyHtml}\${topRisk.length?'<div class="timeline">'+topRisk.slice(0,5).map(p=>\`<div class="event"><time>\${esc(p.priority)}</time><div><b>\${esc(p.name)}</b> \${esc(p.severity)} \${p.directDependency?'<code>direct</code>':'<code>transitive</code>'}<div class="path">\${esc(p.manifest||p.ecosystem)} \${esc(p.version||'')}</div></div></div>\`).join('')+'</div>':'<div class="okline">No high-risk package summary in the current light SBOM.</div>'}<h3 style="margin-top:12px">Dependency change hints</h3>\${dependencyHintsHtml}\`;
const sec=manifest.security||{};
const secSummary=sec.summary||{total:0,critical:0,high:0,moderate:0,low:0,info:0};
const secPackages=sec.topPackages||[];
const securityFix=p=>p.fixVersions?.length?\`fix \${p.fixVersions.slice(0,3).join(', ')}\`:(p.fixAvailable?'fix available':'review required');
const securityRefs=p=>p.advisories?.length?\` - \${p.advisories.map(a=>a.id||a.title).filter(Boolean).slice(0,2).join(', ')}\`:'';
const securityDep=p=>p.directDependency&&p.dependency?\`<div class="path">\${esc(p.dependency.manifest)} / \${esc(p.dependency.group)} / \${esc(p.dependency.version)}</div>\`:'<div class="path">not found in dependency snapshot</div>';
const securityPriority=p=>p.remediationPriority?\`<code>\${esc(p.remediationPriority.level)} \${esc(p.remediationPriority.score)}</code> \`:'';
const securityHtml=sec.enabled?\`<table><tr><th>Total</th><td><code>\${esc(secSummary.total||0)}</code></td></tr><tr><th>Critical</th><td><code>\${esc(secSummary.critical||0)}</code></td></tr><tr><th>High</th><td><code>\${esc(secSummary.high||0)}</code></td></tr><tr><th>Moderate</th><td><code>\${esc(secSummary.moderate||0)}</code></td></tr><tr><th>Low</th><td><code>\${esc(secSummary.low||0)}</code></td></tr></table>\${secPackages.length?'<div class="timeline">'+secPackages.slice(0,5).map(p=>\`<div class="event"><time>\${esc(p.severity)}</time><div><b>\${esc(p.name)}</b> \${securityPriority(p)}\${esc(securityFix(p))}\${esc(securityRefs(p))}\${securityDep(p)}</div></div>\`).join('')+'</div>':'<div class="okline" style="margin-top:10px">No vulnerable packages reported.</div>'}\`:'<div class="okline">Security scan is off. Run <code>aienvmp sync --security</code> for read-only vulnerability summary.</div>';
const change=c=>c.type==='changed'?\`\${c.scope} \${c.key}: \${c.before} -> \${c.after}\`:\`\${c.scope} \${c.key}: \${c.type} \${c.after||c.before}\`;
const timelineLabel=t=>t.change?change(t.change):(t.summary||t.action||t.type||'recorded change');
const agentNames={agents:'Codex',claude:'Claude',gemini:'Gemini'};
const agentCards=Object.entries(agentNames).map(([key,label])=>\`<div class="agent"><strong>\${label}</strong><span>\${manifest.agentFiles?.[key]?'instruction file detected':'not detected'}</span></div>\`).join('');
const warnHtml=warnings.length?'<div class="warnings">'+warnings.map(w=>\`<div class="warning">\${esc(w.message)}</div>\`).join('')+'</div>':'<div class="okline">No blocking environment warnings detected.</div>';
const timelineHtml=timeline.length?'<div class="timeline">'+timeline.slice(-8).reverse().map(t=>\`<div class="event"><time>\${esc(t.at.replace('T',' ').slice(0,16))}</time><div><b>\${esc(t.actor||'system')}</b> \${esc(timelineLabel(t))}</div></div>\`).join('')+'</div>':'<div class="okline">No previous environment changes recorded.</div>';
const intentsHtml=intents.length?'<div class="timeline">'+intents.slice(-6).reverse().map(i=>\`<div class="event"><time>\${esc(i.at.replace('T',' ').slice(0,16))}</time><div><b>\${esc(i.actor)}</b> plans \${esc(i.action)}</div></div>\`).join('')+'</div>':'<div class="okline">No pending agent intents recorded.</div>';
const policyHtml=entries(policy).length?\`<table>\${rows(policy)}</table>\`:'<div class="okline">No explicit version policy set.</div>';
const actions=manifest.recommendedActions||[];
const actionsHtml=actions.length?'<div class="timeline">'+actions.slice(0,6).map(a=>\`<div class="event"><time>\${esc(a.priority)}</time><div><b>\${esc(a.category)}</b> \${esc(a.summary)}\${a.command?\`<div class="path">\${esc(a.command)}</div>\`:''}</div></div>\`).join('')+'</div>':'<div class="okline">No recommended actions. Continue project-local work.</div>';
const plan=manifest.planArtifacts||{};
const planHtml=plan.markdown||plan.json?\`<table><tr><th>Markdown</th><td>\${plan.markdown?'<a href="plan.md">plan.md</a>':'not written'}</td></tr><tr><th>JSON</th><td>\${plan.json?'<a href="plan.json">plan.json</a>':'not written'}</td></tr></table>\`:'<div class="okline">No plan artifacts yet. Run <code>aienvmp plan --write</code>.</div>';
const remediation=manifest.planRemediation||[];
const remediationFix=r=>r.fixVersions?.length?\`fix \${r.fixVersions.join(', ')}\`:(r.fixAvailable?'fix available':'review required');
const remediationRefs=r=>r.advisories?.length?\` - \${r.advisories.join(', ')}\`:'';
const remediationHtml=remediation.length?'<div class="timeline">'+remediation.map(r=>\`<div class="event"><time>\${esc(r.severity)}</time><div><b>\${esc(r.package)}</b> \${esc(remediationFix(r))}\${esc(remediationRefs(r))}</div></div>\`).join('')+'</div>':'<div class="okline">No remediation steps in the current plan.</div>';
const envSteps=manifest.planEnvironment||[];
const envStepsHtml=envSteps.length?'<div class="timeline">'+envSteps.map(s=>\`<div class="event"><time>\${esc(s.category)}</time><div><b>\${esc(s.code)}</b> \${esc(s.summary)}</div></div>\`).join('')+'</div>':'<div class="okline">No environment steps in the current plan.</div>';
const ciReadiness=manifest.ciReadiness||[];
const ciHasFailure=ciReadiness.some(s=>s.status==='fail');
const ciReadinessHtml=ciReadiness.length?'<table>'+ciReadiness.map(s=>\`<tr><th>\${esc(s.scope)}</th><td><code>\${esc(s.status)}</code>\${s.matchedWarningCodes?.length?\` \${esc(s.matchedWarningCodes.join(', '))}\`:''}</td></tr>\`).join('')+'</table>':'<div class="okline">Run <code>aienvmp doctor --strict security|policy|coordination|all</code> to choose CI enforcement scope.</div>';
const enforcementProfile=manifest.preflight?.enforcementProfile||{};
const strictCommands=enforcementProfile.strictCommands||[];
const enforcementHtml=\`<table><tr><th>Default</th><td><code>\${esc(enforcementProfile.defaultMode||'advisory')}</code></td></tr><tr><th>Local</th><td>\${esc(enforcementProfile.localOperation||'non-blocking')}</td></tr><tr><th>Strict</th><td>\${esc(enforcementProfile.strictUse||'CI or explicit checks only')}</td></tr><tr><th>Recommended</th><td><code>\${esc(enforcementProfile.recommendedStrictCommand||'aienvmp doctor --strict all')}</code></td></tr></table><div class="timeline">\${strictCommands.slice(0,4).map(cmd=>\`<div class="event"><time>CI</time><div><code>\${esc(cmd)}</code></div></div>\`).join('')}</div><div class="path">\${esc(enforcementProfile.reason||'Warnings stay advisory unless strict mode is requested.')}</div>\`;
const card=(title,badge,body)=>\`<section class="card"><div class="card-head"><h2>\${title}</h2>\${badge||''}</div>\${body}</section>\`;
const reviewRequired=warnings.length>0||intents.length>0;
const recentChanges=timeline.slice(-8).length;
const trustState=manifest.trust?.state||'observed';
const nextAction=reviewRequired?'Review before environment changes':'Proceed with project-local work';
const auditItem=(key,value,hint,klass='')=>\`<div class="audit-item \${klass}"><div class="audit-k">\${key}</div><div class="audit-v">\${value}</div><div class="audit-hint">\${hint}</div></div>\`;
const driftLabel=warnings.length?'detected':'none';
const handoffHtml=\`<table><tr><th>Status</th><td>\${reviewRequired?'review-required':'clear'}</td></tr><tr><th>Trust</th><td><code>\${esc(trustState)}</code></td></tr><tr><th>Node</th><td><code>\${esc(manifest.runtimes.node||'not detected')}</code></td></tr><tr><th>Python</th><td><code>\${esc(manifest.runtimes.python||manifest.runtimes.python3||'not detected')}</code></td></tr><tr><th>Docker</th><td>\${manifest.containers?.docker?'available':'not detected'}</td></tr><tr><th>Next</th><td>\${reviewRequired?'Review warnings and open intents':'Continue project-local work'}</td></tr></table>\`;
document.getElementById('app').innerHTML=\`
<header>
  <div>
    <div class="eyebrow">aienvmp dashboard</div>
    <h1>AI environment map</h1>
    <p class="sub">An AI-first environment map and change ledger for agents that share one development machine.</p>
  </div>
  <div class="stamp"><b>\${warnings.length?'review':'clear'}</b><span>\${esc(manifest.workspace.name)}</span><span>\${esc(manifest.generatedAt)}</span></div>
</header>
<section class="audit" aria-label="Audit summary">
  \${auditItem('AI decision',reviewRequired?'review required':'can proceed',nextAction,reviewRequired?'review':'primary')}
  \${auditItem('Runtime drift',driftLabel,warnings.length?'Policy, runtime, or coordination warning detected':'No drift warnings detected',warnings.length?'review':'')}
  \${auditItem('Open env changes',String(intents.length),intents.length?'Resolve or coordinate before changes':'No pending env changes')}
  \${auditItem('Trust',trustState,trustState==='verified'?'Human or CI verified':'Machine observed; not AI-verified')}
</section>
<section class="metrics">
  <div class="metric"><div class="num">\${entries(manifest.runtimes).length}</div><div class="label">runtimes</div></div>
  <div class="metric"><div class="num">\${entries(manifest.packageManagers).length}</div><div class="label">package managers</div></div>
  <div class="metric"><div class="num">\${warnings.length}</div><div class="label">warnings</div></div>
  <div class="metric"><div class="num">\${intents.length}</div><div class="label">open intents</div></div>
</section>
<section class="layout">
  <div class="grid">
    \${card('Runtimes',\`<span class="pill">\${entries(manifest.runtimes).length} found</span>\`,\`<table>\${rows(manifest.runtimes)}</table>\`)}
    \${card('Package Managers',\`<span class="pill">\${entries(manifest.packageManagers).length} found</span>\`,\`<table>\${rows(manifest.packageManagers)}</table>\`)}
    \${card('Containers',manifest.containers?.docker?'<span class="pill">available</span>':'<span class="pill off">not detected</span>',\`<table>\${rows(manifest.containers)}</table>\`)}
    \${card('Project Hints',\`<span class="pill">\${entries(manifest.projectHints).length} hints</span>\`,\`<table>\${rows(manifest.projectHints)}</table>\`)}
    \${card('Global Inventory',manifest.inventory?.enabled?'<span class="pill">deep</span>':'<span class="pill off">basic</span>',inventoryHtml)}
    \${card('Dependency Snapshot','<span class="pill">'+(depSummary.packages||0)+' packages</span>',depHtml)}
    \${card('Light SBOM','<span class="pill">'+(lightSbomSummary.packages||0)+' packages</span>',lightSbomHtml)}
    \${card('Security Summary',sec.enabled?'<span class="pill warn">security</span>':'<span class="pill off">basic</span>',securityHtml)}
  </div>
  <aside>
    \${card('Recommended Actions','<span class="pill">'+actions.length+' actions</span>',actionsHtml)}
    <div style="height:14px"></div>
    \${card('AI Plan Artifacts',plan.markdown||plan.json?'<span class="pill">written</span>':'<span class="pill off">not written</span>',planHtml)}
    <div style="height:14px"></div>
    \${card('Remediation Steps',remediation.length?'<span class="pill warn">'+remediation.length+' items</span>':'<span class="pill off">none</span>',remediationHtml)}
    <div style="height:14px"></div>
    \${card('Environment Steps',envSteps.length?'<span class="pill warn">'+envSteps.length+' items</span>':'<span class="pill off">none</span>',envStepsHtml)}
    <div style="height:14px"></div>
    \${card('Enforcement Mode','<span class="pill">advisory</span>',enforcementHtml)}
    <div style="height:14px"></div>
    \${card('CI Readiness',ciHasFailure?'<span class="pill warn">review</span>':'<span class="pill">ready</span>',ciReadinessHtml)}
    <div style="height:14px"></div>
    \${card('Environment Health',warnings.length?'<span class="pill warn">attention</span>':'<span class="pill">clear</span>',warnHtml)}
    <div style="height:14px"></div>
    \${card('Version Policy','<span class="pill">'+entries(policy).length+' rules</span>',policyHtml)}
    <div style="height:14px"></div>
    \${card('Agent Intents','<span class="pill">'+intents.length+' open</span>',intentsHtml)}
    <div style="height:14px"></div>
    \${card('AI Handoff',reviewRequired?'<span class="pill warn">review</span>':'<span class="pill">ready</span>',handoffHtml)}
    <div style="height:14px"></div>
    \${card('Agent Pointers','<span class="pill">'+entries(manifest.agentFiles).filter(([,v])=>v).length+' detected</span>','<div class="agents">'+agentCards+'</div>')}
    <div style="height:14px"></div>
    \${card('Snapshot','',\`<table><tr><th>OS</th><td>\${esc(manifest.os.platform)} \${esc(manifest.os.release)} \${esc(manifest.os.arch)}</td></tr><tr><th>Shell</th><td>\${esc(manifest.os.shell||'unknown')}</td></tr><tr><th>Workspace</th><td><div class="path">\${esc(manifest.workspace.path)}</div></td></tr></table>\`)}
  </aside>
</section>
<section style="margin-top:14px">\${card('Environment Ledger','',timelineHtml)}</section>
\`;
</script>
</main>
</body>
</html>`;
}

function pushMap(lines, title, obj = {}) {
  lines.push(`### ${title}`, "");
  const entries = Object.entries(obj);
  if (!entries.length) {
    lines.push("- None detected.", "");
    return;
  }
  for (const [key, value] of entries) lines.push(`- ${key}: ${value}`);
  lines.push("");
}

function formatChange(change) {
  if (change.type === "changed") return `${change.scope} ${change.key} changed ${change.before} -> ${change.after}`;
  return `${change.scope} ${change.key} ${change.type} ${change.after ?? change.before}`;
}

function formatTimeline(item) {
  if (item.change) return `${item.actor || "system"}: ${formatChange(item.change)}`;
  const details = [item.target, item.before && item.after ? `${item.before} -> ${item.after}` : "", item.evidence ? `evidence: ${item.evidence}` : ""]
    .filter(Boolean)
    .join("; ");
  return `${item.actor || "unknown"}: ${item.summary || item.action || item.type}${details ? ` (${details})` : ""}`;
}

function contextLines(manifest, warnings, intents) {
  return [
    `- Status: ${warnings.length ? "review-required" : "clear"}`,
    `- Next: ${warnings.length ? "review warnings before environment changes" : "continue with project-local work"}`,
    `- Node: ${manifest.runtimes.node || "not detected"}`,
    `- Python: ${manifest.runtimes.python || manifest.runtimes.python3 || "not detected"}`,
    `- Docker: ${manifest.containers.docker ? "available" : "not detected"}`,
    `- Open intents: ${intents.length}`
  ];
}

function inventoryLines(inventory = {}) {
  if (!inventory.enabled) return ["- Mode: basic", "- Deep global inventory is disabled. Run `aienvmp sync --deep` when needed."];
  const groups = Object.entries(inventory.tools || {});
  if (!groups.length) return ["- Mode: deep", "- No global tools detected by optional scanners."];
  const lines = ["- Mode: deep"];
  for (const [name, items] of groups) {
    lines.push(`- ${name}: ${items.length} tools`);
  }
  return lines;
}

function dependencyLines(snapshot = {}) {
  const summary = snapshot.summary || {};
  const packages = snapshot.packages || [];
  const ecosystems = summary.ecosystems?.length ? summary.ecosystems.join(", ") : "none";
  const lines = [
    `- Mode: ${snapshot.mode || "snapshot"}`,
    `- Manifests: ${(snapshot.manifests || []).join(", ") || "none"}`,
    `- Ecosystems: ${ecosystems}`,
    `- Packages: ${summary.packages || 0}`
  ];
  for (const pkg of packages.slice(0, 10)) {
    lines.push(`- ${pkg.ecosystem}/${pkg.name}: ${pkg.version} (${pkg.manifest})`);
  }
  return lines;
}

function lightSbomLines(lightSbom = {}) {
  const summary = lightSbom.summary || {};
  const lines = [
    `- Mode: ${lightSbom.mode || "light-sbom"}`,
    `- Packages: ${summary.packages || 0}`,
    `- Vulnerabilities: ${summary.vulnerabilities || 0}`,
    `- Direct vulnerable packages: ${summary.directVulnerablePackages || 0}`,
    `- Transitive or unmatched vulnerable packages: ${summary.transitiveOrUnmatchedVulnerablePackages || 0}`,
    `- Lockfiles: ${(summary.lockfiles || []).map((item) => item.file).join(", ") || "none"}`
  ];
  if (lightSbom.packageManagerPolicy) {
    lines.push(`- Package manager policy: ${lightSbom.packageManagerPolicy.status}`);
    lines.push(`- Package manager guidance: ${lightSbom.packageManagerPolicy.guidance}`);
  }
  const risks = lightSbom.topRisk || [];
  if (risks.length) {
    lines.push("- Top risk:");
    for (const item of risks.slice(0, 8)) {
      lines.push(`  - ${item.name}: ${item.severity}; ${item.priority}/${item.score}; ${item.directDependency ? "direct" : "transitive-or-unmatched"}${item.version ? `; ${item.version}` : ""}`);
    }
  }
  const hints = lightSbom.dependencyChangeHints || [];
  if (hints.length) {
    lines.push("- Dependency change hints:");
    for (const hint of hints.slice(0, 6)) {
      const risk = hint.riskPackages?.length ? `; risk: ${hint.riskPackages.map((pkg) => pkg.name).join(", ")}` : "";
      const lockfiles = hint.lockfiles?.length ? `; lockfiles: ${hint.lockfiles.map((item) => item.file).join(", ")}` : "";
      lines.push(`  - ${hint.manifest}: ${hint.ecosystem}/${hint.manager}; ${hint.packages} packages${risk}${lockfiles}`);
    }
  }
  return lines;
}

function securityLines(security = {}) {
  if (!security.enabled) return ["- Mode: basic", "- Security scan is disabled. Run `aienvmp sync --security` when vulnerability context is needed."];
  const summary = security.summary || {};
  const lines = [
    "- Mode: security",
    `- Total vulnerabilities: ${summary.total || 0}`,
    `- Critical: ${summary.critical || 0}`,
    `- High: ${summary.high || 0}`,
    `- Moderate: ${summary.moderate || 0}`,
    `- Low: ${summary.low || 0}`
  ];
  const packages = security.topPackages || [];
  if (packages.length) {
    lines.push("- Top vulnerable packages:");
    for (const pkg of packages.slice(0, 8)) {
      lines.push(`  - ${pkg.name}: ${pkg.severity}; ${securityPackageNote(pkg)}`);
    }
  }
  return lines;
}

function securityPackageNote(pkg) {
  const fix = pkg.fixVersions?.length ? `fix ${pkg.fixVersions.slice(0, 3).join(", ")}` : pkg.fixAvailable ? "fix available" : "review required";
  const priority = pkg.remediationPriority ? `priority ${pkg.remediationPriority.level}/${pkg.remediationPriority.score}; ` : "";
  const dependency = pkg.directDependency && pkg.dependency ? `; declared in ${pkg.dependency.manifest} ${pkg.dependency.version}` : "; not found in dependency snapshot";
  const advisories = (pkg.advisories || [])
    .map((item) => item.id || item.title)
    .filter(Boolean)
    .slice(0, 2);
  return advisories.length ? `${priority}${fix}${dependency}; advisories ${advisories.join(", ")}` : `${priority}${fix}${dependency}`;
}

function policyLines(policy) {
  const lines = [];
  if (policy.node) lines.push(`- Node version policy: ${policy.node}`);
  if (policy.python) lines.push(`- Python version policy: ${policy.python}`);
  if (policy.packageManager) lines.push(`- Package manager policy: ${policy.packageManager}`);
  lines.push(`- Global installs: ${policy.globalInstalls || "ask-first"}`);
  lines.push(`- Runtime changes: ${policy.runtimeChanges || "ask-first"}`);
  lines.push("- Docker daemon/context changes: ask first.");
  return lines;
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
