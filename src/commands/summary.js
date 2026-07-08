import fs from "node:fs/promises";
import path from "node:path";
import { readJson } from "../fsutil.js";
import { manifestPath, statusJsonPath, summaryMdPath, workspaceDir } from "../paths.js";
import { statusWorkspace } from "./status.js";

export async function summaryWorkspace(args) {
  const dir = workspaceDir(args);
  let status = await readJson(statusJsonPath(dir));
  if (!status) {
    status = await statusWorkspace({ ...args, dir, json: false, write: true, quiet: true });
  }
  const manifest = await readJson(manifestPath(dir), {});
  const markdown = renderSummary(status, manifest);
  const artifact = args.write ? await writeSummaryArtifact(dir, markdown) : "";
  const output = { artifact, summary: markdown, state: status.state || "unknown", sbomRisk: status.sbomRisk || {}, nextCommand: status.nextCommand || "" };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else if (!args.quiet) {
    console.log(markdown.trimEnd());
    if (artifact) console.log(`\nsummary: ${artifact}`);
  }

  return output;
}

export async function writeSummaryArtifact(dir, markdown) {
  const out = summaryMdPath(dir);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, `${markdown.trimEnd()}\n`, "utf8");
  return out;
}

export function renderSummary(status = {}, manifest = {}) {
  const counts = status.counts || {};
  const sbomRisk = status.sbomRisk || manifest.lightSbom?.riskSummary || {};
  const coordination = status.coordination || {};
  const activity = status.agentActivity || {};
  const workspace = manifest.workspace?.root || manifest.workspace?.name || ".";
  const next = status.nextCommand || status.decision?.nextCommand || "aienvmp status";
  const readFirst = status.nextAgent?.readFirst || ".aienvmp/status.json";
  const detail = status.quickstart?.detailCommand || "aienvmp context --json";
  const strict = status.enforcement?.recommendedCommand || "aienvmp doctor --strict all";
  const riskLevel = sbomRisk.level || "unknown";
  const riskScore = valueOrZero(sbomRisk.score);
  const scanner = sbomRisk.scanner || manifest.lightSbom?.source?.scanner || "not run";
  const riskSignals = toList(sbomRisk.signals).slice(0, 3);
  const conflictTargets = toList(coordination.conflictTargets);
  const multiActorTargets = toList(activity.multiActorTargets);
  const dependencyProtocol = status.dependencyChangeProtocol || {};
  const dependencyCommands = dependencyProtocol.commands || {};
  const dependencyFiles = dependencyFilesFor(status.dependencyReadSet);

  return [
    "# aienvmp summary",
    "",
    `- state: ${status.state || "unknown"}`,
    `- workspace: ${workspace}`,
    `- warnings: ${valueOrZero(counts.warnings)} / open intents: ${valueOrZero(counts.openIntents)}`,
    `- runtimes: ${valueOrZero(counts.runtimes)} / dependencies: ${valueOrZero(counts.dependencies)} / vulnerabilities: ${valueOrZero(counts.vulnerabilities)}`,
    `- light SBOM risk: ${riskLevel} (${riskScore}) / scanner: ${scanner}`,
    `- next: ${next}`,
    `- AI read first: ${readFirst}, then ${detail}`,
    `- mode: advisory by default; strict is opt-in with ${strict}`,
    "",
    "## AI handoff",
    "",
    `- environment changes: ${status.agentUse?.environmentChanges || "intent-and-review-first"}`,
    `- coordination: ${coordination.next || "No open environment intents."}`,
    `- recent agent activity: ${activity.next || "No environment records need coordination."}`,
    `- conflict targets: ${conflictTargets.length ? conflictTargets.join(", ") : "none"}`,
    `- multi-actor targets: ${multiActorTargets.length ? multiActorTargets.join(", ") : "none"}`,
    "",
    "## SBOM",
    "",
    `- source: ${manifest.lightSbom?.source?.dependencies || "project manifests"}`,
    `- confidence: transitive ${manifest.lightSbom?.confidence?.transitiveDependencies || "not-resolved"}`,
    `- signals: ${riskSignals.length ? riskSignals.join("; ") : "none"}`,
    `- verify: ${sbomRisk.next || "Use a dedicated scanner for security decisions."}`,
    "",
    "## Dependency changes",
    "",
    `- read files: ${dependencyFiles.length ? dependencyFiles.join(", ") : "none detected"}`,
    `- before: ${dependencyCommands.recordIntent || "aienvmp intent --actor agent:id --action planned-change --target dependency"}`,
    `- after: ${dependencyCommands.checkpointAfterChange || "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"}`,
    `- package manager policy: ${dependencyProtocol.packageManagerPolicy || "not-detected"}`,
    "",
    "## Artifacts",
    "",
    "- AIENV.md",
    "- .aienvmp/status.json",
    "- .aienvmp/manifest.json",
    "- .aienvmp/sbom.json",
    "- .aienvmp/sbom.cdx.json",
    "- .aienvmp/dashboard.html"
  ].join("\n");
}

function valueOrZero(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function toList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function dependencyFilesFor(readSet = []) {
  const files = [];
  for (const item of toList(readSet).slice(0, 3)) {
    if (item.manifest) files.push(item.manifest);
    for (const lockfile of toList(item.lockfiles).slice(0, 3)) {
      const file = typeof lockfile === "string" ? lockfile : lockfile?.file;
      if (file && !files.includes(file)) files.push(file);
    }
  }
  return files.slice(0, 8);
}
