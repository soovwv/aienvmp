# aienvmp

`aienvmp` creates an AI-first environment map and lightweight runtime SBOM for shared development machines.

It gives multiple AI agents one shared environment protocol: read current env state, declare intent before global changes, record what changed, and keep humans informed through a lightweight dashboard.

## Quickstart

```bash
node bin/aienvmp.js init
node bin/aienvmp.js scan
node bin/aienvmp.js context
node bin/aienvmp.js intent --actor agent:codex --action "change Node version" --target node
node bin/aienvmp.js record --actor agent:codex --summary "updated .nvmrc to 24" --target node --before 20 --after 24 --evidence .nvmrc
node bin/aienvmp.js compile --agents all
node bin/aienvmp.js doctor
node bin/aienvmp.js dash
```

Generated files:

```text
.aienvmp/
  manifest.json
  timeline.jsonl
  intents.jsonl
  dashboard.html
AIENV.md
AGENTS.md
CLAUDE.md
GEMINI.md
```

## Commands

- `init`: create `.aienvmp/`
- `scan`: collect runtime/tooling versions and write `.aienvmp/manifest.json`
- `context`: print short AI preflight context
- `intent`: record a planned environment-impacting action
- `record`: append an agent/human environment change to the ledger
- `compile`: write `AIENV.md` and optionally inject agent files
- `diff`: compare current and previous manifests
- `doctor`: report environment warnings
- `dash`: generate `.aienvmp/dashboard.html`
