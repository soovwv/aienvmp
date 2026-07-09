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
  assert.equal(manifest.agentProtocol.checkpointCommand, "aienvmp checkpoint --actor agent:id --summary what-changed --target environment");
  assert.deepEqual(manifest.agentProtocol.afterEnvironmentChange, ["aienvmp checkpoint --actor agent:id --summary what-changed --target environment"]);
  assert.equal(manifest.agentProtocol.handoffCommand, "aienvmp handoff");
  assert.equal(manifest.agentProtocol.intentCommand, "aienvmp intent --actor agent:id --action planned-change");
  assert.equal(manifest.agentFiles.agents.exists, false);
  assert.equal(manifest.agentFiles.agents.hasAienvmpPointer, false);
  assert.equal(manifest.agentFiles.agents.installCommand, "aienvmp snippet codex --write");
  assert.equal(manifest.agentFiles.cursor.installCommand, "aienvmp snippet cursor --write");
  assert.equal(manifest.agentFiles.copilot.installCommand, "aienvmp snippet copilot --write");

  await assert.doesNotReject(fs.access(path.join(dir, "AIENV.md")));
  const aiEnv = await fs.readFile(path.join(dir, "AIENV.md"), "utf8");
  assert.match(aiEnv, /10-Second AI Flow/);
  assert.match(aiEnv, /This workspace uses `aienvmp`/);
  assert.match(aiEnv, /Multiple AI agents should use this AI-first env map and light SBOM/);
  assert.match(aiEnv, /aienvmp discover/);
  assert.match(aiEnv, /automatic discovery as best-effort/);
  assert.match(aiEnv, /fallback read order/);
  assert.match(aiEnv, /Fallback prompt for AI sessions/);
  assert.match(aiEnv, /Use aienvmp as the workspace env map/);
  assert.match(aiEnv, /AI session: `aienvmp status --json -> aienvmp context --json`/);
  assert.match(aiEnv, /If stale: `aienvmp sync`/);
  assert.match(aiEnv, /AI bootstrap:/);
  assert.match(aiEnv, /Next safe command:/);
  assert.match(aiEnv, /Read first: `\.aienvmp\/status\.json`/);
  assert.match(aiEnv, /Bootstrap: allowed \/ intent-first \/ advisory/);
  assert.match(aiEnv, /Follow-up plan: clear \/ `aienvmp status --json`/);
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
  assert.equal(status.artifacts.discovery, ".aienvmp/discovery.json");
  assert.equal(status.artifacts.startHere, ".aienvmp/README.md");
  assert.equal(status.artifacts.summary, ".aienvmp/summary.md");
  assert.equal(status.artifacts.sbom, ".aienvmp/sbom.json");
  assert.equal(status.artifacts.cyclonedx, ".aienvmp/sbom.cdx.json");
  const startHere = await fs.readFile(path.join(dir, ".aienvmp", "README.md"), "utf8");
  assert.match(startHere, /# aienvmp start here/);
  assert.match(startHere, /This workspace uses `aienvmp`/);
  assert.match(startHere, /AI-first env map and light SBOM/);
  assert.match(startHere, /shortest AI entry: `\.aienvmp\/discovery\.json`/);
  assert.match(startHere, /read order: `\.aienvmp\/discovery\.json -> \.aienvmp\/README\.md -> \.aienvmp\/status\.json/);
  assert.match(startHere, /AI session: `aienvmp status --json -> aienvmp context --json`/);
  assert.match(startHere, /discovery mode: best-effort/);
  assert.match(startHere, /discovery decision: fallback-required/);
  assert.match(startHere, /next setup: `npx aienvmp onboard`/);
  assert.match(startHere, /startup checklist: `start --json` -> read `status\.json` -> record `intent`/);
  assert.match(startHere, /aienvmp discover --json/);
  assert.match(startHere, /AI fallback prompt/);
  assert.match(startHere, /Use aienvmp as the workspace env map/);
  assert.match(startHere, /\.aienvmp\/discovery\.json/);
  assert.match(startHere, /For AI agents: start here, then use `status\.json`, `summary\.md`, and `aienvmp context --json`/);
  const discovery = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "discovery.json"), "utf8"));
  assert.equal(discovery.schemaName, "aienvmp.ai-discovery");
  assert.equal(discovery.decision, "fallback-required");
  assert.equal(discovery.automatic, false);
  assert.equal(discovery.readOrder[0], ".aienvmp/discovery.json");
  assert.equal(discovery.nextSetupCommand, "npx aienvmp onboard");
  assert.equal(discovery.maintenance.status, "clear");
  assert.equal(discovery.maintenance.nextCommand, "aienvmp intent --actor agent:id --action planned-change --target environment");
  assert.equal(discovery.maintenance.followUp, "clear");
  assert.equal(discovery.maintenance.dependencyQuickCheck, "ready");
  assert.match(discovery.maintenance.rule, /recurring AI environment maintenance decision/);
  assert.match(discovery.startupChecklist.join(" "), /dependencyQuickCheck/);
  assert.equal(discovery.aiEntry.decision, discovery.decision);
  assert.equal(discovery.aiEntry.nextSetupCommand, discovery.nextSetupCommand);
  assert.equal(discovery.aiEntry.copyPastePrompt, discovery.copyPastePrompt);
  assert.match(discovery.fallbackPrompt, /\.aienvmp\/discovery\.json/);
  assert.equal(discovery.copyPastePrompt, discovery.fallbackPrompt);
  assert.ok(discovery.promptUse.pasteInto.includes("Claude"));
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "summary.md")));
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "sbom.json")));
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "sbom.cdx.json")));
  const sbom = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "sbom.json"), "utf8"));
  assert.equal(sbom.schemaName, "aienvmp.light-sbom");
  await assert.doesNotReject(fs.access(path.join(dir, ".aienvmp", "dashboard.html")));
  await assert.rejects(fs.access(path.join(dir, "AGENTS.md")));
});

test("sync detects installed aienvmp agent pointers", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sync-pointer-"));
  await fs.writeFile(path.join(dir, "AGENTS.md"), [
    "<!-- aienvmp:begin -->",
    "## aienvmp Environment Map",
    "<!-- aienvmp:end -->"
  ].join("\n"), "utf8");

  await syncWorkspace({ dir, quiet: true });

  const manifest = JSON.parse(await fs.readFile(path.join(dir, ".aienvmp", "manifest.json"), "utf8"));
  assert.equal(manifest.agentFiles.agents.exists, true);
  assert.equal(manifest.agentFiles.agents.hasAienvmpPointer, true);
  assert.equal(manifest.agentFiles.agents.role, "codex");
});

test("sync can return a quiet machine-readable result", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-sync-json-"));
  const result = await syncWorkspace({ dir, quiet: true });

  assert.equal(result.status, "ok");
  assert.equal(result.changes, 0);
  assert.match(result.outputs.aiEnv, /AIENV\.md$/);
  assert.match(result.outputs.status, /\.aienvmp[\\\/]status\.json$/);
  assert.match(result.outputs.discovery, /\.aienvmp[\\\/]discovery\.json$/);
  assert.match(result.outputs.startHere, /\.aienvmp[\\\/]README\.md$/);
  assert.match(result.outputs.summary, /\.aienvmp[\\\/]summary\.md$/);
  assert.match(result.outputs.sbom, /\.aienvmp[\\\/]sbom\.json$/);
  assert.match(result.outputs.cyclonedx, /\.aienvmp[\\\/]sbom\.cdx\.json$/);
});
