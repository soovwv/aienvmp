import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { syncWorkspace } from "../src/commands/sync.js";

test("sync creates the AI-facing env map outputs with simple defaults", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sync-"));
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ dependencies: { express: "^4.18.0" } }), "utf8");
  await fs.writeFile(path.join(dir, "package-lock.json"), "{}", "utf8");

  await syncWorkspace({ dir });

  const manifest = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "manifest.json"), "utf8"));
  assert.equal(manifest.schemaName, "aienvmp.runtime-sbom");
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.trust.state, "observed");
  assert.equal(manifest.trust.verified, false);
  assert.equal(manifest.inventory.mode, "basic");
  assert.equal(manifest.inventory.enabled, false);
  assert.equal(manifest.security.mode, "basic");
  assert.equal(manifest.security.enabled, false);
  assert.equal(manifest.dependencySnapshot.mode, "snapshot");
  assert.equal(manifest.dependencySnapshot.summary.packages, 1);
  assert.equal(manifest.dependencySnapshot.summary.lockfiles, 1);
  assert.equal(manifest.dependencySnapshot.packages[0].name, "express");
  assert.equal(manifest.dependencySnapshot.lockfiles[0].file, "package-lock.json");
  assert.equal(manifest.lightSbom.mode, "light-sbom");
  assert.equal(manifest.lightSbom.source.dependencies, "project manifests");
  assert.equal(manifest.lightSbom.source.resolver, "not run");
  assert.equal(manifest.lightSbom.confidence.transitiveDependencies, "not-resolved");
  assert.equal(manifest.lightSbom.summary.packages, 1);
  assert.equal(manifest.lightSbom.summary.lockfiles[0].file, "package-lock.json");
  assert.equal(manifest.lightSbom.packageManagerPolicy.status, "clear");
  assert.equal(manifest.lightSbom.summary.vulnerabilities, 0);
  assert.equal(manifest.lightSbom.dependencyChangeHints[0].manifest, "package.json");
  assert.equal(manifest.lightSbom.dependencyChangeHints[0].lockfiles[0].file, "package-lock.json");
  assert.equal(manifest.generatedBy.name, "aienvmp");
  assert.equal(manifest.generatedBy.command, "aienvmp sync");
  assert.deepEqual(manifest.agentProtocol.afterEnvironmentChange, ["aienvmp sync"]);
  assert.equal(manifest.agentProtocol.handoffCommand, "aienvmp handoff");
  assert.equal(manifest.agentProtocol.intentCommand, "aienvmp intent --actor agent:id --action planned-change");

  await assert.doesNotReject(fs.access(path.join(dir, "AIENV.md")));
  const aiEnv = await fs.readFile(path.join(dir, "AIENV.md"), "utf8");
  assert.match(aiEnv, /10-Second AI Flow/);
  assert.match(aiEnv, /Recommended Intent Targets/);
  assert.match(aiEnv, /Dependency Read Set/);
  assert.match(aiEnv, /Dependency Change Protocol/);
  assert.match(aiEnv, /Source: project manifests/);
  assert.match(aiEnv, /transitive not-resolved/);
  assert.match(aiEnv, /planned-change --target dependency/);
  const status = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "status.json"), "utf8"));
  assert.equal(status.schemaVersion, 1);
  assert.ok(["clear", "review-required"].includes(status.state));
  assert.equal(status.agentUse.purpose, "First AI-readable environment preflight for this workspace.");
  assert.equal(status.artifacts.dashboard, ".aienvmp/dashboard.html");
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "dashboard.html")));
  await assert.rejects(fs.access(path.join(dir, "AGENTS.md")));
});

test("sync can return a quiet machine-readable result", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sync-json-"));
  const result = await syncWorkspace({ dir, quiet: true });

  assert.equal(result.status, "ok");
  assert.equal(result.changes, 0);
  assert.match(result.outputs.aiEnv, /AIENV\.md$/);
  assert.match(result.outputs.status, /\.aienvmp[\\\/]status\.json$/);
});
