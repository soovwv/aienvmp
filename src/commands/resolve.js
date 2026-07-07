import { appendJsonLine } from "../fsutil.js";
import { readJsonl, openIntents } from "../timeline.js";
import { intentsPath, workspaceDir } from "../paths.js";

export async function resolveWorkspace(args) {
  const dir = workspaceDir(args);
  const actor = required(args.actor, "actor");
  const requested = required(args.id || args.ref, "id");
  const ref = await resolveIntentRef(dir, requested);
  const entry = {
    at: new Date().toISOString(),
    type: "intent-resolved",
    actor,
    ref,
    status: args.status || "resolved",
    reason: args.reason || ""
  };
  await appendJsonLine(intentsPath(dir), entry);
  console.log(`intent ${entry.status}: ${ref}`);
}

function required(value, name) {
  if (!value) throw new Error(`resolve: --${name} is required`);
  return String(value);
}

async function resolveIntentRef(dir, requested) {
  const open = openIntents(await readJsonl(intentsPath(dir)));
  const matches = open.filter((intent) => intent.id === requested || intent.id.startsWith(requested));
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1) {
    throw new Error(`resolve: "${requested}" matches multiple open intents`);
  }
  return requested;
}
