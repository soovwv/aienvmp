# aienvmp

**aienvmp = AI Environment Map**

`aienvmp` is an AI-first environment map and change ledger for shared development machines.

It helps multiple AI coding agents read the same runtime state, declare environment-changing intent, record what changed, and keep humans informed through a lightweight dashboard.

## Why

Shared development machines drift.

One person upgrades Node. Another AI agent installs a global Python tool. A different agent assumes Docker is available. After a few sessions, nobody is quite sure which runtime is safe to use.

`aienvmp` turns that machine state into:

- `AIENV.md`: an AI-readable environment protocol
- `.aienvmp/manifest.json`: a lightweight runtime SBOM
- `.aienvmp/timeline.jsonl`: an append-only environment change ledger
- `.aienvmp/intents.jsonl`: planned and resolved environment-changing actions
- `.aienvmp/dashboard.html`: a small human-readable dashboard

## Core Idea

Before an AI changes the environment, it should know the environment.

```bash
aienvmp context
aienvmp intent --actor agent:codex --action "install pnpm" --target pnpm
# make the change
aienvmp scan
aienvmp compile
aienvmp record --actor agent:codex --summary "installed pnpm" --target pnpm --evidence "pnpm --version"
aienvmp resolve --actor human:you --id int_abc123
```

## Quickstart

Install with npm:

```bash
npm install -g aienvmp
```

Or run without installing:

```bash
npx aienvmp init
npx aienvmp scan
npx aienvmp context
npx aienvmp compile --agents all
npx aienvmp dash
```

Run locally from this repository while developing:

```bash
node bin/aienvmp.js init
node bin/aienvmp.js scan
node bin/aienvmp.js context
node bin/aienvmp.js compile --agents all
node bin/aienvmp.js dash
```

Try the included sample app:

```bash
node bin/aienvmp.js scan --dir sample-app
node bin/aienvmp.js context --dir sample-app
node bin/aienvmp.js dash --dir sample-app
```

## AI Agent Workflow

1. Read `AIENV.md` or run `aienvmp context`.
2. Prefer project-local version files such as `.nvmrc`, `.python-version`, `mise.toml`, and `.tool-versions`.
3. Ask the user before changing global runtimes, global packages, Docker settings, or package managers.
4. Record planned environment changes with `aienvmp intent`.
5. After changes, run `aienvmp scan && aienvmp compile`.
6. Record what changed with `aienvmp record`.
7. Resolve the intent with `aienvmp resolve`.

Agent files can be injected automatically:

```bash
aienvmp compile --agents codex,claude,gemini
```

Generated agent targets:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`

## What AI Agents See

`aienvmp context` returns a compact preflight brief:

```text
# AI Preflight Context

Status: clear
Node: 24.14.1
Python: 3.11.0
Docker: available

Must follow:
- Ask the user before global runtime, package manager, Docker, or global package changes.
- Prefer project-local version files and local environments.
- Before planned env changes, run `aienvmp intent --actor <agent:id> --action <planned-change>`.
- After env changes, run `aienvmp scan && aienvmp compile`.
- Then run `aienvmp record --actor <agent:id> --summary <what-changed>`.
```

For tool integrations:

```bash
aienvmp context --json
aienvmp doctor --json
```

## Commands

| Command | Purpose |
| --- | --- |
| `init` | Create `.aienvmp/` |
| `scan` | Collect runtime/tooling versions and write `.aienvmp/manifest.json` |
| `context` | Print short AI preflight context |
| `intent` | Record a planned environment-impacting action |
| `resolve` | Mark an intent as resolved or cancelled |
| `record` | Append an agent/human environment change to the ledger |
| `compile` | Write `AIENV.md` and optionally inject agent files |
| `diff` | Compare current and previous manifests |
| `doctor` | Report environment warnings |
| `dash` | Generate `.aienvmp/dashboard.html` |

Intent IDs are short and prefix-matchable, so `aienvmp resolve --id int_mabc` works when it matches one open intent.

## What It Scans Today

- OS: platform, release, arch, hostname, shell
- Runtimes: Node.js, Python, Go, Java, Rust
- Package managers and version managers: npm, pnpm, yarn, uv, pip, pipx, mise, asdf, pyenv, nvm, fnm, volta
- Containers: Docker and Docker Compose
- Project hints: `.nvmrc`, `.python-version`, `mise.toml`, `.tool-versions`, lockfiles, `package.json`, `pyproject.toml`, `Dockerfile`
- Agent integration files: Codex, Claude, Gemini, Cursor, Copilot targets

## Output Layout

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

## Dashboard

The dashboard is a static HTML file. It is derived from the manifest, warnings, intents, and ledger.

```bash
aienvmp dash
```

Open:

```text
.aienvmp/dashboard.html
```

## How This Differs From SBOM Tools

`aienvmp` is not trying to replace full SBOM or security scanners.

Tools like Syft, Trivy, Dependency-Track, and osquery are excellent for component inventory, vulnerability scanning, and system instrumentation.

`aienvmp` focuses on a narrower AI workflow:

- What environment should this AI agent assume?
- What must it avoid changing globally?
- What changed recently?
- Which agent planned or performed the change?
- What should the next agent read before continuing?

Think of it as an **AI coordination layer over a lightweight runtime SBOM**.

## Status

This is an early prototype.

Good fit today:

- shared development servers
- AI coding workspaces
- local projects using Codex, Claude, Gemini, Cursor, or Copilot
- self-hosted runner experiments

Planned next:

- intent resolve/close workflow
- `policy.yml` enforcement
- deeper nvm/fnm/volta/pyenv/mise/asdf scans
- global npm, pipx, and uv tool inventory
- CI mode with non-zero exit codes

## Development

```bash
node --test
npm pack --dry-run
npm run smoke
```

## License

Apache-2.0
