import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildCycloneDxLite, buildSbomArtifact, sbomWorkspace } from "../src/commands/sbom.js";
import { writeJson } from "../src/fsutil.js";

test("buildSbomArtifact creates standalone AI-readable light SBOM", () => {
  const sbom = buildSbomArtifact({
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { path: "/tmp/work", name: "work" },
    lightSbom: {
      mode: "light-sbom",
      summary: { packages: 1, vulnerabilities: 0 },
      riskSummary: { level: "high", score: 80, commands: ["aienvmp sync --security"], reviewTargets: ["package.json", "express"] },
      topRisk: [{ name: "express" }],
      packageManagerPolicy: { status: "review-required" },
      dependencyChangeHints: [{ manifest: "package.json" }],
      confidence: { vulnerabilities: "not-scanned" }
    }
  });

  assert.equal(sbom.schemaName, "aienvmp.light-sbom");
  assert.equal(sbom.startHere, ".aienvmp/README.md");
  assert.equal(sbom.readOrder[0], ".aienvmp/discovery.json");
  assert.equal(sbom.readOrder[1], ".aienvmp/sbom.json");
  assert.equal(sbom.readOrder[2], ".aienvmp/status.json");
  assert.equal(sbom.summary.packages, 1);
  assert.equal(sbom.riskSummary.level, "high");
  assert.equal(sbom.aiBootstrap.readFirst, ".aienvmp/sbom.json");
  assert.equal(sbom.aiBootstrap.detailCommand, "aienvmp context --json");
  assert.equal(sbom.aiBootstrap.nextSafeCommand, "aienvmp sync --security");
  assert.equal(sbom.aiBootstrap.nextSafeCommandSource, "dependency-review");
  assert.match(sbom.aiBootstrap.nextSafeCommandReason, /requires review/);
  assert.equal(sbom.aiBootstrap.environmentChanges, "review-first");
  assert.equal(sbom.nextSafeCommand, "aienvmp sync --security");
  assert.equal(sbom.scannerGuidance.mode, "optional-read-only");
  assert.equal(sbom.scannerGuidance.decision, "run-scanner-before-security-work");
  assert.match(sbom.scannerGuidance.reason, /Scanner confidence is low/);
  assert.equal(sbom.scannerGuidance.defaultCommand, "aienvmp sbom --json");
  assert.equal(sbom.scannerGuidance.scannerCommand, "aienvmp sync --security");
  assert.equal(sbom.scannerGuidance.securityConfidence, "scanner-off");
  assert.ok(sbom.scannerGuidance.useLightSbomFor.includes("AI environment coordination"));
  assert.ok(sbom.scannerGuidance.requireScannerFor.includes("security claims"));
  assert.ok(sbom.scannerGuidance.externalTools.some((tool) => tool.tool === "syft"));
  assert.ok(sbom.scannerGuidance.externalTools.some((tool) => tool.tool === "trivy"));
  assert.ok(sbom.scannerGuidance.externalTools.some((tool) => tool.tool === "dependency-track"));
  assert.match(sbom.scannerGuidance.evidenceWorkflow.join(" "), /Read \.aienvmp\/discovery\.json/);
  assert.match(sbom.scannerGuidance.evidenceWorkflow.join(" "), /\.aienvmp\/sbom\.json/);
  assert.match(sbom.scannerGuidance.evidenceWorkflow.join(" "), /dedicated scanner/);
  assert.match(sbom.scannerGuidance.evidenceWorkflow.join(" "), /Checkpoint and hand off/);
  assert.match(sbom.scannerGuidance.interoperabilityRule, /AI coordination layer/);
  assert.match(sbom.scannerGuidance.interoperabilityRule, /Do not install or run external tools automatically/);
  assert.ok(sbom.scannerGuidance.whenToRun.includes("before security claims"));
  assert.match(sbom.scannerGuidance.rule, /default SBOM lightweight/);
  assert.equal(sbom.aiReviewPlan.status, "review");
  assert.equal(sbom.aiReviewPlan.risk, "high/80");
  assert.equal(sbom.aiReviewPlan.securityConfidence, "scanner-off");
  assert.equal(sbom.aiReviewPlan.packageManagerPolicy, "review-required");
  assert.equal(sbom.aiReviewPlan.beforeChange, "aienvmp sync --security");
  assert.match(sbom.aiReviewPlan.afterChange, /checkpoint/);
  assert.equal(sbom.dependencyCoordination.mode, "advisory");
  assert.equal(sbom.dependencyCoordination.nextCommand, "aienvmp sync --security");
  assert.deepEqual(sbom.dependencyCoordination.reviewTargets, ["package.json", "express"]);
  assert.match(sbom.dependencyCoordination.beforeChange.join(" "), /dependency-review/);
  assert.match(sbom.dependencyCoordination.afterChange.join(" "), /checkpoint/);
  assert.match(sbom.dependencyCoordination.mustNotDo.join(" "), /audit fix/);
  assert.equal(sbom.dependencyCoordination.scannerEvidence, "run-scanner-before-security-work");
  assert.match(sbom.dependencyCoordination.rule, /coordinate dependency work/);
  assert.equal(sbom.dependencyQuickCheck.status, "review");
  assert.equal(sbom.dependencyQuickCheck.nextCommand, "aienvmp sync --security");
  assert.equal(sbom.dependencyQuickCheck.scannerEvidence, "run-scanner-before-security-work");
  assert.deepEqual(sbom.dependencyQuickCheck.reviewTargets, ["package.json", "express"]);
  assert.match(sbom.dependencyQuickCheck.mustNotDo.join(" "), /lockfile rewrite/);
  assert.match(sbom.dependencyQuickCheck.rule, /first AI dependency-work decision/);
  assert.equal(sbom.aiDependencyReview.status, "review");
  assert.equal(sbom.aiDependencyReview.securityConfidence, "scanner-off");
  assert.match(sbom.aiDependencyReview.statusReason, /requires dependency review/);
  assert.deepEqual(sbom.aiDependencyReview.reviewTargets, ["package.json", "express"]);
  assert.match(sbom.aiDependencyReview.safeActions[1], /without installing/);
  assert.ok(sbom.aiDependencyReview.beforeDependencyChange.includes("aienvmp plan --write"));
  assert.equal(sbom.aiDependencyReview.beforeDependencyChange.some((command) => command.includes("checkpoint")), false);
  assert.match(sbom.aiDependencyReview.afterDependencyChange[1], /checkpoint/);
  assert.equal(sbom.aiUse.nextCommand, "aienvmp sync --security");
  assert.equal(sbom.aiUse.decision, "review");
  assert.equal(sbom.aiUse.securityConfidence, "scanner-off");
  assert.deepEqual(sbom.aiUse.readFirst, [".aienvmp/discovery.json", ".aienvmp/sbom.json", ".aienvmp/status.json", ".aienvmp/summary.md", "aienvmp context --json"]);
  assert.equal(sbom.aiUse.beforeChange, sbom.nextSafeCommand);
  assert.match(sbom.aiUse.afterChange, /checkpoint/);
  assert.equal(sbom.aiUse.rule, sbom.scannerGuidance.rule);
});

