const markerBegin = "<!-- aienvmp:begin -->";
const markerEnd = "<!-- aienvmp:end -->";

export { markerBegin, markerEnd };

export function renderAIEnv(manifest, timeline = [], warnings = [], intents = []) {
  const lines = [];
  lines.push("# AI Environment Protocol", "");
  lines.push("This workspace uses `aienvmp` as the shared environment source of truth for humans and AI agents.", "");
  lines.push("## Read Me First", "");
  lines.push("Before changing runtimes, package managers, Docker settings, or global packages:");
  lines.push("1. Run `aienvmp context`.");
  lines.push("2. Prefer project-local version files such as `.nvmrc`, `.python-version`, `mise.toml`, and `.tool-versions`.");
  lines.push("3. Ask the user before changing global environment state.");
  lines.push("4. Record planned environment changes with `aienvmp intent --actor <agent:id> --action <planned-change>`.");
  lines.push("5. After environment changes, run `aienvmp scan && aienvmp compile`.");
  lines.push("6. Record what changed with `aienvmp record --actor <agent:id> --summary <what-changed>`.", "");
  lines.push("## Current Policy", "");
  lines.push("- Global Python installs: ask first; prefer `.venv`, `uv venv`, or project-local environments.");
  lines.push("- Global npm/pnpm/yarn installs: ask first.");
  lines.push("- Runtime version changes: ask first unless explicitly requested.");
  lines.push("- Docker daemon/context changes: ask first.");
  lines.push("- Project-local dependency installs: allowed when required by the user task.", "");
  lines.push("## AI Preflight Summary", "");
  lines.push(...contextLines(manifest, warnings, intents), "");
  lines.push("## Runtime Map", "");
  pushMap(lines, "Runtimes", manifest.runtimes);
  pushMap(lines, "Package Managers", manifest.packageManagers);
  pushMap(lines, "Containers", manifest.containers);
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

export function renderAgentBlock(manifest) {
  const node = manifest.runtimes.node || "not detected";
  const python = manifest.runtimes.python || manifest.runtimes.python3 || "not detected";
  const docker = manifest.containers.docker ? "available" : "not detected";
  return `AI environment map is maintained by aienvmp.

Before changing runtimes, package managers, Docker, or global packages:
1. Read AIENV.md.
2. Run \`aienvmp context\`.
3. Ask the user before global environment changes.
4. Record planned changes with \`aienvmp intent\`.
5. After changes, run \`aienvmp scan && aienvmp compile\`.
6. Record what changed with \`aienvmp record\`.

Default detected tools:
- Node.js: ${node}
- Python: ${python}
- Docker: ${docker}`;
}

export function renderContext(manifest, timeline = [], warnings = [], intents = []) {
  return [
    "# AI Preflight Context",
    "",
    `Status: ${warnings.length ? "review-required" : "clear"}`,
    `Workspace: ${manifest.workspace.path}`,
    `Node: ${manifest.runtimes.node || "not detected"}`,
    `Python: ${manifest.runtimes.python || manifest.runtimes.python3 || "not detected"}`,
    `Docker: ${manifest.containers.docker ? "available" : "not detected"}`,
    "",
    "Must follow:",
    "- Ask the user before global runtime, package manager, Docker, or global package changes.",
    "- Prefer project-local version files and local environments.",
    "- Before planned env changes, run `aienvmp intent --actor <agent:id> --action <planned-change>`.",
    "- After env changes, run `aienvmp scan && aienvmp compile`.",
    "- Then run `aienvmp record --actor <agent:id> --summary <what-changed>`.",
    "",
    "Warnings:",
    ...(warnings.length ? warnings.map((w) => `- ${w.message}`) : ["- none"]),
    "",
    "Open intents:",
    ...(intents.length ? intents.slice(-5).reverse().map((i) => `- ${i.actor}: ${i.action}`) : ["- none"]),
    "",
    "Recent ledger:",
    ...(timeline.length ? timeline.slice(-5).reverse().map((t) => `- ${formatTimeline(t)}`) : ["- none"]),
    ""
  ].join("\n");
}

export function renderDashboard(manifest, timeline = [], warnings = [], intents = []) {
  const data = JSON.stringify({ manifest, timeline, warnings, intents });
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
@media (max-width:520px){.shell{padding:14px}.metrics{grid-template-columns:1fr}.event{grid-template-columns:1fr}h1{font-size:32px}}
</style>
</head>
<body>
<main class="shell" id="app"></main>
<script type="application/json" id="data">${escapeHtml(data)}</script>
<script>
const {manifest,timeline,warnings,intents}=JSON.parse(document.getElementById('data').textContent);
function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
const entries=o=>Object.entries(o||{});
const rows=o=>entries(o).map(([k,v])=>\`<tr><th>\${esc(k)}</th><td><code>\${esc(String(v))}</code></td></tr>\`).join('')||'<tr><td colspan="2">None detected</td></tr>';
const change=c=>c.type==='changed'?\`\${c.scope} \${c.key}: \${c.before} -> \${c.after}\`:\`\${c.scope} \${c.key}: \${c.type} \${c.after||c.before}\`;
const timelineLabel=t=>t.change?change(t.change):(t.summary||t.action||t.type||'recorded change');
const totalTools=entries(manifest.runtimes).length+entries(manifest.packageManagers).length+entries(manifest.containers).length;
const agentNames={agents:'Codex',claude:'Claude',gemini:'Gemini'};
const agentCards=Object.entries(agentNames).map(([key,label])=>\`<div class="agent"><strong>\${label}</strong><span>\${manifest.agentFiles?.[key]?'connected':'not connected'}</span></div>\`).join('');
const warnHtml=warnings.length?'<div class="warnings">'+warnings.map(w=>\`<div class="warning">\${esc(w.message)}</div>\`).join('')+'</div>':'<div class="okline">No blocking environment warnings detected.</div>';
const timelineHtml=timeline.length?'<div class="timeline">'+timeline.slice(-8).reverse().map(t=>\`<div class="event"><time>\${esc(t.at.replace('T',' ').slice(0,16))}</time><div><b>\${esc(t.actor||'system')}</b> \${esc(timelineLabel(t))}</div></div>\`).join('')+'</div>':'<div class="okline">No previous environment changes recorded.</div>';
const intentsHtml=intents.length?'<div class="timeline">'+intents.slice(-6).reverse().map(i=>\`<div class="event"><time>\${esc(i.at.replace('T',' ').slice(0,16))}</time><div><b>\${esc(i.actor)}</b> plans \${esc(i.action)}</div></div>\`).join('')+'</div>':'<div class="okline">No pending agent intents recorded.</div>';
const card=(title,badge,body)=>\`<section class="card"><div class="card-head"><h2>\${title}</h2>\${badge||''}</div>\${body}</section>\`;
document.getElementById('app').innerHTML=\`
<header>
  <div>
    <div class="eyebrow">aienvmp dashboard</div>
    <h1>AI environment map</h1>
    <p class="sub">An AI-first environment map and change ledger for agents that share one development machine.</p>
  </div>
  <div class="stamp"><b>\${warnings.length?'review':'clear'}</b><span>\${esc(manifest.workspace.name)}</span><span>\${esc(manifest.generatedAt)}</span></div>
</header>
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
  </div>
  <aside>
    \${card('Environment Health',warnings.length?'<span class="pill warn">attention</span>':'<span class="pill">clear</span>',warnHtml)}
    <div style="height:14px"></div>
    \${card('Agent Intents','<span class="pill">'+intents.length+' open</span>',intentsHtml)}
    <div style="height:14px"></div>
    \${card('Agent Integration','<span class="pill">'+totalTools+' tools</span>','<div class="agents">'+agentCards+'</div>')}
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
    `- Node: ${manifest.runtimes.node || "not detected"}`,
    `- Python: ${manifest.runtimes.python || manifest.runtimes.python3 || "not detected"}`,
    `- Docker: ${manifest.containers.docker ? "available" : "not detected"}`,
    `- Open intents: ${intents.length}`
  ];
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
