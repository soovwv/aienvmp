import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "../fsutil.js";
import { aiEnvPath, dashboardPath, discoveryJsonPath, manifestPath, sbomJsonPath, stateDir, stateReadmePath, statusJsonPath, summaryMdPath, workspaceDir } from "../paths.js";

const pointerFiles = [
  ["codex", "AGENTS.md"],
  ["claude", "CLAUDE.md"],
  ["gemini", "GEMINI.md"],
  ["cursor", path.join(".cursor", "rules", "environment.md")],
  ["copilot", path.join(".github", "copilot-instructions.md")]
];

const defaultReadOrder = [".aienvmp/discovery.json", ".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "AIENV.md", "aienvmp context --json"];
const sessionStart = [
  "Read .aienvmp/discovery.json when instruction-file pickup is uncertain.",
  "Read .aienvmp/README.md when it exists.",
  "Read .aienvmp/status.json before environment-affecting work.",
  "Run npx aienvmp sync only when artifacts are missing or stale.",
  "Continue project-local code work unless status/context requires environment review.",
  "Record intent before changing runtimes, dependencies, package managers, Docker, or global tools."
];

export async function discoverWorkspace(args = {}) {
  const dir = workspaceDir(args);
  const status = await readJson(statusJsonPath(dir), null);
  const artifacts = await discoverArtifacts(dir);
  const pointers = await discoverPointers(dir);
  const detected = artifacts.stateDir.exists || artifacts.discovery.exists || artifacts.aiEnv.exists || Boolean(status);
  const freshness = status?.artifactFreshness?.state || "unknown";
  const stale = ["stale", "unknown"].includes(freshness);
  const agentPointers = {
    discovery: status?.agentPointers?.discovery || pointerDiscovery(pointers),
    installed: pointers.filter((item) => item.hasPointer).map((item) => item.agent),
    detected: pointers.filter((item) => item.exists).map((item) => item.agent)
  };
  const readOrder = defaultReadOrder;
  const result = {
    status: detected ? "detected" : "not-detected",
    detected,
    purpose: "Find the AI-readable environment map before shared environment changes.",
    localMode: "read-only",
    startHere: artifacts.discovery.exists ? ".aienvmp/discovery.json" : artifacts.startHere.exists ? ".aienvmp/README.md" : artifacts.aiEnv.exists ? "AIENV.md" : ".aienvmp/README.md",
    readOrder,
    freshness,
    nextCommand: detected && !stale ? "npx aienvmp status" : "npx aienvmp sync",
    agentPointers,
    aiDiscovery: aiDiscoverySummary({ detected, stale, agentPointers, readOrder }),
    artifacts,
    rule: "If detected, read startHere and status before changing runtimes, dependencies, package managers, Docker, or global tools. This command does not write files."
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!args.quiet) {
    console.log(`aienvmp detected: ${result.detected ? "yes" : "no"}`);
    console.log(`start here: ${result.startHere}`);
    console.log(`status: ${artifacts.status.exists ? ".aienvmp/status.json" : "missing"}`);
    console.log(`freshness: ${result.freshness}`);
    console.log(`agent pointers: ${result.agentPointers.discovery}`);
    console.log(`next: ${result.nextCommand}`);
    console.log(`AI fallback: ${result.aiDiscovery.fallbackPrompt}`);
  }

  return result;
}

async function discoverArtifacts(dir) {
  return {
    stateDir: await artifact(dir, ".aienvmp", stateDir(dir)),
    discovery: await artifact(dir, ".aienvmp/discovery.json", discoveryJsonPath(dir)),
    startHere: await artifact(dir, ".aienvmp/README.md", stateReadmePath(dir)),
    status: await artifact(dir, ".aienvmp/status.json", statusJsonPath(dir)),
    summary: await artifact(dir, ".aienvmp/summary.md", summaryMdPath(dir)),
    aiEnv: await artifact(dir, "AIENV.md", aiEnvPath(dir)),
    manifest: await artifact(dir, ".aienvmp/manifest.json", manifestPath(dir)),
    sbom: await artifact(dir, ".aienvmp/sbom.json", sbomJsonPath(dir)),
    dashboard: await artifact(dir, ".aienvmp/dashboard.html", dashboardPath(dir))
  };
}

async function discoverPointers(dir) {
  const out = [];
  for (const [agent, file] of pointerFiles) {
    const full = path.join(dir, file);
    const text = await readText(full);
    out.push({
      agent,
      file: toSlash(file),
      exists: text !== null,
      hasPointer: text?.includes("aienvmp") === true
    });
  }
  return out;
}

async function artifact(dir, name, fullPath) {
  return {
    path: name,
    exists: await exists(fullPath),
    absolutePath: path.resolve(fullPath),
    relativePath: toSlash(path.relative(dir, fullPath))
  };
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readText(file) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

function pointerDiscovery(pointers = []) {
  const installed = pointers.filter((item) => item.hasPointer).map((item) => item.agent);
  return installed.length ? `ready: ${installed.join(", ")}` : "missing: run aienvmp onboard";
}

function aiDiscoverySummary({ detected = false, stale = true, agentPointers = {}, readOrder = [] } = {}) {
  const installed = agentPointers.installed || [];
  const safeStart = detected && !stale ? "npx aienvmp status" : "npx aienvmp sync";
  const fallbackRead = readOrder.slice(0, 5);
  const decision = installed.length ? "auto-ready" : "fallback-required";
  const nextSetupCommand = installed.length ? "none" : "npx aienvmp onboard";
  const startupChecklist = [
    "run npx aienvmp start --json when automatic discovery is uncertain",
    "read .aienvmp/discovery.json, .aienvmp/status.json, and .aienvmp/summary.md",
    "check dependencyQuickCheck before dependency, lockfile, security, or release work",
    "record intent before shared environment changes, then checkpoint and hand off after accepted changes"
  ];
  return {
    mode: "best-effort",
    decision,
    automatic: installed.length > 0,
    pointerStatus: installed.length ? `ready: ${installed.join(", ")}` : "missing",
    limitation: "AI hosts only auto-read their supported instruction files; otherwise use the fallback read path.",
    installCommand: "npx aienvmp onboard",
    nextSetupCommand,
    safeStart,
    sessionStart,
    startupChecklist,
    fallbackRead,
    resume: {
      purpose: "Minimum AI startup routine when instruction-file automatic discovery is uncertain.",
      readFirst: fallbackRead.length ? fallbackRead : [".aienvmp/discovery.json", ".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "aienvmp context --json"],
      nextCommand: safeStart,
      allowed: "project-local code work can continue when status/context do not require environment review",
      beforeEnvironmentChange: "aienvmp intent --actor agent:id --action planned-change --target environment",
      afterEnvironmentChange: "aienvmp checkpoint --actor agent:id --summary what-changed --target environment",
      handoff: "aienvmp handoff --record --actor agent:id",
      mustNotDo: [
        "do not assume automatic pickup worked; verify discovery or read fallback artifacts first",
        "do not change runtimes, dependencies, package managers, Docker, or global tools before intent/review",
        "do not run sync repeatedly when status artifacts are fresh"
      ],
      rule: "When an AI host did not auto-load a pointer file, use this resume routine as the shared environment startup contract."
    },
    fallbackPrompt: detected
      ? "Use aienvmp as the workspace env map. Read .aienvmp/discovery.json, then .aienvmp/status.json, then run npx aienvmp context --json before environment changes."
      : "Run npx aienvmp sync to create the AI env map, then read .aienvmp/discovery.json and .aienvmp/status.json.",
    humanInstruction: "Paste the fallbackPrompt into an AI session when the host did not auto-read an instruction-file pointer.",
    rule: "Do not assume automatic pickup. Verify discovery with aienvmp discover or status before shared environment changes."
  };
}

function toSlash(value = "") {
  return String(value).replaceAll("\\", "/");
}
