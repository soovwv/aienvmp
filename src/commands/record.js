import { appendJsonLine } from "../fsutil.js";
import { timelinePath, workspaceDir } from "../paths.js";

export async function recordWorkspace(args) {
  const dir = workspaceDir(args);
  const actor = required(args.actor, "actor");
  const summary = required(args.summary || args.change, "summary");
  const entry = {
    at: new Date().toISOString(),
    actor,
    type: args.type || "agent-record",
    summary,
    target: args.target || "",
    before: args.before || "",
    after: args.after || "",
    evidence: args.evidence || "",
    requiresReview: args.review === true || args.review === "true"
  };
  await appendJsonLine(timelinePath(dir), entry);
  console.log(`recorded ${entry.type} by ${actor}`);
}

function required(value, name) {
  if (!value) throw new Error(`record: --${name} is required`);
  return String(value);
}
