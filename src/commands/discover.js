import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "../fsutil.js";
import { aiEnvPath, dashboardPath, manifestPath, sbomJsonPath, stateDir, stateReadmePath, statusJsonPath, summaryMdPath, workspaceDir } from "../paths.js";

const pointerFiles = [
  ["codex", "AGENTS.md"],
  ["claude", "CLAUDE.md"],
  ["gemini", "GEMINI.md"],
  ["cursor", path.join(".cursor", "rules", "environment.md")],
  ["copilot", path.join(".github", "copilot-instructions.md")]
];

export async function discoverWorkspace(args = {}) {
  const dir = workspaceDir(args);
  const status = await readJson(statusJsonPath(dir), null);
  const artifacts = await discoverArtifacts(dir);
  const pointers = await discoverPointers(dir);
  const detected = artifacts.stateDir.exists || artifacts.aiEnv.exists || Boolean(status);
  const freshness = status?.artifactFreshness?.state || "unknown";
  const stale = ["stale", "unknown"].includes(freshness);
  const result = {
    status: detected ? "detected" : "not-detected",
    detected,
    purpose: "Find the AI-readable environment map before shared environment changes.",
    localMode: "read-only",
    startHere: artifacts.startHere.exists ? ".aienvmp/README.md" : artifacts.aiEnv.exists ? "AIENV.md" : ".aienvmp/README.md",
    readOrder: [".aienvmp/README.md", ".aienvmp/status.json", ".aienvmp/summary.md", "AIENV.md", "aienvmp context --json"],
    freshness,
    nextCommand: detected && !stale ? "npx aienvmp status" : "npx aienvmp sync",
    agentPointers: {
      discovery: status?.agentPointers?.discovery || pointerDiscovery(pointers),
      installed: pointers.filter((item) => item.hasPointer).map((item) => item.agent),
      detected: pointers.filter((item) => item.exists).map((item) => item.agent)
    },
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
  }

  return result;
}

async function discoverArtifacts(dir) {
  return {
    stateDir: await artifact(dir, ".aienvmp", stateDir(dir)),
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

function toSlash(value = "") {
  return String(value).replaceAll("\\", "/");
}
