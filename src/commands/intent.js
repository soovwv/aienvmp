import { appendJsonLine } from "../fsutil.js";
import { intentsPath, workspaceDir } from "../paths.js";
import { newIntentID } from "../timeline.js";

export async function intentWorkspace(args) {
  const dir = workspaceDir(args);
  const actor = required(args.actor, "actor");
  const action = required(args.action, "action");
  const entry = {
    at: new Date().toISOString(),
    type: "intent",
    actor,
    action,
    target: args.target || "",
    reason: args.reason || "",
    status: "open"
  };
  entry.id = newIntentID();
  await appendJsonLine(intentsPath(dir), entry);
  console.log(`intent recorded: ${entry.id}`);
}

function required(value, name) {
  if (!value) throw new Error(`intent: --${name} is required`);
  return String(value);
}
