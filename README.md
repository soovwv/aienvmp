# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI Environment Map.**

`aienvmp` is a lightweight env map and light SBOM for AI coding workspaces.

It helps Codex, Claude, Gemini, and humans avoid silent runtime, package manager, dependency, Docker, and security drift on shared machines.

**Use it when multiple AI agents or people touch the same server, repo, laptop, or CI workspace.**

## Why

- one AI-readable environment map
- one lightweight SBOM view
- one append-only intent and change timeline
- one human dashboard
- advisory by default, strict only when requested

## 10-Second Use

```bash
npx aienvmp sync
npx aienvmp status
npx aienvmp handoff
```

For AI details:

```bash
npx aienvmp context --json
npx aienvmp schema --json
```

Before an environment-affecting change:

```bash
npx aienvmp intent --actor agent:id --action "planned-change" --target dependency
npx aienvmp checkpoint --actor agent:id --summary "dependency-change" --target dependency
```

Use `--dir <workspace>` when AI or CI runs outside the target project. Warnings do not block local work by default.

## AI Loop

1. `sync` refreshes `AIENV.md`, status, summary, SBOM, ledger, and dashboard.
2. `status` gives the 5-line clear/review decision.
3. `context --json` gives AI the full preflight contract.
4. `intent` records planned env changes before touching dependencies, runtimes, package managers, Docker, or global tools.
5. `checkpoint` records the accepted change, refreshes outputs, and writes a handoff.
6. `handoff` tells the next AI what to read, what to avoid, and whether SBOM/strict review is needed.

Local mode is warn-only. Use `doctor --strict security|policy|coordination|all` only for CI or explicit human-requested gates.

## What It Creates

```text
AIENV.md                 # Markdown env map for AI agents
.aienvmp/status.json     # first AI read: clear/review, next command, nextAgent hint
.aienvmp/summary.md      # compact AI/CI summary; starts with AI readiness
.aienvmp/manifest.json   # runtime map + light SBOM
.aienvmp/sbom.json       # standalone AI-readable light SBOM
.aienvmp/sbom.cdx.json   # CycloneDX-lite export from project manifests
.aienvmp/intents.jsonl   # planned env changes
.aienvmp/timeline.jsonl  # append-only change ledger
.aienvmp/plan.md         # read-only action plan
.aienvmp/dashboard.html  # human dashboard
```

## AI Contract

- `status`, `context`, `plan`, and `handoff` share one additive preflight contract.
- `maintenanceLoop` gives AI the recurring env-management loop.
- `sbomRisk` and `sbomReview` connect light SBOM risk to safe dependency-change steps.
- `collaboration`, `coordination`, and `agentActivity` show multi-agent conflicts and shared targets.
- `strictDecision` separates local warn-only checks from optional CI strict gates.
- `context --json` and `doctor --json` include `nextSafeCommand` for one advisory next step.
- `schema --json` prints the stable machine-readable contract without scanning.

## Agent Files

`aienvmp` does not replace AGENTS.md, CLAUDE.md, or GEMINI.md. It gives them a live environment source of truth.

```bash
npx aienvmp snippet codex
npx aienvmp snippet agents
npx aienvmp snippet claude
npx aienvmp snippet gemini
```

Snippets point each AI to `status`, `summary.md`, `context --json`, intent, and checkpoint without taking over the instruction file.
`sync` records whether those pointers are installed, and `doctor` can recommend installing one without blocking local work.
`status`, `context --json`, and `doctor --json` expose the same `agentPointers` summary for AI consumers.

## Commands

```bash
aienvmp sync                    # update env map, status, summary, SBOM, dashboard
aienvmp status                  # 5-line env decision
aienvmp status --write          # refresh compact AI status artifact
aienvmp status --verbose        # show command details
aienvmp summary --write         # refresh compact Markdown summary
aienvmp context --json          # AI decision contract
aienvmp sbom --json             # standalone light SBOM
aienvmp sbom --format cyclonedx-lite --json
aienvmp schema --json           # stable output contract for AI/CI consumers
aienvmp plan --write            # read-only action plan
aienvmp handoff --record        # next-agent summary
aienvmp intent                  # record planned env change
aienvmp resolve --target dependency --actor agent:id
aienvmp record                  # record what changed
aienvmp checkpoint              # record + sync + status + handoff after env change
aienvmp doctor --strict security|policy|coordination|all
```

## CI

The GitHub Action writes status, summary, schema, doctor, plan, SBOM, and dashboard artifacts. `strict: "off"` reports warnings without failing the job.
The Step Summary includes `aienvmp strict plan` and `aienvmp AI loop` blocks so humans and AI agents can choose CI gates and continue the same workflow without parsing full artifacts.

```yaml
- uses: soovwv/aienvmp@main
  with:
    write-status: "true"
    write-plan: "true"
    write-sbom: "true"
    write-summary: "true"
    strict: "off"
```

See [examples/github-action.yml](examples/github-action.yml).

## Principles

- simple commands
- AI-first outputs
- lightweight, read-only scanning
- light SBOM from project files
- advisory locally, strict only when requested
- humans or CI verify; AI agents observe, plan, record, and hand off

## Development

```bash
node --test
npm run smoke
npm pack --dry-run
```

[Roadmap](ROADMAP.md) / [Security](SECURITY.md) / [Troubleshooting](TROUBLESHOOTING.md) / [Bugfix Log](BUGFIXES.md) / [Contributing](CONTRIBUTING.md)

Apache-2.0
