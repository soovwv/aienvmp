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
  const dependencyReview = lightSbom.aiDependencyReview || aiDependencyReview(lightSbom);
  const nextSafeCommand = dependencyReview.beforeDependencyChange?.[0]
    || lightSbom.riskSummary?.commands?.[0]
    || "aienvmp context --json";
  const aiBootstrap = sbomBootstrap(nextSafeCommand, dependencyReview);
  const scannerGuidance = sbomScannerGuidance(dependencyReview);
  const aiReviewPlan = sbomReviewPlan(lightSbom, dependencyReview, nextSafeCommand);
  return {
    schemaVersion: 1,
    schemaName: "aienvmp.light-sbom",
    generatedAt: manifest.generatedAt || "",
    workspace: manifest.workspace || {},
    startHere: ".aienvmp/README.md",
    readOrder: [".aienvmp/README.md", ".aienvmp/sbom.json", ".aienvmp/status.json", ".aienvmp/summary.md", "aienvmp context --json"],
    mode: lightSbom.mode || "light-sbom",
    source: lightSbom.source || {},
    confidence: lightSbom.confidence || {},
    limitations: lightSbom.limitations || [],
    summary: lightSbom.summary || { packages: 0, vulnerabilities: 0 },
    riskSummary: lightSbom.riskSummary || { level: "clear", score: 0, signals: [], commands: [] },
    topRisk: (lightSbom.topRisk || []).slice(0, 20),
    packageManagerPolicy: lightSbom.packageManagerPolicy || {},
    dependencyChangeHints: (lightSbom.dependencyChangeHints || []).slice(0, 20),
    aiBootstrap,
    nextSafeCommand,
    scannerGuidance,
    aiReviewPlan,
    aiDependencyReview: dependencyReview,
    aiUse: {
      purpose: "Standalone AI-readable light SBOM artifact.",
      readBefore: "Dependency changes, vulnerability remediation, release review, or shared AI handoff.",
      decision: dependencyReview.status || "ready",
      securityConfidence: dependencyReview.securityConfidence || "unknown",
      readFirst: [".aienvmp/README.md", ".aienvmp/sbom.json", ".aienvmp/status.json", "aienvmp context --json"],
      nextCommand: nextSafeCommand,
      beforeChange: nextSafeCommand,
      afterChange: dependencyReview.afterDependencyChange?.slice(-1)[0] || "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency",
      rule: scannerGuidance.rule
    }
  };
}

function sbomScannerGuidance(review = {}) {
  const confidence = review.securityConfidence || "unknown";
  const lowConfidence = ["scanner-off", "unknown", "not-scanned"].includes(confidence);
  return {
    mode: "optional-read-only",
    decision: lowConfidence ? "run-scanner-before-security-work" : "light-sbom-ok-for-coordination",
    reason: lowConfidence
      ? "Scanner confidence is low, so security claims, remediation, releases, and risky dependency changes need read-only scanner evidence."
      : "Scanner summary is present; the light SBOM is enough for coordination unless findings changed or a human asks for fresh evidence.",
    defaultCommand: "aienvmp sbom --json",
    scannerCommand: "aienvmp sync --security",
    securityConfidence: confidence,
    useLightSbomFor: ["AI environment coordination", "dependency read set", "package manager policy", "intent and handoff planning"],
    requireScannerFor: ["security claims", "vulnerability remediation", "release decisions", "dependency changes when scanner confidence is low"],
    externalTools: externalSbomTools(),
    interoperabilityRule: "Use aienvmp as the AI coordination layer and use dedicated SBOM or security scanners for full evidence. Do not install or run external tools automatically unless the user, CI, or release process asks.",
    whenToRun: lowConfidence
      ? [
        "before security claims",
        "before vulnerability remediation",
        "before release decisions",
        "before dependency changes when scanner confidence is low"
      ]
      : [
        "when security findings changed",
        "before release decisions",
        "when a human or CI asks for fresh scanner evidence"
      ],
    rule: "Keep the default SBOM lightweight for AI coordination; use optional read-only scanners only when security confidence matters."
  };
}

function externalSbomTools() {
  return [
    {
      tool: "syft",
      category: "full-sbom",
      command: "syft dir:. -o cyclonedx-json",
      useWhen: "full SBOM generation is required",
      aienvmpRole: "keep AI coordination fields, intent, handoff, and local env context beside the full SBOM"
    },
    {
      tool: "trivy",
      category: "vulnerability-scan",
      command: "trivy fs --format cyclonedx .",
      useWhen: "security scan evidence is needed before release or remediation",
      aienvmpRole: "use scanner evidence to raise security confidence before security claims"
    },
    {
      tool: "grype",
      category: "vulnerability-match",
      command: "grype dir:.",
      useWhen: "CVE matching is needed against the filesystem or a generated SBOM",
      aienvmpRole: "record the dependency intent and checkpoint the environment decision around remediation"
    },
    {
      tool: "dependency-track",
      category: "continuous-sbom-risk",
      command: "upload CycloneDX SBOM to Dependency-Track",
      useWhen: "continuous component analysis or governance is required",
      aienvmpRole: "keep local AI workspace coordination separate from long-running governance"
    }
  ];
}