test("buildCycloneDxLite exports project manifest packages with limitations", () => {
  const cdx = buildCycloneDxLite({
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { path: "/tmp/work", name: "work" },
    generatedBy: { version: "0.1.48" },
    dependencySnapshot: {
      packages: [{
        ecosystem: "npm",
        manager: "npm",
        manifest: "package.json",
        group: "dependencies",
        name: "express",
        version: "^4.18.0"
      }]
    },
    lightSbom: {
      source: { dependencies: "project manifests" },
      confidence: { transitiveDependencies: "not-resolved" },
      riskSummary: { level: "high", score: 80 },
      topRisk: [{
        ecosystem: "npm",
        name: "express",
        version: "^4.18.0",
        severity: "high",
        priority: "high",
        score: 80,
        directDependency: true,
        manifest: "package.json"
      }]
    }
  });

  assert.equal(cdx.bomFormat, "CycloneDX");
  assert.equal(cdx.specVersion, "1.6");
  assert.equal(cdx.components[0].name, "express");
  assert.match(cdx.components[0].purl, /^pkg:npm\/express@/);
  assert.equal(cdx.vulnerabilities[0].ratings[0].severity, "high");
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:startHere"), ".aienvmp/README.md");
  assert.match(propertyValue(cdx.metadata.properties, "aienvmp:readOrder"), /^\.aienvmp\/discovery\.json -> \.aienvmp\/sbom\.json/);
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:readFirst"), ".aienvmp/sbom.json");
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:detailCommand"), "aienvmp context --json");
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:nextSafeCommand"), "aienvmp intent --actor agent:id --action dependency-review --target dependency");
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:nextSafeCommandSource"), "dependency-review");
  assert.match(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:nextSafeCommandReason"), /requires review/);
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:localMode"), "advisory");
  assert.equal(propertyValue(cdx.metadata.properties, "aienvmp:aiBootstrap:environmentChanges"), "review-first");
  assert.match(propertyValue(cdx.properties, "aienvmp:aiBootstrap:rule"), /Review SBOM risk/);
  assert.equal(propertyValue(cdx.properties, "aienvmp:scannerGuidance:mode"), "optional-read-only");
  assert.equal(propertyValue(cdx.properties, "aienvmp:scannerGuidance:command"), "aienvmp sync --security");
  assert.equal(propertyValue(cdx.properties, "aienvmp:scannerGuidance:externalTools"), "syft,trivy,grype,dependency-track");
  assert.match(propertyValue(cdx.properties, "aienvmp:scannerGuidance:evidenceWorkflow"), /dedicated scanner/);
  assert.match(propertyValue(cdx.properties, "aienvmp:scannerGuidance:interoperabilityRule"), /dedicated SBOM or security scanners/);
  assert.match(propertyValue(cdx.properties, "aienvmp:scannerGuidance:rule"), /optional read-only scanners/);
  assert.equal(propertyValue(cdx.properties, "aienvmp:dependencyCoordination:nextCommand"), "aienvmp intent --actor agent:id --action dependency-review --target dependency");
  assert.match(propertyValue(cdx.properties, "aienvmp:dependencyCoordination:rule"), /record intent/);
  assert.equal(propertyValue(cdx.properties, "aienvmp:dependencyQuickCheck:status"), "review");
  assert.equal(propertyValue(cdx.properties, "aienvmp:dependencyQuickCheck:nextCommand"), "aienvmp intent --actor agent:id --action dependency-review --target dependency");
  assert.equal(propertyValue(cdx.properties, "aienvmp:dependencyQuickCheck:scannerEvidence"), "light-sbom-ok-for-coordination");
  assert.match(cdx.properties[0].value, /Light SBOM/);
});

test("sbomWorkspace can write .aienvmp/sbom.json", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sbom-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { path: dir, name: path.basename(dir) },
    lightSbom: {
      summary: { packages: 1, vulnerabilities: 0 },
      riskSummary: { level: "clear", score: 0, commands: [] }
    }
  });

  const result = await sbomWorkspace({ dir, write: true, quiet: true });
  assert.match(result.artifact, /\.aienvmp[\\\/]sbom\.json$/);

  const written = JSON.parse(await fs.readFile(result.artifact, "utf8"));
  assert.equal(written.schemaName, "aienvmp.light-sbom");
  assert.equal(written.startHere, ".aienvmp/README.md");
  assert.equal(written.readOrder[0], ".aienvmp/discovery.json");
  assert.equal(written.summary.packages, 1);
  assert.equal(written.aiBootstrap.nextSafeCommand, "aienvmp intent --actor agent:id --action dependency-review --target dependency");
  assert.equal(written.nextSafeCommand, written.aiBootstrap.nextSafeCommand);
  assert.equal(written.aiReviewPlan.status, "ready");
  assert.equal(written.aiReviewPlan.risk, "clear/0");
  assert.equal(written.aiReviewPlan.beforeChange, written.nextSafeCommand);
  assert.equal(written.scannerGuidance.mode, "optional-read-only");
  assert.equal(written.scannerGuidance.decision, "light-sbom-ok-for-coordination");
  assert.match(written.scannerGuidance.reason, /light SBOM is enough for coordination/);
  assert.ok(written.scannerGuidance.externalTools.some((tool) => tool.tool === "grype"));
  assert.match(written.scannerGuidance.evidenceWorkflow.join(" "), /Record intent/);
  assert.equal(written.dependencyCoordination.nextCommand, written.nextSafeCommand);
  assert.match(written.dependencyCoordination.rule, /checkpoint and hand off/);
  assert.equal(written.dependencyQuickCheck.status, "ready");
  assert.equal(written.dependencyQuickCheck.nextCommand, written.nextSafeCommand);
  assert.equal(written.dependencyQuickCheck.scannerEvidence, "light-sbom-ok-for-coordination");
  assert.equal(written.aiDependencyReview.status, "ready");
  assert.equal(written.aiDependencyReview.securityConfidence, "scanner-summary");
  assert.ok(written.aiDependencyReview.readFirst.includes("riskSummary"));
  assert.equal(written.aiUse.decision, "ready");
  assert.equal(written.aiUse.securityConfidence, "scanner-summary");
  assert.equal(written.aiUse.beforeChange, written.nextSafeCommand);
});

test("sbomWorkspace can write CycloneDX-lite artifact", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sbom-cdx-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { path: dir, name: path.basename(dir) },
    dependencySnapshot: {
      packages: [{ ecosystem: "npm", manager: "npm", manifest: "package.json", group: "dependencies", name: "express", version: "^4.18.0" }]
    },
    lightSbom: {
      riskSummary: { level: "low", score: 5 }
    }
  });

  const result = await sbomWorkspace({ dir, write: true, quiet: true, format: "cyclonedx-lite" });
  assert.match(result.artifact, /\.aienvmp[\\\/]sbom\.cdx\.json$/);

  const written = JSON.parse(await fs.readFile(result.artifact, "utf8"));
  assert.equal(written.bomFormat, "CycloneDX");
  assert.equal(written.components[0].name, "express");
  assert.equal(propertyValue(written.metadata.properties, "aienvmp:aiBootstrap:nextSafeCommand"), "aienvmp intent --actor agent:id --action dependency-review --target dependency");
});

function propertyValue(properties = [], name) {
  return properties.find((item) => item.name === name)?.value;
}
