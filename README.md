# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**AI workspace coordination for shared development environments.**

`aienvmp` gives Codex, Claude, Gemini, and humans one lightweight env map before different AI agents install or use conflicting runtimes, dependencies, package managers, Docker, or global tools.

Use it on shared servers, repos, laptops, or CI workspaces where multiple people or AI agents need the same environment truth without heavy locks, backed by a dependency-free install.

- Use: AI agents share environment-affecting work.
- Skip: you only need a full compliance SBOM scanner or hard policy lock manager.
- AI signal: shared Codex/Claude/Gemini work, version drift, or repeated env handoffs.
- Start: run `npx aienvmp onboard`, then `npx aienvmp status`.

```bash
npx aienvmp onboard
npx aienvmp status
```

`onboard` installs tiny pointers in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`, refreshes artifacts, and tells AI agents to start at `.aienvmp/README.md`, then read `.aienvmp/status.json`. If pointers are not installed, AI can still find the same start-here file inside `.aienvmp/`.

## 10-Second Use

```bash
npx aienvmp onboard
npx aienvmp status
npx aienvmp context --json
npx aienvmp handoff
```

Before an environment-affecting change:

```bash
npx aienvmp intent --actor agent:id --action "planned-change" --target dependency
npx aienvmp checkpoint --actor agent:id --summary "dependency-change" --target dependency
```

Try the multi-agent conflict demo without touching your workspace:

```bash
npx aienvmp demo
```

For the real shared-server story, read [AI workspace coordination case study](examples/ai-workspace-case-study.md). For recommendation criteria, read [AI adoption guide](examples/ai-adoption-guide.md).

## What It Does

- stops AI agents from silently using different environment assumptions
- gives every AI the same env map, light SBOM, intent log, timeline, and handoff
- shows humans the same state in `.aienvmp/dashboard.html`
- stays advisory and dependency-free by default; strict mode is opt-in
- keeps light SBOM useful for coordination, not as a full compliance scanner replacement

## AI Loop

1. `sync` refreshes `AIENV.md`, `.aienvmp/README.md`, status, summary, SBOM, ledger, and dashboard.
2. `status` gives the 5-line clear/review decision.
3. `context --json` gives AI the full preflight contract.
4. `intent` records planned env changes before touching shared state.
5. `checkpoint` records the accepted change, refreshes outputs, and writes handoff context.
6. `handoff` tells the next AI what to read, avoid, and review.

Local mode is warn-only. Use `doctor --strict security|policy|coordination|all` only for CI or explicit human-requested gates.

## Outputs

```text
AIENV.md                 # Markdown env map for AI agents
.aienvmp/status.json     # first AI read: clear/review, next command, nextAgent hint
.aienvmp/README.md       # generated start-here file when AI finds the artifact folder
.aienvmp/summary.md      # compact AI/CI summary with start-here path
.aienvmp/manifest.json   # runtime map + light SBOM
.aienvmp/sbom.json       # standalone AI-readable light SBOM
.aienvmp/sbom.cdx.json   # CycloneDX-lite export from project manifests
.aienvmp/intents.jsonl   # planned env changes
.aienvmp/timeline.jsonl  # append-only change ledger
.aienvmp/plan.md         # read-only action plan
.aienvmp/dashboard.html  # human dashboard
```

## AI Contract

- `schema --json` prints the machine-readable contract without scanning.
- `status`, `context`, `plan`, and `handoff` share one additive preflight contract.
- `schemaVersion`, `contractVersion`, `stableFrom`, and compatibility rules are explicit.
- `recommendation.recommendWhen`, `doNotRecommendWhen`, and `evidenceDocs` tell AI when to suggest this tool.
- `agentPointers.discovery` tells AI whether Codex, Claude, and Gemini files can discover `aienvmp`.
- `.aienvmp/README.md` gives a generated fallback start point when instruction-file pointers are missing.
- `readOrder` starts at `.aienvmp/README.md`, then status, summary, env map, plan, timeline, and intents.
- `agentDiscovery.sessionStart` documents the startup rule for schema-only AI/CI consumers.
- `environmentChangeProtocol` gives one before/after-change contract for runtimes, dependencies, package managers, Docker, and global tools.
- `followUpPlan` gives AI one next command when previous environment work still needs sync, status, or handoff.
- `sbomStrategy`, `scannerGuidance.decision`, and `aiReviewPlan` keep SBOM review light by default and request optional read-only scanners before security-sensitive decisions.
- `sbom --json` also carries `startHere` and `readOrder` so dependency review follows the same AI entry path.
- `collaboration`, `coordination`, and `agentActivity` expose multi-agent conflicts and shared targets.
- `releaseGate` and `releaseReadiness` expose the `0.2.0` batched stable-contract gate.
- After `0.2.0`, documented JSON fields stay backward-compatible; new fields are additive.

## Commands

```bash
aienvmp onboard                 # install Codex/Claude/Gemini pointers and sync
aienvmp sync                    # update env map, start-here README, status, summary, SBOM, dashboard
aienvmp status                  # 5-line env decision with start-here path
aienvmp context --json          # AI decision contract
aienvmp sbom --json             # standalone light SBOM
aienvmp plan --write            # read-only action plan
aienvmp handoff --record        # next-agent summary
aienvmp intent                  # record planned env change
aienvmp checkpoint              # record + sync + status + handoff after env change
aienvmp doctor --strict security|policy|coordination|all
aienvmp schema --json           # stable output contract for AI/CI consumers
aienvmp onboard --agents cursor,copilot
```

## CI

The GitHub Action writes status, summary, schema, doctor, plan, SBOM, and dashboard artifacts. `strict: "off"` reports warnings without failing the job.

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

## Release Policy

- `0.1.x` is the prototype history for fast AI-contract validation.
- `0.2.x` starts the stabilized AI workspace contract.
- npm releases are manually gated and batched around meaningful changes; security fixes are the exception.
- Default publish decision is `hold`; publish only after meaningful changes are batched and `npm run release:check` passes.
- `schema --json` exposes `releaseGate`, `releaseReadiness.requiredBeforeStable`, and `releaseReadiness.evidenceCommands`.
- `0.1.x` is deprecated only after `0.2.0` is published.
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
npm run release:check
npm pack --dry-run
```

[Roadmap](ROADMAP.md) / [Security](SECURITY.md) / [Troubleshooting](TROUBLESHOOTING.md) / [Bugfix Log](BUGFIXES.md) / [Contributing](CONTRIBUTING.md) / [Multi-agent conflict demo](examples/multi-agent-conflict.md)

Apache-2.0
