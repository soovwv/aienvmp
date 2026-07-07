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
    trust: changedTrust(now, requiresReview)
  };
  await appendJsonLine(timelinePath(dir), entry);
  console.log(`recorded ${entry.type} by ${actor}`);
}

function required(value, name) {
  if (!value) throw new Error(`record: --${name} is required`);
  return String(value);
}
