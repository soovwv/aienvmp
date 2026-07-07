# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI Environment Map.**

`aienvmp` is an AI environment coordination tool for shared coding machines.

It helps Codex, Claude, Gemini, and other agents avoid silently using or installing different runtime and tool versions.

Core loop: scan the env, give AI a preflight context, and hand off safe next steps to the next agent.

## Use

```bash
npx aienvmp sync
npx aienvmp context
npx aienvmp handoff
```

## Output

```text
AIENV.md
.aienvmp/manifest.json
.aienvmp/intents.jsonl
.aienvmp/timeline.jsonl
.aienvmp/dashboard.html
```

Trust states are machine-readable: `observed`, `planned`, `changed`, `review`, `verified`, `stale`.

AI agents can observe, plan, and record. Only a human or CI should mark environment facts as verified.

## For AGENTS.md

`aienvmp` does not replace AGENTS.md. It gives AGENTS.md a live environment source of truth.

```bash
npx aienvmp snippet agents
```

## Commands

```bash
aienvmp sync              # update env map, light SBOM, ledger, dashboard
aienvmp context           # AI preflight brief
aienvmp context --json    # machine-readable AI decision context
aienvmp handoff           # next-agent handoff summary
aienvmp intent            # record a planned env change
aienvmp record            # record what changed
aienvmp doctor --ci       # strict CI check
```

## Principles

- simple by default
- AI-first
- lightweight
- non-blocking unless strict mode is requested

## Development

```bash
node --test
npm run smoke
npm pack --dry-run
```

## Links

[Roadmap](ROADMAP.md) / [Security](SECURITY.md) / [Troubleshooting](TROUBLESHOOTING.md) / [Bugfix Log](BUGFIXES.md) / [Contributing](CONTRIBUTING.md)

Apache-2.0
