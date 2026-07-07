# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI Environment Map.**

`aienvmp` is an AI-first environment map for shared coding machines.

It helps Codex, Claude, Gemini, and humans avoid silent Node, Python, package manager, dependency, Docker, and security drift.

Core loop: scan once, link runtime/dependency/security context, give AI a shared decision contract with a light SBOM summary, and hand off safe next steps.

## Quick Start

```bash
npx aienvmp sync
npx aienvmp status
npx aienvmp context
npx aienvmp plan
npx aienvmp handoff
```

10-second AI flow: `aienvmp status --write` -> `aienvmp context --json` -> intent before environment changes.

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
.aienvmp/status.json       # first file for AI: clear/review, next command, strict advice
.aienvmp/intents.jsonl
.aienvmp/timeline.jsonl
.aienvmp/plan.json
.aienvmp/plan.md             # read-only plan with dependency protocol
.aienvmp/dashboard.html     # includes dependencies, plan, remediation, and environment cards
```

`AIENV.md` includes the 10-second AI flow and recommended intent targets for Markdown-first agents.

Trust states are machine-readable: `observed`, `planned`, `changed`, `review`, `verified`, `stale`.
`status.json` also lists AI read order, artifact paths, and safe commands.
`status`, `context`, `plan`, and `handoff` share the same AI preflight contract.
Preflight also recommends the intent target, so agents do not guess between runtime, package manager, dependency, Docker, or coordination changes.
It also lists dependency manifests and lockfiles to read before package or security changes.
Dependency and security changes stay advisory: record dependency intent, refresh with `sync`, then record what changed.
Dependency records also trigger handoff/coordination warnings for the next agent.
The dashboard shows the same intent target guidance for human review.

AI agents can observe, plan, and record. Only a human or CI should mark environment facts as verified.

## Agent Files

`aienvmp` does not replace AGENTS.md. It gives AGENTS.md a live environment source of truth.

```bash
npx aienvmp snippet agents
```

## CI Usage

Use the GitHub Action to write the env map, plan, dashboard, and optional strict checks. See [examples/github-action.yml](examples/github-action.yml).
CI also writes `.aienvmp/status.json` for a compact AI-readable result.
The dashboard shows which strict scopes are CI-ready before you enforce them.

```yaml
- uses: soovwv/aienvmp@main
  with:
    write-status: "true"
    write-plan: "true"
    strict: "off" # security, policy, coordination, all, or off
```

## Commands

```bash
aienvmp sync              # update env map, light SBOM, status, ledger, dashboard
aienvmp status --write    # refresh .aienvmp/status.json only
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
- dashboard and preflight explain advisory default vs optional strict mode
- non-blocking unless strict mode is explicitly requested
- security checks are opt-in and read-only
- light SBOM is generated from project files and optional scanner summaries
- dependency change hints point AI agents to the relevant manifest before edits
- lockfiles are detected read-only and shown before dependency edits
- package manager policy is inferred from lockfiles to avoid accidental npm/pnpm/yarn drift
- dashboard mirrors AI-facing SBOM hints so humans can review the same dependency context

## Development

```bash
node --test
npm run smoke
npm pack --dry-run
```

## Links

[Roadmap](ROADMAP.md) / [Security](SECURITY.md) / [Troubleshooting](TROUBLESHOOTING.md) / [Bugfix Log](BUGFIXES.md) / [Contributing](CONTRIBUTING.md)

Apache-2.0
