import { snippetWorkspace } from "./snippet.js";
import { syncWorkspace } from "./sync.js";

const defaultAgents = ["codex", "claude", "gemini"];
const knownAgents = new Set(["agents", "codex", "claude", "gemini"]);

export async function onboardWorkspace(args = {}) {
  const agents = selectedAgents(args);
  const pointers = [];

  for (const agent of agents) {
    pointers.push(await snippetWorkspace({ ...args, _: [agent], write: true, quiet: true }));
  }

  const synced = args.no_sync ? null : await syncWorkspace({ ...args, json: false, quiet: true });
  const result = {
    status: "ok",
    pointers,
    sync: synced ? "ok" : "skipped",
    next: "Run aienvmp status, then let Codex, Claude, or Gemini read its instruction file pointer."
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!args.quiet) {
    console.log(`onboarded AI pointers: ${pointers.map((item) => item.file).join(", ")}`);
    console.log(`sync: ${result.sync}`);
    console.log(`next: ${result.next}`);
  }

  return result;
}

function selectedAgents(args = {}) {
  const raw = args.agents
    ? String(args.agents).split(",")
    : Array.isArray(args._) && args._.length
      ? args._
      : defaultAgents;
  const agents = raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  const invalid = agents.filter((item) => !knownAgents.has(item));
  if (invalid.length) throw new Error(`unknown onboard agent "${invalid[0]}"; use codex, claude, or gemini`);
  return [...new Set(agents.map((item) => item === "agents" ? "codex" : item))];
}