function sbomBootstrap(nextSafeCommand, review = {}) {
  const reviewCommand = review.beforeDependencyChange?.[0];
  return {
    purpose: "Shortest AI entry point for dependency and SBOM review.",
    readFirst: ".aienvmp/sbom.json",
    detailCommand: "aienvmp context --json",
    nextSafeCommand,
    nextSafeCommandSource: reviewCommand && nextSafeCommand === reviewCommand ? "dependency-review" : "sbom-risk",
    nextSafeCommandReason: review.status === "review"
      ? "SBOM risk or package manager policy requires review before dependency changes."
      : "No blocking SBOM signal is present; record intent before dependency or lockfile changes.",
    localMode: "advisory",
    projectLocalWork: "allowed",
    environmentChanges: review.status === "review" ? "review-first" : "intent-first",
    rule: review.rule || "Read SBOM risk first; record intent before dependency or lockfile changes."
  };
}

function sbomReviewPlan(lightSbom = {}, review = {}, nextSafeCommand = "aienvmp context --json") {
  const risk = lightSbom.riskSummary || {};
  const policy = lightSbom.packageManagerPolicy || {};
  const summary = lightSbom.summary || {};
  return {
    status: review.status || "ready",
    risk: `${risk.level || "clear"}/${risk.score || 0}`,
    securityConfidence: review.securityConfidence || "unknown",
    packageManagerPolicy: policy.status || "not-detected",
    packages: Number(summary.packages || 0),
    vulnerabilities: Number(summary.vulnerabilities || 0),
    reviewTargets: (review.reviewTargets || risk.reviewTargets || []).slice(0, 8),
    beforeChange: nextSafeCommand,
    afterChange: review.afterDependencyChange?.slice(-1)[0] || "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency",
    rule: review.status === "review"
      ? "Review SBOM risk and package manager policy before dependency changes."
      : "Record dependency intent before dependency or lockfile changes; security claims still need scanner verification."
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
  const scannerOff = risk.scanner === "off" || lightSbom.source?.vulnerabilities === "not scanned" || lightSbom.confidence?.vulnerabilities === "not-scanned";
  return {
    status: review ? "review" : "ready",
    statusReason: review
      ? "SBOM risk or package manager policy requires dependency review before changes."
      : scannerOff
        ? "No scanned vulnerability finding is present because the security scanner is off; run read-only security scan before security decisions."
        : "No light SBOM signal requires dependency review.",
    securityConfidence: scannerOff ? "scanner-off" : "scanner-summary",
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
  const dependencyReview = lightSbom.aiDependencyReview || aiDependencyReview(lightSbom);
  const nextSafeCommand = dependencyReview.beforeDependencyChange?.[0]
    || lightSbom.riskSummary?.commands?.[0]
    || "aienvmp context --json";
  const aiBootstrap = sbomBootstrap(nextSafeCommand, dependencyReview);
  const scannerGuidance = sbomScannerGuidance(dependencyReview);
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
        { name: "aienvmp:risk:score", value: String(lightSbom.riskSummary?.score || 0) },
        { name: "aienvmp:startHere", value: ".aienvmp/README.md" },
        { name: "aienvmp:readOrder", value: ".aienvmp/README.md -> .aienvmp/sbom.json -> .aienvmp/status.json -> .aienvmp/summary.md -> aienvmp context --json" },
        { name: "aienvmp:aiBootstrap:readFirst", value: aiBootstrap.readFirst },
        { name: "aienvmp:aiBootstrap:detailCommand", value: aiBootstrap.detailCommand },
        { name: "aienvmp:aiBootstrap:nextSafeCommand", value: aiBootstrap.nextSafeCommand },
        { name: "aienvmp:aiBootstrap:nextSafeCommandSource", value: aiBootstrap.nextSafeCommandSource },
        { name: "aienvmp:aiBootstrap:nextSafeCommandReason", value: aiBootstrap.nextSafeCommandReason },
        { name: "aienvmp:aiBootstrap:localMode", value: aiBootstrap.localMode },
        { name: "aienvmp:aiBootstrap:environmentChanges", value: aiBootstrap.environmentChanges }
      ]
    },
    components: packages.slice(0, 200).map(cycloneComponent),
    vulnerabilities: (lightSbom.topRisk || []).slice(0, 50).map(cycloneVulnerability),
    properties: [
      { name: "aienvmp:limitation", value: "Light SBOM from project manifests only; no install or dependency resolver was run." },
      { name: "aienvmp:verifyWith", value: "CycloneDX, Syft, Trivy, npm audit, pip-audit, or another dedicated scanner before security claims." },
      { name: "aienvmp:scannerGuidance:mode", value: scannerGuidance.mode },
      { name: "aienvmp:scannerGuidance:command", value: scannerGuidance.scannerCommand },
      { name: "aienvmp:scannerGuidance:externalTools", value: scannerGuidance.externalTools.map((tool) => tool.tool).join(",") },
      { name: "aienvmp:scannerGuidance:interoperabilityRule", value: scannerGuidance.interoperabilityRule },
      { name: "aienvmp:scannerGuidance:rule", value: scannerGuidance.rule },
      { name: "aienvmp:aiBootstrap:rule", value: aiBootstrap.rule }
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
