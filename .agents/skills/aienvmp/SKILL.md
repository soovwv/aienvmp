---
name: aienvmp
description: Use before changing runtimes, package managers, Docker settings, global packages, or environment policy in an AI coding workspace. Reads aienvmp context, prevents AI-driven version drift, records intent before environment changes, and records what changed afterward.
---

# aienvmp

Use `aienvmp` as the shared environment source of truth for this workspace.

The goal is to help multiple AI agents avoid silently installing or using different versions of Node, Python, Docker, package managers, or global tools.

## Preflight

Before environment-impacting work, run:

```bash
npx aienvmp context
```

If the output says `review-required`, do not change global runtimes, package managers, Docker settings, or global packages without asking the user.

For machine-readable context, use:

```bash
npx aienvmp context --json
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
- changing Docker daemon/context assumptions

## After Environment Changes

Refresh the environment map:

```bash
npx aienvmp sync
```

Record what changed:

```bash
npx aienvmp record --actor agent:codex --summary "<what changed>" --target "<tool-or-runtime>" --evidence "<command or file>"
```

Resolve the original intent if complete:

```bash
npx aienvmp resolve --actor agent:codex --id "<intent-id>"
```

## Safety Rules

- `aienvmp` warnings are non-blocking by default.
- Treat policy mismatches as review-required.
- Do not install, upgrade, downgrade, or remove global software unless the user explicitly asks.
- Prefer project-local version files and local environments.
- Do not use warnings as permission to interrupt production or shared workspace operations.
- Use `npx aienvmp doctor --ci` only in CI or explicit strict-mode automation.

## Normal Coding Work

For ordinary source edits that do not affect runtime versions, package managers, Docker settings, global packages, or environment policy, you do not need to record an intent.
