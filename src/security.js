import { exists } from "./fsutil.js";
import { commandResult } from "./shell.js";
import path from "node:path";

const SEVERITIES = ["critical", "high", "moderate", "low", "info"];

export async function scanSecurity(dir, options = {}) {
  if (!options.security) {
    return {
      mode: "basic",
      enabled: false,
      note: "Run `aienvmp sync --security` to collect read-only vulnerability summaries."
    };
  }

  const npmAudit = await scanNpmAudit(dir);
  return {
    mode: "security",
    enabled: true,
    note: "Read-only vulnerability summary. Use for review and CI policy, not automatic fixes.",
    scanners: {
      npmAudit
    },
    summary: summarizeScanners({ npmAudit }),
    topPackages: topVulnerablePackages({ npmAudit })
  };
}

export async function scanNpmAudit(dir) {
  const hasPackageJson = await exists(path.join(dir, "package.json"));
  if (!hasPackageJson) return unavailable("npm-audit", "package.json not found");

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = await commandResult(command, ["audit", "--json"], {
    cwd: dir,
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024
  });
  const parsed = parseNpmAudit(result.stdout);
  if (!parsed.available) {
    return unavailable("npm-audit", result.stderr || "npm audit did not return parseable JSON");
  }
  return {
    scanner: "npm-audit",
    available: true,
    ok: result.ok,
    exitCode: result.code,
    summary: parsed.summary,
    vulnerablePackages: parsed.vulnerablePackages
  };
}

export function parseNpmAudit(raw) {
  try {
    const parsed = JSON.parse(raw || "{}");
    const metadata = parsed.metadata || {};
    const vulnerabilities = parsed.vulnerabilities || {};
    const severityCounts = Object.fromEntries(SEVERITIES.map((severity) => [severity, Number(metadata.vulnerabilities?.[severity] || 0)]));
    const total = Number(metadata.vulnerabilities?.total || Object.values(severityCounts).reduce((sum, value) => sum + value, 0));
    const vulnerablePackages = Object.entries(vulnerabilities).slice(0, 20).map(([name, value]) => ({
      name,
      severity: value.severity || "unknown",
      viaCount: Array.isArray(value.via) ? value.via.length : 0,
      fixAvailable: Boolean(value.fixAvailable)
    }));
    return {
      available: true,
      summary: { total, ...severityCounts },
      vulnerablePackages
    };
  } catch {
    return { available: false };
  }
}

export function summarizeScanners(scanners = {}) {
  const summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
  for (const scanner of Object.values(scanners)) {
    if (!scanner?.available) continue;
    for (const key of Object.keys(summary)) summary[key] += Number(scanner.summary?.[key] || 0);
  }
  return summary;
}

export function topVulnerablePackages(scanners = {}, limit = 8) {
  const rank = { critical: 0, high: 1, moderate: 2, low: 3, info: 4, unknown: 5 };
  return Object.values(scanners)
    .filter((scanner) => scanner?.available)
    .flatMap((scanner) => (scanner.vulnerablePackages || []).map((pkg) => ({ ...pkg, scanner: scanner.scanner })))
    .sort((a, b) => (rank[a.severity] ?? rank.unknown) - (rank[b.severity] ?? rank.unknown) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function unavailable(scanner, reason) {
  return {
    scanner,
    available: false,
    reason
  };
}
