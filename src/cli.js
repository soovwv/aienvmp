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
  ["resolve", resolveWorkspace]
]);

const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

export async function main(argv) {
  const [command, ...rest] = argv;
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
  await run(parseArgs(rest));
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
  aienvmp init [--dir .]
  aienvmp scan [--dir .]
  aienvmp context [--dir .] [--json]
  aienvmp intent [--dir .] --actor agent:codex --action "install pnpm"
  aienvmp resolve [--dir .] --actor human:you --id <intent-id> [--status resolved|cancelled]
  aienvmp record [--dir .] --actor agent:codex --summary "updated .nvmrc" [--target node] [--before 20] [--after 24]
  aienvmp compile [--dir .] [--agents all|codex,claude,gemini]
  aienvmp diff [--dir .]
  aienvmp doctor [--dir .] [--json] [--ci]
  aienvmp dash [--dir .] [--open]
`);
}
