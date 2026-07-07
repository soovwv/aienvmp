import fs from "node:fs/promises";
import path from "node:path";
import { exists, readJson } from "./fsutil.js";

const NODE_GROUPS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

export async function scanDependencySnapshot(dir) {
  const node = await scanNodeDependencies(dir);
  const python = await scanPythonDependencies(dir);
  const packages = [...node.packages, ...python.packages];
  const manifests = [...node.manifests, ...python.manifests];
  return {
    mode: "snapshot",
    enabled: true,
    note: "Read-only dependency snapshot from project files. It does not install, update, or resolve packages.",
    manifests,
    summary: {
      ecosystems: [...new Set(packages.map((pkg) => pkg.ecosystem))],
      manifests: manifests.length,
      packages: packages.length
    },
    packages: packages.slice(0, 80)
  };
}

export function linkVulnerableDependencies(security = {}, snapshot = {}) {
  const dependencyIndex = new Map((snapshot.packages || []).map((pkg) => [dependencyKey(pkg.ecosystem, pkg.name), pkg]));
  return {
    ...security,
    topPackages: (security.topPackages || []).map((pkg) => {
      const dependency = dependencyIndex.get(dependencyKey(scannerEcosystem(pkg.scanner), pkg.name));
      const directDependency = Boolean(dependency);
      return {
        ...pkg,
        directDependency,
        dependency: dependency ? {
          ecosystem: dependency.ecosystem,
          manifest: dependency.manifest,
          group: dependency.group,
          version: dependency.version
        } : null,
        remediationPriority: remediationPriority(pkg, { directDependency })
      };
    })
  };
}

export function remediationPriority(pkg = {}, context = {}) {
  const severityScore = { critical: 90, high: 70, moderate: 45, low: 20, info: 5, unknown: 30 };
  const severity = String(pkg.severity || "unknown").toLowerCase();
  const reasons = [`severity:${severity}`];
  let score = severityScore[severity] ?? severityScore.unknown;
  if (context.directDependency) {
    score += 15;
    reasons.push("direct-dependency");
  } else {
    reasons.push("not-direct-in-snapshot");
  }
  if (pkg.fixAvailable === true || (Array.isArray(pkg.fixVersions) && pkg.fixVersions.length)) {
    score += 5;
    reasons.push("fix-available");
  } else {
    reasons.push("fix-review-needed");
  }
  const level = score >= 95 ? "urgent" : score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  return { level, score, reasons };
}

async function scanNodeDependencies(dir) {
  const file = path.join(dir, "package.json");
  if (!(await exists(file))) return { manifests: [], packages: [] };
  const json = await readJson(file, {});
  const packages = [];
  for (const group of NODE_GROUPS) {
    for (const [name, version] of Object.entries(json[group] || {})) {
      packages.push({
        ecosystem: "npm",
        manager: "npm",
        manifest: "package.json",
        group,
        name,
        version: String(version)
      });
    }
  }
  return { manifests: ["package.json"], packages };
}

async function scanPythonDependencies(dir) {
  const requirements = await scanRequirementsTxt(dir);
  const pyproject = await scanPyproject(dir);
  return {
    manifests: [...requirements.manifests, ...pyproject.manifests],
    packages: [...requirements.packages, ...pyproject.packages]
  };
}

async function scanRequirementsTxt(dir) {
  const file = path.join(dir, "requirements.txt");
  if (!(await exists(file))) return { manifests: [], packages: [] };
  const raw = await fs.readFile(file, "utf8");
  const packages = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
    .slice(0, 80)
    .map((line) => {
      const parsed = parseRequirementLine(line);
      return {
        ecosystem: "python",
        manager: "pip",
        manifest: "requirements.txt",
        group: "requirements",
        name: parsed.name,
        version: parsed.version
      };
    });
  return { manifests: ["requirements.txt"], packages };
}

async function scanPyproject(dir) {
  const file = path.join(dir, "pyproject.toml");
  if (!(await exists(file))) return { manifests: [], packages: [] };
  const raw = await fs.readFile(file, "utf8");
  const packages = parsePyprojectDependencies(raw).slice(0, 80).map((line) => {
    const parsed = parseRequirementLine(line);
    return {
      ecosystem: "python",
      manager: "pyproject",
      manifest: "pyproject.toml",
      group: "project.dependencies",
      name: parsed.name,
      version: parsed.version
    };
  });
  return { manifests: ["pyproject.toml"], packages };
}

export function parseRequirementLine(line) {
  const cleaned = String(line).split("#")[0].trim();
  const match = cleaned.match(/^([A-Za-z0-9_.-]+)\s*(.*)$/);
  return {
    name: match?.[1] || cleaned,
    version: (match?.[2] || "unspecified").trim() || "unspecified"
  };
}

function scannerEcosystem(scanner = "") {
  if (String(scanner).includes("pip")) return "python";
  return "npm";
}

function dependencyKey(ecosystem = "", name = "") {
  return `${String(ecosystem).toLowerCase()}:${String(name).toLowerCase()}`;
}

export function parsePyprojectDependencies(raw) {
  const lines = [];
  const match = String(raw).match(/dependencies\s*=\s*\[([\s\S]*?)\]/m);
  if (!match) return lines;
  for (const item of match[1].split(/\r?\n/)) {
    const cleaned = item.trim().replace(/,$/, "").replace(/^["']|["']$/g, "");
    if (cleaned && !cleaned.startsWith("#")) lines.push(cleaned);
  }
  return lines;
}
