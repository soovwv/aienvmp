import fs from "node:fs/promises";
import path from "node:path";
import { diagnose } from "../doctor.js";
import { readJson, replaceMarkerBlock } from "../fsutil.js";
import { readJsonl, readTimeline } from "../timeline.js";
import { aiEnvPath, intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { markerBegin, markerEnd, renderAgentBlock, renderAIEnv } from "../render.js";

const agentFiles = {
  codex: "AGENTS.md",
  claude: "CLAUDE.md",
  gemini: "GEMINI.md"
};

export async function compileWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp scan` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = await readJsonl(intentsPath(dir));
  const warnings = diagnose(manifest);
  const rendered = renderAIEnv(manifest, timeline, warnings, intents);
  await fs.writeFile(aiEnvPath(dir), rendered, "utf8");
  const agents = parseAgents(args.agents);
  const block = renderAgentBlock(manifest);
  for (const agent of agents) {
    const rel = agentFiles[agent];
    if (!rel) continue;
    await replaceMarkerBlock(path.join(dir, rel), markerBegin, markerEnd, block);
  }
  console.log(`compiled ${aiEnvPath(dir)}`);
  if (agents.length) console.log(`injected: ${agents.join(", ")}`);
}

function parseAgents(value) {
  if (!value) return [];
  if (value === true || value === "all") return Object.keys(agentFiles);
  return String(value).split(",").map((v) => v.trim()).filter(Boolean);
}
