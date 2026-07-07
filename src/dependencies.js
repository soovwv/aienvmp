import fs from "node:fs/promises";
import path from "node:path";
import { exists, readJson } from "./fsutil.js";

const NODE_GROUPS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const LOCKFILE_CANDIDATES = [
  { file: "package-lock.json", ecosystem: "npm", manager: "npm" },
  { file: "npm-shrinkwrap.json", ecosystem: "npm", manager: "npm" },
  { file: "pnpm-lock.yaml", ecosystem: "npm", manager: "pnpm" },
  { file: "yarn.lock", ecosystem: "npm", manager: "yarn" },
  { file: "bun.lockb", ecosystem: "npm", manager: "bun" },
  { file: "uv.lock", ecosystem: "python", manager: "uv" },
  { file: "poetry.lock", ecosystem: "python", manager: "poetry" },
  { file: "Pipfile.lock", ecosystem: "python", manager: "pipenv" }
];

export async function scanDependencySnapshot(dir) {
  const node = await scanNodeDependencies(dir);
  const python = await scanPythonDependencies(dir);
  const packages = [...node.packages, ...python.packages];
  const manifests = [...node.manifests, ...python.manifests];
  const lockfiles = await scanDependencyLockfiles(dir);
  return {
    mode: "snapshot",
    enabled: true,
    note: "Read-only dependency snapshot from project files. It does not install, update, or resolve packages.",
    manifests,
    lockfiles,
    summary: {
      ecosystems: [...new Set(packages.map((pkg) => pkg.ecosystem))],
      manifests: manifests.length,
      lockfiles: lockfiles.length,
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

export function buildLightSbom(snapshot = {}, security = {}) {
  const packages = snapshot.packages || [];
  const vulnerable = security.topPackages || [];
  const directVulnerable = vulnerable.filter((pkg) => pkg.directDependency === true);
  const transitiveOrUnmatched = vulnerable.filter((pkg) => pkg.directDependency !== true);
  const topRisk = vulnerable.slice(0, 8).map((pkg) => ({
    name: pkg.name,
    ecosystem: scannerEcosystem(pkg.scanner),
    severity: pkg.severity || "unknown",
    directDependency: pkg.directDependency === true,
    manifest: pkg.dependency?.manifest || "",
    version: pkg.dependency?.version || pkg.version || "",
    priority: pkg.remediationPriority?.level || "low",
    score: pkg.remediationPriority?.score || 0,
    fixAvailable: pkg.fixAvailable === true || Boolean(pkg.fixVersions?.length),
    fixVersions: (pkg.fixVersions || []).slice(0, 3)
  }));
  return {
    schemaVersion: 1,
    mode: "light-sbom",
    note: "AI-ready package and vulnerability summary from read-only project files and optional scanners.",
    summary: {
      ecosystems: countBy(packages, "ecosystem"),
      managers: countBy(packages, "manager"),
      groups: countBy(packages, "group"),
      manifests: snapshot.manifests || [],
      lockfiles: snapshot.lockfiles || [],
      packages: packages.length,
      vulnerabilities: Number(security.summary?.total || 0),
      directVulnerablePackages: directVulnerable.length,
      transitiveOrUnmatchedVulnerablePackages: transitiveOrUnmatched.length
    },
    topRisk,
    dependencyChangeHints: dependencyChangeHints(packages, topRisk, snapshot.lockfiles || []),
    aiUse: {
      beforeDependencyChanges: "Read lightSbom.summary and lightSbom.topRisk before changing dependencies.",
      securityMode: security.enabled ? "scanner-summary" : "scanner-off",
      dependencySource: "project manifests only; no install or resolver is run"
    }
  };
}

function dependencyChangeHints(packages = [], topRisk = [], lockfiles = []) {
  const byManifest = new Map();
  for (const pkg of packages) {
    const key = pkg.manifest || "unknown";
    const entry = byManifest.get(key) || {
      manifest: key,
      ecosystem: pkg.ecosystem || "unknown",
      manager: pkg.manager || "unknown",
      groups: new Set(),
      packages: 0,
      riskPackages: []
    };
    entry.groups.add(pkg.group || "unknown");
    entry.packages += 1;
    byManifest.set(key, entry);
  }
  for (const risk of topRisk) {
    if (!risk.manifest || !byManifest.has(risk.manifest)) continue;
    byManifest.get(risk.manifest).riskPackages.push({
      name: risk.name,
      severity: risk.severity,
      priority: risk.priority,
      fixAvailable: risk.fixAvailable
    });
  }
  return [...byManifest.values()].map((entry) => ({
    manifest: entry.manifest,
    ecosystem: entry.ecosystem,
    manager: entry.manager,
    groups: [...entry.groups].sort(),
    packages: entry.packages,
    riskPackages: entry.riskPackages.slice(0, 5),
    lockfiles: lockfilesForEntry(entry, lockfiles),
    beforeChange: [
      `Read ${entry.manifest} and the active package manager policy before editing dependencies.`,
      lockfilesForEntry(entry, lockfiles).length
        ? `Preserve related lockfiles: ${lockfilesForEntry(entry, lockfiles).map((item) => item.file).join(", ")}.`
        : "No related lockfile was detected; do not create one with a different package manager without approval.",
      "Record an intent before dependency or lockfile changes when another AI may be working."
    ],
    afterChange: [
      "Run project tests or the narrowest relevant validation.",
      "Run aienvmp sync.",
      "Record the dependency change with aienvmp record."
    ]
  }));
}

async function scanDependencyLockfiles(dir) {
  const found = [];
  for (const item of LOCKFILE_CANDIDATES) {
    if (await exists(path.join(dir, item.file))) found.push(item);
  }
  return found;
}

function lockfilesForEntry(entry, lockfiles = []) {
  return lockfiles.filter((lockfile) => lockfile.ecosystem === entry.ecosystem);
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

function countBy(items = [], key) {
  return Object.fromEntries(Object.entries(items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {})).sort(([a], [b]) => a.localeCompare(b)));
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
