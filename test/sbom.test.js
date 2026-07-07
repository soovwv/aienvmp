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
      riskSummary: { level: "low", score: 5, commands: ["aienvmp sync --security"] },
      topRisk: [{ name: "express" }],
      packageManagerPolicy: { status: "clear" },
      dependencyChangeHints: [{ manifest: "package.json" }]
    }
  });

  assert.equal(sbom.schemaName, "aienvmp.light-sbom");
  assert.equal(sbom.summary.packages, 1);
  assert.equal(sbom.riskSummary.level, "low");
  assert.equal(sbom.aiUse.nextCommand, "aienvmp sync --security");
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
  assert.equal(written.summary.packages, 1);
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
});
