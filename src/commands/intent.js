import { appendJsonLine } from "../fsutil.js";
import { intentsPath, workspaceDir } from "../paths.js";

export async function intentWorkspace(args) {
  const dir = workspaceDir(args);
  const actor = required(args.actor, "actor");
  const action = required(args.action, "action");
  const entry = {
    at: new Date().toISOString(),
    actor,
    action,
    target: args.target || "",
    reason: args.reason || "",
    status: "open"
  };
  await appendJsonLine(intentsPath(dir), entry);
  console.log(`intent recorded by ${actor}`);
}

function required(value, name) {
  if (!value) throw new Error(`intent: --${name} is required`);
  return String(value);
}
