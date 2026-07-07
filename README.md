# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI Environment Map.**

`aienvmp` is a lightweight env map and light SBOM for shared AI coding machines.

It helps Codex, Claude, Gemini, and humans avoid silent runtime, package manager, dependency, Docker, and security drift.

## 10-Second Use

```bash
npx aienvmp sync
npx aienvmp status
npx aienvmp context --json
npx aienvmp schema --json
```

Before environment changes:

```bash
npx aienvmp intent --actor agent:codex --action "change dependency" --target dependency
npx aienvmp record --actor agent:codex --summary "dependency-change" --target dependency
npx aienvmp handoff --record --actor agent:codex
```

Use `--dir <workspace>` when AI or CI runs outside the target project.
Warnings are advisory by default. Use `doctor --strict <scope>` only when you want CI-style failure.

## What It Creates

```text
AIENV.md                 # Markdown env map for AI agents
.aienvmp/status.json     # first AI read: clear/review, next command, nextAgent hint
.aienvmp/manifest.json   # runtime map + light SBOM
.aienvmp/intents.jsonl   # planned env changes
.aienvmp/timeline.jsonl  # append-only change ledger
.aienvmp/plan.md         # read-only action plan
.aienvmp/dashboard.html  # human dashboard
```

## AI Contract

- `status`, `context`, `plan`, and `handoff` share one preflight contract.
- `schema --json` prints the stable AI-readable output contract without scanning.
- `status.json.nextAgent` tells the next AI what to read and whether to review first.
- `dependencyReadSet` lists manifests and lockfiles before package or security changes.
- `coordination.conflictTargets` shows where multiple agents are planning changes.
- `handoff` carries dependency read-set and protocol guidance for the next AI.
- Light SBOM includes source/confidence hints; verify security claims with dedicated scanners.
- `enforcementProfile.gate` explains when checks warn, fail, and set exit codes.
- Everything is advisory by default; strict failure is opt-in with `doctor --strict` or `--ci`.

## Agent Files

`aienvmp` does not replace AGENTS.md, CLAUDE.md, or GEMINI.md. It gives them a live environment source of truth.

```bash
npx aienvmp snippet agents
npx aienvmp snippet claude
npx aienvmp snippet gemini
```

## Commands

```bash
aienvmp sync                    # update env map, status, ledger, dashboard
aienvmp status --write          # refresh compact AI status
aienvmp context --json          # AI decision contract
aienvmp schema --json           # stable output contract for AI/CI consumers
aienvmp plan --write            # read-only action plan
aienvmp handoff --record        # next-agent summary
aienvmp intent                  # record planned env change
aienvmp record                  # record what changed
aienvmp doctor --strict security|policy|coordination|all
```

## CI

The GitHub Action writes status, schema, doctor, plan, and dashboard artifacts. `strict: "off"` reports warnings without failing the job.

```yaml
- uses: soovwv/aienvmp@main
  with:
    write-status: "true"
    write-plan: "true"
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
