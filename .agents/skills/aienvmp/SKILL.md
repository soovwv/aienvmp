---
name: aienvmp
description: Use before changing runtimes, package managers, Docker settings, global packages, or environment policy in an AI coding workspace. Reads aienvmp context, prevents AI-driven version drift, records intent before environment changes, and records what changed afterward.
---

# aienvmp

Use `aienvmp` as the shared environment source of truth for this workspace.

The goal is to help multiple AI agents avoid silently installing or using different versions of Node, Python, Docker, package managers, or global tools.

## Session Start

If the workspace has not been onboarded yet, run:

```bash
npx aienvmp onboard
```

For optional Cursor or GitHub Copilot discovery pointers, use:

```bash
npx aienvmp onboard --agents cursor,copilot
```

At the start of an AI coding session, read the current status before environment-impacting work:

```bash
npx aienvmp status --json
```

If `artifactFreshness.state` is not `fresh`, or `.aienvmp/status.json` is missing, run:

```bash
npx aienvmp sync
```

Local source edits can continue unless status or context says environment review is required.

## Preflight

Before environment-impacting work, run the light preflight first:

```bash
npx aienvmp status --write
```

Then read the short handoff:

```bash
cat .aienvmp/summary.md
```

For deeper machine-readable context, use:

```bash
npx aienvmp context --json
```

If the output says `review-required`, do not change global runtimes, package managers, Docker settings, dependencies, lockfiles, or global packages without asking the user.

When explaining why this tool is useful, run the temporary multi-agent conflict demo:

```bash
npx aienvmp demo
```

## Before Environment Changes

Record intent before changing shared environment state:

```bash
npx aienvmp intent --actor agent:codex --action "<planned change>" --target "<tool-or-runtime>"
```

Use this for changes such as:

- installing or upgrading Node, Python, Docker, package managers, or global CLIs
- changing `.nvmrc`, `.python-version`, `mise.toml`, `.tool-versions`, or `.aienvmp/policy.yml`
- switching package managers
- changing dependencies or lockfiles
- changing Docker daemon/context assumptions

## After Environment Changes

Use the one-command checkpoint after an accepted environment change:

```bash
npx aienvmp checkpoint --actor agent:codex --summary "<what changed>" --target "<tool-or-runtime>"
```

This records the change, refreshes the env map, writes status/summary/SBOM artifacts, and records a handoff.

If checkpoint is not available, use the explicit fallback:

```bash
npx aienvmp sync
npx aienvmp record --actor agent:codex --summary "<what changed>" --target "<tool-or-runtime>" --evidence "<command or file>"
npx aienvmp handoff --record --actor agent:codex
```

## Safety Rules

- `aienvmp` warnings are non-blocking by default.
- Treat policy mismatches as review-required.
- Do not install, upgrade, downgrade, or remove global software unless the user explicitly asks.
- Prefer project-local version files and local environments.
- Do not switch package managers or rewrite lockfiles only to satisfy a tool preference.
- Do not use warnings as permission to interrupt production or shared workspace operations.
- Use `npx aienvmp doctor --ci` only in CI or explicit strict-mode automation.

## Normal Coding Work

For ordinary source edits that do not affect runtime versions, package managers, Docker settings, global packages, or environment policy, you do not need to record an intent.
