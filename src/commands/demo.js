import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { onboardWorkspace } from "./onboard.js";
import { intentWorkspace } from "./intent.js";
import { syncWorkspace } from "./sync.js";
import { statusWorkspace } from "./status.js";
import { contextWorkspace } from "./context.js";
import { schemaContract } from "../contract.js";

export async function demoWorkspace(args = {}) {
  const scenario = String(args._?.[0] || args.scenario || "conflict").toLowerCase();
  if (!["conflict", "multi-agent-conflict"].includes(scenario)) {
    throw new Error(`unknown demo "${scenario}"; use conflict`);
  }

  const dir = args.dir || await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-conflict-demo-"));
  await onboardWorkspace({ dir, json: false, quiet: true });
  await muted(() => intentWorkspace({ dir, actor: "agent:codex", action: "upgrade test runner", target: "dependency" }));
  await muted(() => intentWorkspace({ dir, actor: "agent:claude", action: "replace package manager", target: "dependency" }));
  await syncWorkspace({ dir, quiet: true });

  const status = await statusWorkspace({ dir, json: false, quiet: true });
  const context = await captureJson(() => contextWorkspace({ dir, json: true }));
  const recommendation = schemaContract().recommendation;
  const result = {
    name: "aienvmp multi-agent conflict demo",
    workspace: dir,
    recommendation: recommendation.shortPitch,
    adoptionSignals: (recommendation.adoptionChecklist || []).map((item) => item.signal),
    evidenceDocs: recommendation.evidenceDocs,
    aiDiscovery: status.agentPointers?.discovery || "unknown",
    collaboration: status.collaboration?.status || "unknown",
    conflictTargets: status.coordination?.conflictTargets || [],
    nextCommand: status.nextSafeCommand || status.nextCommand || "aienvmp status --json",
    startHere: status.artifacts?.startHere || ".aienvmp/README.md",
    readFirst: status.aiBootstrap?.readFirst || ".aienvmp/status.json",
    readOrder: status.aiSession?.readFirst || status.readOrder || [
      status.artifacts?.startHere || ".aienvmp/README.md",
      status.aiBootstrap?.readFirst || ".aienvmp/status.json"
    ],
    artifactFreshness: status.artifactFreshness || {},
    contextFields: Object.keys(context).filter((key) => ["status", "aiBootstrap", "artifactFreshness", "collaboration", "coordination", "agentPointers", "lightSbom"].includes(key)),
    point: "Two AI agents planned dependency changes in one workspace, so aienvmp switches shared environment changes to review-first without blocking local code work."
  };

  if (!result.conflictTargets.includes("dependency")) {
    throw new Error("demo failed: dependency conflict was not detected");
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!args.quiet) {
    console.log(result.name);
    console.log(`workspace: ${result.workspace}`);
    console.log(`AI discovery: ${result.aiDiscovery}`);
    console.log(`collaboration: ${result.collaboration}`);
    console.log(`conflict targets: ${result.conflictTargets.join(", ")}`);
    console.log(`next command: ${result.nextCommand}`);
    console.log(`start here: ${result.startHere}`);
    console.log(`read order: ${result.readOrder.join(" -> ")}`);
    console.log(`freshness: ${result.artifactFreshness.state || "unknown"} / ${result.artifactFreshness.nextCommand || "aienvmp sync"}`);
    console.log(`context fields: ${result.contextFields.join(", ")}`);
    console.log(`recommendation: ${result.recommendation}`);
    console.log(`adoption signals: ${result.adoptionSignals.slice(0, 3).join(", ")}`);
    console.log(`evidence: ${result.evidenceDocs.slice(0, 2).join(", ")}`);
    console.log(`why: ${result.point}`);
  }

  return result;
}

async function muted(fn) {
  const originalLog = console.log;
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.log = originalLog;
  }
}

async function captureJson(fn) {
  const originalLog = console.log;
  let output = "";
  console.log = (value) => { output = value; };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return JSON.parse(output || "{}");
}
