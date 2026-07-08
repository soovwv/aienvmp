import { initWorkspace } from "./commands/init.js";
import { scanWorkspace } from "./commands/scan.js";
import { compileWorkspace } from "./commands/compile.js";
import { diffWorkspace } from "./commands/diff.js";
import { doctorWorkspace } from "./commands/doctor.js";
import { dashWorkspace } from "./commands/dash.js";
import { contextWorkspace } from "./commands/context.js";
import { recordWorkspace } from "./commands/record.js";
import { intentWorkspace } from "./commands/intent.js";
import { resolveWorkspace } from "./commands/resolve.js";
import { syncWorkspace } from "./commands/sync.js";
import { snippetWorkspace } from "./commands/snippet.js";
import { handoffWorkspace } from "./commands/handoff.js";
import { planWorkspace } from "./commands/plan.js";
import { statusWorkspace } from "./commands/status.js";
import { schemaWorkspace } from "./commands/schema.js";
import { checkpointWorkspace } from "./commands/checkpoint.js";
import { sbomWorkspace } from "./commands/sbom.js";
import { summaryWorkspace } from "./commands/summary.js";
import { readFileSync } from "node:fs";

const commands = new Map([
  ["init", initWorkspace],
  ["scan", scanWorkspace],
  ["compile", compileWorkspace],
  ["diff", diffWorkspace],
  ["doctor", doctorWorkspace],
  ["dash", dashWorkspace],
  ["context", contextWorkspace],
  ["record", recordWorkspace],
  ["intent", intentWorkspace],
  ["resolve", resolveWorkspace],
  ["sync", syncWorkspace],
  ["snippet", snippetWorkspace],
  ["handoff", handoffWorkspace],
  ["plan", planWorkspace],
  ["status", statusWorkspace],
  ["schema", schemaWorkspace],
  ["checkpoint", checkpointWorkspace],
  ["sbom", sbomWorkspace],
  ["summary", summaryWorkspace]
]);

const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const globalValueOptions = new Set(["--dir"]);

export async function main(argv) {
  const { command, rest, globalArgs } = splitCommand(argv);
  if (command === "-v" || command === "--version" || command === "version") {
    console.log(version);
    return;
  }
  if (!command || command === "-h" || command === "--help") {
    printUsage();
    return;
  }
  const run = commands.get(command);
  if (!run) {
    printUsage();
    throw new Error(`unknown command "${command}"`);
  }
  await run({ ...globalArgs, ...parseArgs(rest) });
}

function splitCommand(argv) {
  const leading = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      return {
        command: arg,
        rest: argv.slice(i + 1),
        globalArgs: parseArgs(leading)
      };
    }
    leading.push(arg);
    if (!arg.includes("=") && globalValueOptions.has(arg) && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      leading.push(argv[++i]);
    }
  }
  return {
    command: argv[0],
    rest: [],
    globalArgs: parseArgs(leading)
  };
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      out._.push(arg);
      continue;
    }
    const [rawKey, inline] = arg.slice(2).split("=", 2);
    const key = rawKey.replaceAll("-", "_");
    if (inline !== undefined) {
      out[key] = inline;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      out[key] = argv[++i];
    } else {
      out[key] = true;
    }
  }
  return out;
}

function printUsage() {
  console.log(`aienvmp - AI-first env map + lightweight runtime SBOM

Usage:
  aienvmp sync [--dir .] [--json] [--quiet] [--deep] [--security]
  aienvmp context [--dir .] [--json]
  aienvmp status [--dir .] [--json] [--write] [--quiet]
  aienvmp handoff [--dir .] [--json] [--record --actor agent:id]
  aienvmp checkpoint [--dir .] --actor agent:id --summary "what changed" [--target dependency] [--json]
  aienvmp plan [--dir .] [--json] [--write]
  aienvmp sbom [--dir .] [--json] [--write]
  aienvmp summary [--dir .] [--write]
  aienvmp schema [--json]

Common:
  aienvmp sync      update AIENV.md, manifest, status, summary, SBOM, ledger, intents, and dashboard
  aienvmp status    print one simple environment decision; --write saves .aienvmp/status.json
  aienvmp context   print the AI preflight brief
  aienvmp handoff   print the next-agent handoff summary
  aienvmp checkpoint record, sync, status, and handoff after an env change
  aienvmp plan      print a read-only AI environment action plan
  aienvmp sbom      print/write standalone light SBOM artifact
  aienvmp summary   print/write a compact Markdown summary for AI and CI
  aienvmp schema    print the stable AI-readable output contract
  aienvmp snippet   print an AGENTS.md pointer snippet
  aienvmp dash      regenerate/open the lightweight dashboard

Advanced:
  aienvmp init [--dir .]
  aienvmp scan [--dir .] [--deep] [--security]
  aienvmp intent [--dir .] --actor agent:codex --action "install pnpm"
  aienvmp resolve [--dir .] --actor human:you --id <intent-id> [--status resolved|cancelled]
  aienvmp record [--dir .] --actor agent:codex --summary "updated .nvmrc" [--target node] [--before 20] [--after 24]
  aienvmp checkpoint [--dir .] --actor agent:codex --summary "updated dependency" [--target dependency]
  aienvmp snippet [agents|codex|claude|gemini] [--write AGENTS.md]
  aienvmp compile [--dir .]
  aienvmp diff [--dir .]
  aienvmp doctor [--dir .] [--json] [--ci] [--strict security|policy|coordination|all]
  aienvmp sbom [--dir .] [--json] [--write]
  aienvmp summary [--dir .] [--write]
  aienvmp dash [--dir .] [--open]
`);
}
