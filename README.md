# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI Environment Map.**

`aienvmp` is an AI-first environment map for shared coding machines.

It helps Codex, Claude, Gemini, and humans avoid silent Node, Python, package manager, dependency, Docker, and security drift.

Core loop: scan once, link runtime/dependency/security context, give AI a shared decision contract with advisory priorities, and hand off safe next steps.

## Quick Start

```bash
npx aienvmp sync
npx aienvmp context
npx aienvmp plan
npx aienvmp handoff
```

Optional deeper read-only checks:

```bash
npx aienvmp sync --deep
npx aienvmp sync --security
```

## AI Usage

Tell each agent to read `aienvmp context --json` before environment changes.

```bash
npx aienvmp context --json
npx aienvmp intent --actor agent:codex --action "upgrade node" --target node
npx aienvmp record --actor agent:codex --summary "updated .nvmrc" --target node
npx aienvmp handoff --record --actor agent:codex
```

## Output

```text
AIENV.md
.aienvmp/manifest.json
.aienvmp/intents.jsonl
.aienvmp/timeline.jsonl
.aienvmp/plan.json
.aienvmp/plan.md
.aienvmp/dashboard.html     # includes dependencies, plan, remediation, and environment cards
```

Trust states are machine-readable: `observed`, `planned`, `changed`, `review`, `verified`, `stale`.

AI agents can observe, plan, and record. Only a human or CI should mark environment facts as verified.

## Agent Files

`aienvmp` does not replace AGENTS.md. It gives AGENTS.md a live environment source of truth.

```bash
npx aienvmp snippet agents
```

## CI Usage

Use the GitHub Action to write the env map, plan, dashboard, and optional strict checks. See [examples/github-action.yml](examples/github-action.yml).
The dashboard shows which strict scopes are CI-ready before you enforce them.

```yaml
- uses: soovwv/aienvmp@main
  with:
    write-plan: "true"
    strict: "off" # security, policy, coordination, all, or off
```

## Commands

```bash
aienvmp sync              # update env map, light SBOM, ledger, dashboard
aienvmp context           # AI preflight brief
aienvmp context --json    # AI decision contract + actions + compact step summary
aienvmp plan              # read-only AI action plan using the same decision contract
aienvmp handoff           # next-agent handoff summary using the same decision contract
aienvmp intent            # record a planned env change
aienvmp record            # record what changed
aienvmp doctor --ci       # strict CI check for all warnings
aienvmp doctor --strict security  # fail only scoped warnings
```

## Principles

- simple by default
- AI-first
- lightweight
- read-only planning, no automatic fixes
- one advisory engine, optional enforcement with `doctor --ci`
- scoped enforcement with `doctor --strict security|policy|coordination|all`
- context and plan expose suggested strict scopes for CI
- non-blocking unless strict mode is explicitly requested
- security checks are opt-in and read-only

## Development

```bash
node --test
npm run smoke
npm pack --dry-run
```

## Links

[Roadmap](ROADMAP.md) / [Security](SECURITY.md) / [Troubleshooting](TROUBLESHOOTING.md) / [Bugfix Log](BUGFIXES.md) / [Contributing](CONTRIBUTING.md)

Apache-2.0
