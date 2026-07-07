import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildSbomArtifact, sbomWorkspace } from "../src/commands/sbom.js";
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
