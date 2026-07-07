import { appendJsonLine } from "../fsutil.js";
import { timelinePath, workspaceDir } from "../paths.js";
import { changedTrust } from "../trust.js";

export async function recordWorkspace(args) {
  const dir = workspaceDir(args);
  const actor = required(args.actor, "actor");
  const summary = required(args.summary || args.change, "summary");
  const now = new Date();
  const requiresReview = args.review === true || args.review === "true";
  const entry = {
    at: now.toISOString(),
    actor,
    type: args.type || "agent-record",
    summary,
    target: args.target || "",
    before: args.before || "",
    after: args.after || "",
    evidence: args.evidence || "",
    requiresReview,
    followUp: followUpForRecord({ target: args.target, summary }),
    trust: changedTrust(now, requiresReview)
  };
  await appendJsonLine(timelinePath(dir), entry);
  console.log(`recorded ${entry.type} by ${actor}`);
}

export function followUpForRecord(record = {}) {
  const target = String(record.target || "").toLowerCase();
  const text = `${record.summary || ""} ${target}`.toLowerCase();
  const isDependency = ["dependency", "package", "lockfile", "vulnerab", "security", "npm", "pnpm", "yarn", "pip", "uv"].some((item) => text.includes(item));
  const isEnvironment = isDependency || ["node", "python", "docker", "runtime", "package-manager", "global"].some((item) => text.includes(item));
  if (!isEnvironment) return {
    required: false,
    reason: "No environment follow-up detected.",
    commands: []
  };
  return {
    required: true,
    target: isDependency ? "dependency" : target || "environment",
    reason: isDependency
      ? "Dependency or security records should refresh the env map and handoff context."
      : "Environment records should refresh the env map and handoff context.",
    commands: [
      "aienvmp sync",
      "aienvmp status --write",
      "aienvmp handoff --record --actor agent:id"
    ]
  };
}

function required(value, name) {
  if (!value) throw new Error(`record: --${name} is required`);
  return String(value);
}
