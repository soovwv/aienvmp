import { readJson, writeJson } from "../fsutil.js";
import { manifestPath, sbomJsonPath, workspaceDir } from "../paths.js";

export async function sbomWorkspace(args = {}) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const sbom = buildSbomArtifact(manifest);
  const artifact = args.write ? await writeSbomArtifact(dir, sbom) : "";
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
    aiUse: {
      purpose: "Standalone AI-readable light SBOM artifact.",
      readBefore: "Dependency changes, vulnerability remediation, release review, or shared AI handoff.",
      nextCommand: lightSbom.riskSummary?.commands?.[0] || "aienvmp context --json",
      rule: "Use as a lightweight planning map; verify security claims with dedicated scanners."
    }
  };
}

export async function writeSbomArtifact(dir, sbom) {
  const out = sbomJsonPath(dir);
  await writeJson(out, sbom);
  return out;
}
