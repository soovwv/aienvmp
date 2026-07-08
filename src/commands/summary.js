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
  const collaboration = status.collaboration || {};
  const maintenanceLoop = status.maintenanceLoop || {};
  const sbomReview = maintenanceLoop.sbomReview || {};
  const aiBootstrap = status.aiBootstrap || {};
  const workspace = manifest.workspace?.root || manifest.workspace?.name || ".";
  const next = aiBootstrap.nextSafeCommand || status.nextSafeCommand || status.nextCommand || status.decision?.nextCommand || "aienvmp status";
  const readFirst = aiBootstrap.readFirst || status.nextAgent?.readFirst || ".aienvmp/status.json";
  const detail = aiBootstrap.detailCommand || status.quickstart?.detailCommand || "aienvmp context --json";
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
  const agentPointers = status.agentPointers || {};
  const aiReadiness = status.aiReadiness || {};
  const aiSignals = toList(aiReadiness.signals).slice(0, 5);
  const aiNext = aiReadiness.next || "Run aienvmp context --json for details.";
  const aiDependencyReview = manifest.lightSbom?.aiDependencyReview || {};
  const aiReviewPlan = manifest.lightSbom?.aiReviewPlan || {
    status: aiDependencyReview.status || "unknown",
    risk: `${riskLevel}/${riskScore}`,
    securityConfidence: aiDependencyReview.securityConfidence || "unknown",
    packageManagerPolicy: manifest.lightSbom?.packageManagerPolicy?.status || dependencyProtocol.packageManagerPolicy || "not-detected",
    beforeChange: aiDependencyReview.beforeDependencyChange?.[0] || sbomReview.nextCommand || "aienvmp sbom --json",
    afterChange: aiDependencyReview.afterDependencyChange?.slice(-1)[0] || "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"
  };
  const strictPlan = status.enforcementProfile?.strictPlan || status.enforcement?.strictPlan || {};
  const strictDecision = status.enforcementProfile?.strictDecision || status.enforcement?.strictDecision || {};

  return [
    "# aienvmp summary",
    "",
    `- AI readiness: ${aiReadiness.level || "unknown"}`,
    `- AI signals: ${aiSignals.length ? aiSignals.join("; ") : "none"}`,
    `- AI bootstrap: ${aiBootstrap.projectLocalWork || "allowed"} / ${aiBootstrap.environmentChanges || status.agentUse?.environmentChanges || "intent-first"} / ${aiBootstrap.localMode || "advisory"}`,
    `- AI next: ${next} (${aiNext})`,
    `- AI collaboration: ${collaboration.status || "unknown"} / ${toList(collaboration.activeTargets).join(", ") || "none"} / ${collaboration.nextCommand || "aienvmp status --json"}`,
    `- AI maintenance loop: ${maintenanceLoop.nextCommand || next}`,
    `- AI safe local work: ${toList(aiReadiness.safeProjectLocalActions)[0] || "read artifacts and avoid environment changes until reviewed"}`,
    `- AI read first: ${readFirst}, then ${detail}`,
    `- AI bootstrap rule: ${aiBootstrap.rule || "Read status first, use context for details, and keep local checks advisory."}`,
    `- mode: advisory by default; strict is opt-in with ${strict}`,
    `- local check: ${strictDecision.localCommand || "aienvmp doctor --json"} (${strictDecision.local || "warn-only"})`,
    `- CI strict: ${strictPlan.ciCommand || `${strict} --json`}`,
    "",
    `- state: ${status.state || "unknown"}`,
    `- workspace: ${workspace}`,
    `- warnings: ${valueOrZero(counts.warnings)} / open intents: ${valueOrZero(counts.openIntents)}`,
    `- runtimes: ${valueOrZero(counts.runtimes)} / dependencies: ${valueOrZero(counts.dependencies)} / vulnerabilities: ${valueOrZero(counts.vulnerabilities)}`,
    `- light SBOM risk: ${riskLevel} (${riskScore}) / scanner: ${scanner}`,
    `- next: ${next}`,
    "",
    "## AI handoff",
    "",
    `- environment changes: ${status.agentUse?.environmentChanges || "intent-and-review-first"}`,
    `- collaboration rule: ${collaboration.rule || "Record intent before shared environment changes."}`,
    `- coordination: ${coordination.next || "No open environment intents."}`,
    `- recent agent activity: ${activity.next || "No environment records need coordination."}`,
    `- maintenance rule: ${maintenanceLoop.rule || "Refresh, inspect, record intent, checkpoint, and hand off without blocking local operation."}`,
    `- conflict targets: ${conflictTargets.length ? conflictTargets.join(", ") : "none"}`,
    `- multi-actor targets: ${multiActorTargets.length ? multiActorTargets.join(", ") : "none"}`,
    "",
    "## SBOM",
    "",
    `- source: ${manifest.lightSbom?.source?.dependencies || "project manifests"}`,
    `- confidence: transitive ${manifest.lightSbom?.confidence?.transitiveDependencies || "not-resolved"}`,
    `- maintenance SBOM review: ${sbomReview.status || "unknown"} / ${sbomReview.securityConfidence || "unknown"} / ${sbomReview.nextCommand || maintenanceLoop.sbomCommand || "aienvmp sbom --json"}`,
    `- AI SBOM plan: ${aiReviewPlan.status || "unknown"} / ${aiReviewPlan.risk || `${riskLevel}/${riskScore}`} / ${aiReviewPlan.securityConfidence || "unknown"} / ${aiReviewPlan.beforeChange || "aienvmp sbom --json"}`,
    `- AI dependency review: ${aiDependencyReview.status || "unknown"} / ${aiDependencyReview.securityConfidence || "unknown"} / ${aiDependencyReview.beforeDependencyChange?.[0] || "aienvmp sbom --json"}`,
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
    "## Agent pointers",
    "",
    `- installed: ${toList(agentPointers.installed).join(", ") || "none"}`,
    `- missing: ${toList(agentPointers.missing).join(", ") || "none"}`,
    `- next: ${agentPointers.next || "Run aienvmp snippet codex --write if AI agents need instruction-file discovery."}`,
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
