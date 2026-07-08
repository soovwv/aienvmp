# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI workspace coordination for shared development environments.**

`aienvmp` gives Codex, Claude, Gemini, and humans one lightweight env map before different AI agents install or use conflicting runtimes, dependencies, package managers, Docker, or global tools.

Use it on shared servers, repos, laptops, or CI workspaces where multiple people or AI agents need the same environment truth without heavy locks.

```bash
npx aienvmp onboard
npx aienvmp status
```

`onboard` installs tiny pointers in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`, refreshes the artifacts, and tells AI agents to read `.aienvmp/status.json` first.
Its output and pointers include the same session-start rule: read status before environment work, sync only when stale or missing, and keep local coding advisory.
Optional Cursor and Copilot pointers are available with `npx aienvmp onboard --agents cursor,copilot`.

## Why

- stop AI agents from silently using different environment assumptions
- give every AI the same env map, light SBOM, intent log, and timeline
- show humans the same state in a lightweight dashboard
- stay advisory by default; use strict only when requested

`aienvmp` is not a heavy lock manager or full SBOM scanner. It is a lightweight AI coordination layer that can later consume deeper scanner output when you opt in.

## 10-Second Use

```bash
npx aienvmp onboard
npx aienvmp status
npx aienvmp context --json
npx aienvmp handoff
```

Run `sync` later when you only need to refresh artifacts without touching instruction-file pointers.

Try the multi-agent conflict demo without touching your workspace:

```bash
npx aienvmp demo
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
- `schema --json` exposes `schemaVersion`, `contractVersion`, and compatibility rules for AI consumers.
- `schema --json` also exposes `releaseGate` so AI/CI can see the batched manual publish rule.
- `schema --json` exposes `releaseReadiness` so AI/CI can check the `0.2.0` stable-contract gate.
- `summary.md` and the dashboard mirror `releaseReadiness` so humans see the same batched-release gate.
- After `0.2.0`, documented JSON fields stay backward-compatible; new fields are additive.
- `aiSession` gives AI one short per-session routine: status, stale refresh, intent, checkpoint, and handoff.
- `aiBootstrap` gives AI the shortest read-first, next-command, and local-mode hint.
- `aiBootstrap` also explains the next command source and reason.
- `artifactFreshness` tells AI whether `.aienvmp/status.json` is fresh or should be refreshed with `aienvmp sync`.
- `summary.md` and the dashboard mirror `artifactFreshness` so humans and Markdown-first agents see the same refresh hint.
- `AIENV.md`, `summary.md`, and `plan.md` start with the same bootstrap hint for Markdown-first agents.
- `sbom.json` and CycloneDX-lite properties include the same bootstrap hint for dependency and security review loops.
- `maintenanceLoop` gives AI the recurring env-management loop.
- `sbomRisk`, `sbomReview`, and `sbom.json.aiReviewPlan` connect light SBOM risk to safe dependency-change steps.
- `collaboration`, `coordination`, and `agentActivity` show multi-agent conflicts and shared targets.
- `agentPointers.discovery` tells AI whether Codex, Claude, and Gemini instruction files can discover `aienvmp`; optional Cursor/Copilot pointers are opt-in.
- `agentDiscovery.sessionStart` documents the same startup rule for schema-only AI/CI consumers.
- `demo` tells AI and users how to verify the multi-agent conflict scenario in a temporary workspace.
- The packaged `aienvmp` skill points AI agents to `onboard`, `artifactFreshness`, and `demo`.
- `enforcement.policy` summarizes local, CI, and release gates: local is warn-only, CI uses the recommended strict scope, release uses `strict all`.
- `strictRecommendation` gives AI one compact local/CI/release strict decision while preserving local warn-only behavior.
- `summary.md` and the dashboard mirror `strictRecommendation` so humans see the same local/CI/release gate split.
- `strictDecision` separates local warn-only checks from optional CI strict gates.
- `status --json`, `context --json`, `handoff --json`, and `doctor --json` include `nextSafeCommand` for one advisory next step.
- The dashboard mirrors `aiBootstrap` so humans and AI see the same first-read and next-command hint.
- `schema --json` prints the stable machine-readable contract without scanning.

## Agent Files

`aienvmp` does not replace AGENTS.md, CLAUDE.md, or GEMINI.md. It gives them a live environment source of truth.

```bash
npx aienvmp onboard
npx aienvmp snippet codex
npx aienvmp snippet agents
npx aienvmp snippet claude
npx aienvmp snippet gemini
npx aienvmp onboard --agents cursor,copilot
```

Snippets point each AI to `status`, `summary.md`, `context --json`, intent, and checkpoint without taking over the instruction file.
`sync` records whether those pointers are installed, and `doctor` can recommend installing one without blocking local work.
`status`, `context --json`, and `doctor --json` expose the same `agentPointers` summary for AI consumers.

## Commands

```bash
aienvmp sync                    # update env map, status, summary, SBOM, dashboard
aienvmp onboard                 # install Codex/Claude/Gemini pointers and sync
aienvmp onboard --agents cursor,copilot
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

Recommended gates:

```bash
npx aienvmp doctor --json                 # local, warn-only
npx aienvmp doctor --strict policy --json # CI, scoped when policy drift is relevant
npx aienvmp doctor --strict all --json    # release, full gate
```

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

## Release Policy

- `0.1.x` is the prototype history for fast AI-contract validation.
- `0.2.x` starts the stabilized AI workspace contract.
- npm releases are manually gated and batched around meaningful changes, with security fixes as the exception.
- Run `npm run release:check` before publishing; the GitHub `Release` workflow runs the same gate.
- `schema --json` exposes the same `releaseGate` rule for AI/CI consumers.
- `schema --json` exposes `releaseReadiness.requiredBeforeStable` for the `0.2.0` checklist.
- The `0.2.0` checklist includes README, npm metadata, and CLI help positioning so the package tells one story.
- Manual publish runs from GitHub Actions `Release` workflow and requires the `NPM_TOKEN` secret.
- `0.1.x` is deprecated only after `0.2.0` is published, with a message that points users to the stable contract.
- Broken or superseded versions are deprecated instead of unpublished.

Post-`0.2.0` deprecation command:

```bash
npm deprecate 'aienvmp@<0.2.0' 'Prototype history: use aienvmp@0.2.0 or newer for the stabilized AI workspace contract.'
```

## Development

```bash
node --test
npm run smoke
npm run demo:conflict
npx aienvmp demo
npm run release:check
npm pack --dry-run
```

[Roadmap](ROADMAP.md) / [Security](SECURITY.md) / [Troubleshooting](TROUBLESHOOTING.md) / [Bugfix Log](BUGFIXES.md) / [Contributing](CONTRIBUTING.md)

[Multi-agent conflict demo](examples/multi-agent-conflict.md)

Apache-2.0
