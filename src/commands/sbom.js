import { readJson, writeJson } from "../fsutil.js";
import { cyclonedxSbomPath, manifestPath, sbomJsonPath, workspaceDir } from "../paths.js";

export async function sbomWorkspace(args = {}) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const format = normalizeFormat(args.format);
  const sbom = format === "cyclonedx-lite" ? buildCycloneDxLite(manifest) : buildSbomArtifact(manifest);
  const artifact = args.write ? await writeSbomArtifact(dir, sbom, format) : "";
  const output = artifact ? { ...sbom, artifact } : sbom;
  if (args.json || args.write || args.quiet) {
    if (args.json) console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`sbom: ${sbom.riskSummary.level}/${sbom.riskSummary.score}`);
    console.log(`packages: ${sbom.summary.packages || 0}`);
    console.log(`vulnerabilities: ${sbom.summary.vulnerabilities || 0}`);
    console.log(`next: ${sbom.riskSummary.next}`);
  }
  return output;
}

export function buildSbomArtifact(manifest = {}) {
  const lightSbom = manifest.lightSbom || {};
  return {
    schemaVersion: 1,
    schemaName: "aienvmp.light-sbom",
    generatedAt: manifest.generatedAt || "",
    workspace: manifest.workspace || {},
    mode: lightSbom.mode || "light-sbom",
    source: lightSbom.source || {},
    confidence: lightSbom.confidence || {},
    limitations: lightSbom.limitations || [],
    summary: lightSbom.summary || { packages: 0, vulnerabilities: 0 },
    riskSummary: lightSbom.riskSummary || { level: "clear", score: 0, signals: [], commands: [] },
    topRisk: (lightSbom.topRisk || []).slice(0, 20),
    packageManagerPolicy: lightSbom.packageManagerPolicy || {},
    dependencyChangeHints: (lightSbom.dependencyChangeHints || []).slice(0, 20),
    aiDependencyReview: lightSbom.aiDependencyReview || aiDependencyReview(lightSbom),
    aiUse: {
      purpose: "Standalone AI-readable light SBOM artifact.",
      readBefore: "Dependency changes, vulnerability remediation, release review, or shared AI handoff.",
      nextCommand: lightSbom.riskSummary?.commands?.[0] || "aienvmp context --json",
      rule: "Use as a lightweight planning map; verify security claims with dedicated scanners."
    }
  };
}

function aiDependencyReview(lightSbom = {}) {
  const risk = lightSbom.riskSummary || {};
  const hints = lightSbom.dependencyChangeHints || [];
  const policy = lightSbom.packageManagerPolicy || {};
  const level = risk.level || "clear";
  const reviewTargets = (risk.reviewTargets || []).length
    ? risk.reviewTargets
    : hints.map((item) => item.manifest).filter(Boolean);
  const review = ["urgent", "high", "medium"].includes(level) || policy.status === "review-required";
  return {
    status: review ? "review" : "ready",
    mode: "advisory",
    readFirst: ["riskSummary", "dependencyChangeHints", "packageManagerPolicy", "topRisk"],
    reviewTargets: [...new Set(reviewTargets)].slice(0, 8),
    safeActions: [
      "read SBOM, status, summary, context, and dependency manifests before dependency changes",
      "plan remediation without installing, upgrading, downgrading, or switching package managers",
      "record intent before dependency or lockfile changes when another AI may be working"
    ],
    beforeDependencyChange: uniqueCommands([
      ...planningCommands(risk.commands || []),
      "aienvmp intent --actor agent:id --action dependency-review --target dependency",
      "aienvmp plan --write"
    ]),
    afterDependencyChange: [
      "run the narrowest relevant project validation",
      "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"
    ],
    rule: review
      ? "Review SBOM risk and package manager policy before dependency changes; default behavior is advisory and non-blocking."
      : "No light SBOM signal requires action; still record intent before dependency or lockfile changes."
  };
}

export async function writeSbomArtifact(dir, sbom) {
  const out = sbom.bomFormat === "CycloneDX" ? cyclonedxSbomPath(dir) : sbomJsonPath(dir);
  await writeJson(out, sbom);
  return out;
}

