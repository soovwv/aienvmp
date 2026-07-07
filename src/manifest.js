import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { commandOutput, commandVersion } from "./shell.js";
import { exists } from "./fsutil.js";

export async function buildManifest(dir) {
  const now = new Date().toISOString();
  const manifest = {
    schemaVersion: 1,
    generatedAt: now,
    workspace: {
      path: dir,
      name: path.basename(dir)
    },
    os: await scanOS(),
    runtimes: await scanRuntimes(),
    packageManagers: await scanPackageManagers(),
    containers: await scanContainers(),
    projectHints: await scanProjectHints(dir),
    agentFiles: await scanAgentFiles(dir),
    agentProtocol: {
      sourceOfTruth: "AIENV.md",
      preflightCommand: "aienvmp context",
      intentCommand: "aienvmp intent --actor <agent:id> --action <planned-change>",
      recordCommand: "aienvmp record --actor <agent:id> --summary <what-changed>",
      afterEnvironmentChange: ["aienvmp scan", "aienvmp compile"],
      globalRuntimeChangeRequiresUserApproval: true,
      globalInstallPolicy: "ask-first",
      projectLocalChanges: "allowed-when-task-requires"
    }
  };
  return manifest;
}

async function scanOS() {
  return {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    shell: process.env.SHELL || process.env.ComSpec || ""
  };
}

async function scanRuntimes() {
  return compact({
    node: await commandVersion("node"),
    python: await commandVersion("python"),
    python3: await commandVersion("python3"),
    go: await commandVersion("go", ["version"]),
    java: await commandVersion("java", ["-version"]),
    rustc: await commandVersion("rustc", ["--version"])
  });
}

async function scanPackageManagers() {
  return compact({
    npm: await commandVersion(process.platform === "win32" ? "npm.cmd" : "npm"),
    pnpm: await commandVersion(process.platform === "win32" ? "pnpm.cmd" : "pnpm"),
    yarn: await commandVersion(process.platform === "win32" ? "yarn.cmd" : "yarn"),
    uv: await commandVersion("uv"),
    pip: await commandVersion("pip"),
    pipx: await commandVersion("pipx"),
    mise: await commandVersion("mise"),
    asdf: await commandVersion("asdf"),
    pyenv: await commandVersion("pyenv"),
    nvm: await commandVersion("nvm"),
    fnm: await commandVersion("fnm"),
    volta: await commandVersion("volta")
  });
}

async function scanContainers() {
  return compact({
    docker: await commandVersion("docker", ["--version"]),
    compose: await dockerComposeVersion()
  });
}

async function dockerComposeVersion() {
  const v2 = await commandOutput("docker", ["compose", "version"]);
  if (v2) return v2.replace(/^Docker Compose version\s+/i, "");
  return await commandVersion(process.platform === "win32" ? "docker-compose.exe" : "docker-compose");
}

async function scanProjectHints(dir) {
  const hints = {};
  for (const [key, file] of [
    ["nvmrc", ".nvmrc"],
    ["pythonVersion", ".python-version"],
    ["mise", "mise.toml"],
    ["toolVersions", ".tool-versions"],
    ["packageJson", "package.json"],
    ["pyproject", "pyproject.toml"],
    ["requirements", "requirements.txt"],
    ["dockerfile", "Dockerfile"],
    ["packageLock", "package-lock.json"],
    ["pnpmLock", "pnpm-lock.yaml"],
    ["yarnLock", "yarn.lock"]
  ]) {
    const full = path.join(dir, file);
    if (!(await exists(full))) continue;
    if (["nvmrc", "pythonVersion"].includes(key)) {
      hints[key] = (await fs.readFile(full, "utf8")).trim();
    } else {
      hints[key] = true;
    }
  }
  return hints;
}

async function scanAgentFiles(dir) {
  const files = {
    agents: "AGENTS.md",
    claude: "CLAUDE.md",
    gemini: "GEMINI.md",
    cursor: path.join(".cursor", "rules", "environment.md"),
    copilot: path.join(".github", "copilot-instructions.md")
  };
  const out = {};
  for (const [name, rel] of Object.entries(files)) {
    out[name] = await exists(path.join(dir, rel));
  }
  return out;
}

function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value));
}
