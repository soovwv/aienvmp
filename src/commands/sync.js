import fs from "node:fs/promises";
import { initWorkspace } from "./init.js";
import { scanWorkspace } from "./scan.js";
import { compileWorkspace } from "./compile.js";
import { dashWorkspace } from "./dash.js";
import { statusWorkspace } from "./status.js";
import { sbomWorkspace } from "./sbom.js";
import { summaryWorkspace } from "./summary.js";
import { discoveryJsonPath, stateReadmePath } from "../paths.js";

export async function syncWorkspace(args) {
  const quiet = args.quiet || args.json;
  const next = { ...args, quiet };

  const initialized = await initWorkspace(next);
  const scanned = await scanWorkspace(next);
  const compiled = await compileWorkspace(next);
  const dashboard = await dashWorkspace(next);
  const status = await statusWorkspace({ ...next, json: false, write: true, quiet: true });
  const sbom = await sbomWorkspace({ ...next, json: false, write: true, quiet: true });
  const cyclonedx = await sbomWorkspace({ ...next, json: false, write: true, quiet: true, format: "cyclonedx-lite" });
  const summary = await summaryWorkspace({ ...next, json: false, write: true, quiet: true });
  const discovery = await writeDiscoveryArtifact(next.dir || ".", status);
  const stateReadme = await writeStateReadme(next.dir || ".", status);

  const result = {
    status: "ok",
    outputs: {
      aiEnv: compiled.aiEnv,
      manifest: scanned.manifest,
      timeline: scanned.timeline,
      status: status.artifact,
      sbom: sbom.artifact,
      cyclonedx: cyclonedx.artifact,
      summary: summary.artifact,
      discovery,
      startHere: stateReadme,
      dashboard: dashboard.dashboard
    },
    changes: scanned.changes,
    initialized: initialized.stateDir
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!quiet) {
    console.log("sync complete: AIENV.md, start-here README, discovery, manifest, status, SBOM, summary, ledger, intents, and dashboard are up to date");
  }

  return result;
}

async function writeDiscoveryArtifact(dir, status = {}) {
  const out = discoveryJsonPath(dir);
  const discoveryDecision = status.agentPointers?.discoveryDecision || "fallback-required";
  const pointerStatus = status.agentPointers?.discovery || "missing: run aienvmp onboard";
  const nextSetupCommand = discoveryDecision === "auto-ready" ? "none" : "npx aienvmp onboard";
  const readOrder = [
    ".aienvmp/discovery.json",
    ".aienvmp/README.md",
    ".aienvmp/status.json",
    ".aienvmp/summary.md",
    "AIENV.md",
    "aienvmp context --json"
  ];
  const artifact = {
    schemaVersion: 1,
    schemaName: "aienvmp.ai-discovery",
    generatedAt: new Date().toISOString(),
    purpose: "Smallest AI-readable entry point for this workspace environment map.",
    decision: discoveryDecision,
    automatic: discoveryDecision === "auto-ready",
    pointerStatus,
    limitation: "AI hosts only auto-read their supported instruction files; otherwise start from this file.",
    startCommand: "npx aienvmp start --json",
    statusCommand: "npx aienvmp status --json",
    contextCommand: "npx aienvmp context --json",
    nextCommand: status.nextCommand || "aienvmp status --json",
    nextSetupCommand,
    readOrder,
    startupChecklist: status.agentPointers?.startupChecklist || [
      "run npx aienvmp start --json when automatic discovery is uncertain",
      "read .aienvmp/status.json before environment-affecting work",
      "record intent before shared environment changes",
      "checkpoint and hand off after accepted environment changes"
    ],
    resume: {
      readFirst: readOrder,
      nextCommand: status.nextCommand || "aienvmp status --json",
      beforeEnvironmentChange: status.aiSession?.beforeEnvironmentChange || "aienvmp intent --actor agent:id --action planned-change --target environment",
      afterEnvironmentChange: status.aiSession?.afterEnvironmentChange || "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
      handoff: status.aiSession?.handoff || "aienvmp handoff --record --actor agent:id",
      rule: "Use this routine when an AI host did not auto-load an instruction-file pointer."
    },
    fallbackPrompt: "Use aienvmp as the workspace env map. Read .aienvmp/discovery.json, then .aienvmp/status.json, then run npx aienvmp context --json before environment changes.",
    humanInstruction: "Paste fallbackPrompt into an AI session when automatic instruction-file discovery did not happen.",
    rule: "Do not assume automatic pickup worked. Read discovery/status first, keep local operation advisory, and record intent before shared environment changes."
  };
  await fs.writeFile(out, JSON.stringify(artifact, null, 2), "utf8");
  return out;
}

async function writeStateReadme(dir, status = {}) {
  const out = stateReadmePath(dir);
  const session = Array.isArray(status.aiSession?.start) && status.aiSession.start.length
    ? status.aiSession.start.join(" -> ")
    : "aienvmp status --json -> aienvmp context --json";
  const readFirst = status.aiBootstrap?.readFirst || ".aienvmp/status.json";
  const readOrder = Array.isArray(status.aiSession?.readFirst) && status.aiSession.readFirst.length
    ? status.aiSession.readFirst
    : [".aienvmp/README.md", readFirst, ".aienvmp/summary.md"];
  const next = status.nextSafeCommand || status.nextCommand || "aienvmp status --json";
  const freshness = status.artifactFreshness?.status || "unknown";
  const discovery = status.agentPointers?.discovery || "missing: run aienvmp onboard";
  const discoveryDecision = discovery.startsWith("ready:") ? "auto-ready" : "fallback-required";
  const nextSetup = discoveryDecision === "auto-ready" ? "none" : "npx aienvmp onboard";
  const followUp = status.followUpPlan?.status || "clear";
  const sbom = status.sbomRisk?.level || "unknown";
  const lines = [
    "# aienvmp start here",
    "",
    "This workspace uses `aienvmp`.",
    "Multiple AI agents should use this AI-first env map and light SBOM before changing shared development environment state.",
    "Generated by `aienvmp sync`. Read this before environment-affecting work.",
    "",
    "- shortest AI entry: `.aienvmp/discovery.json`",
    `- read order: \`${readOrder.join(" -> ")}\``,
    `- AI session: \`${session}\``,
    `- next: \`${next}\``,
    `- freshness: ${freshness}`,
    `- discovery: ${discovery}`,
    `- discovery decision: ${discoveryDecision}`,
    `- next setup: \`${nextSetup}\``,
    "- discovery mode: best-effort; use `aienvmp discover --json` when automatic pickup is uncertain",
    "- startup checklist: `start --json` -> read `status.json` -> record `intent` before env changes -> `checkpoint` and `handoff` after changes",
    "- AI fallback prompt: Use aienvmp as the workspace env map. Read `.aienvmp/discovery.json`, then `.aienvmp/status.json`, then run `aienvmp context --json` before environment changes.",
    `- follow-up: ${followUp}`,
    `- light SBOM risk: ${sbom}`,
    "",
    "For humans: open `dashboard.html`.",
    "For AI agents: start here, then use `status.json`, `summary.md`, and `aienvmp context --json`.",
    "Default mode is advisory. Use strict checks only in CI or when a human asks.",
    ""
  ];
  await fs.writeFile(out, lines.join("\n"), "utf8");
  return out;
}