export function buildCycloneDxLite(manifest = {}) {
  const snapshot = manifest.dependencySnapshot || {};
  const packages = snapshot.packages || [];
  const lightSbom = manifest.lightSbom || {};
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:uuid:aienvmp-${hashText(`${manifest.workspace?.path || ""}:${manifest.generatedAt || ""}`)}`,
    version: 1,
    metadata: {
      timestamp: manifest.generatedAt || "",
      tools: {
        components: [{
          type: "application",
          name: "aienvmp",
          version: manifest.generatedBy?.version || "unknown"
        }]
      },
      component: {
        type: "application",
        name: manifest.workspace?.name || "workspace",
        bomRef: "workspace"
      },
      properties: [
        { name: "aienvmp:format", value: "cyclonedx-lite" },
        { name: "aienvmp:source", value: lightSbom.source?.dependencies || "project manifests" },
        { name: "aienvmp:confidence:transitiveDependencies", value: lightSbom.confidence?.transitiveDependencies || "not-resolved" },
        { name: "aienvmp:risk:level", value: lightSbom.riskSummary?.level || "clear" },
        { name: "aienvmp:risk:score", value: String(lightSbom.riskSummary?.score || 0) }
      ]
    },
    components: packages.slice(0, 200).map(cycloneComponent),
    vulnerabilities: (lightSbom.topRisk || []).slice(0, 50).map(cycloneVulnerability),
    properties: [
      { name: "aienvmp:limitation", value: "Light SBOM from project manifests only; no install or dependency resolver was run." },
      { name: "aienvmp:verifyWith", value: "CycloneDX, Syft, Trivy, npm audit, pip-audit, or another dedicated scanner before security claims." }
    ]
  };
}

function cycloneComponent(pkg = {}) {
  const version = String(pkg.version || "unspecified");
  return {
    type: "library",
    name: pkg.name || "unknown",
    version,
    purl: packageUrl(pkg, version),
    bomRef: `${pkg.ecosystem || "pkg"}:${pkg.name || "unknown"}@${version}`,
    properties: [
      { name: "aienvmp:ecosystem", value: pkg.ecosystem || "unknown" },
      { name: "aienvmp:manager", value: pkg.manager || "unknown" },
      { name: "aienvmp:manifest", value: pkg.manifest || "" },
      { name: "aienvmp:group", value: pkg.group || "" }
    ]
  };
}

function cycloneVulnerability(pkg = {}) {
  return {
    id: pkg.name || "unknown",
    source: { name: "aienvmp-light-sbom" },
    ratings: [{ severity: pkg.severity || "unknown" }],
    affects: [{
      ref: `${pkg.ecosystem || "pkg"}:${pkg.name || "unknown"}@${pkg.version || "unspecified"}`
    }],
    properties: [
      { name: "aienvmp:priority", value: pkg.priority || "low" },
      { name: "aienvmp:score", value: String(pkg.score || 0) },
      { name: "aienvmp:directDependency", value: String(pkg.directDependency === true) },
      { name: "aienvmp:manifest", value: pkg.manifest || "" }
    ]
  };
}

function packageUrl(pkg = {}, version = "") {
  const type = pkg.ecosystem === "python" ? "pypi" : "npm";
  return `pkg:${type}/${encodeURIComponent(pkg.name || "unknown")}@${encodeURIComponent(version)}`;
}

function normalizeFormat(format = "") {
  const value = String(format || "aienvmp").toLowerCase();
  if (["cyclonedx", "cyclonedx-lite", "cdx"].includes(value)) return "cyclonedx-lite";
  return "aienvmp";
}

function uniqueCommands(commands = []) {
  return [...new Set(commands.filter(Boolean))];
}

function planningCommands(commands = []) {
  return commands.filter((command) => !String(command).includes(" checkpoint "));
}

function hashText(text = "") {
  let hash = 0;
  for (const ch of String(text)) hash = ((hash << 5) - hash + ch.charCodeAt(0)) >>> 0;
  return `${hash.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
}
