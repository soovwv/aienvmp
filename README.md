# aienvmp

[![CI](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml/badge.svg)](https://github.com/soovwv/aienvmp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

**aienvmp = AI Environment Map**

`aienvmp` is an AI-first environment map and change ledger for shared AI coding workspaces.

It helps multiple AI coding agents read the same runtime state, avoid installing or using conflicting software versions, declare environment-changing intent, record what changed, and keep humans informed through a lightweight dashboard.

It is intentionally small: use it beside SBOM scanners, vulnerability scanners, version managers, and CI systems.

## Why

Shared development machines drift.

One person upgrades Node. Another AI agent installs a global Python tool. A different agent assumes Docker is available. A third agent uses the wrong package manager because it did not see the project lockfile.

After a few sessions, nobody is quite sure which runtime is safe to use.

`aienvmp` is designed to prevent that kind of AI-driven version drift.

It is also designed to stay out of the operator's way. By default, `aienvmp` reports warnings and review-required states instead of taking locks, blocking commands, or changing the machine.

`aienvmp` turns that machine state into:

- `AIENV.md`: an AI-readable environment protocol
- `.aienvmp/manifest.json`: a lightweight runtime SBOM
- `.aienvmp/timeline.jsonl`: an append-only environment change ledger
- `.aienvmp/intents.jsonl`: planned and resolved environment-changing actions
- `.aienvmp/dashboard.html`: a small human-readable dashboard

## Core Idea

Before an AI changes the environment, it should know the environment.

Before an AI installs or uses a runtime, it should check the shared policy.

The policy is advisory by default. It should guide AI agents and humans, not unexpectedly interrupt production or shared workspace operations.

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
3. Do not install or switch to a different runtime version when it conflicts with `.aienvmp/policy.yml`.
4. Ask the user before changing global runtimes, global packages, Docker settings, or package managers.
5. Record planned environment changes with `aienvmp intent`.
6. After changes, run `aienvmp scan && aienvmp compile`.
7. Record what changed with `aienvmp record`.
8. Resolve the intent with `aienvmp resolve`.

Agent files can be injected automatically:

```bash
aienvmp compile --agents codex,claude,gemini
```

Generated agent targets:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`

Codex can also use the repo-scoped skill:

```text
.agents/skills/aienvmp/SKILL.md
```

Invoke it explicitly as `$aienvmp`, or let Codex select it when the task involves runtime, package manager, Docker, global package, or environment policy changes.

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
aienvmp doctor --ci
```

`doctor --ci` is the explicit strict path. Normal `doctor` output is advisory and exits successfully so it does not disrupt shared operations.

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

## Version Drift Prevention

The highest-priority use case is preventing multiple AI agents from installing or using different software versions in the same workspace.

`aienvmp` checks project hints and policy against the currently detected environment.

Example `.aienvmp/policy.yml`:

```yaml
node: 24
python: 3.11
packageManager: npm
globalInstalls: ask-first
runtimeChanges: ask-first
```

If an AI tries to use Node 22 when policy requires Node 24, `aienvmp doctor` and `aienvmp context` should surface that mismatch before work continues.

Example warning:

```text
.aienvmp/policy.yml requires node 24, but detected 22.11.0.
```

Normal commands remain non-blocking. Use CI/strict mode only when you explicitly want a warning to fail automation.

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

## GitHub Action

Use `aienvmp` in CI without making it disruptive by default:

```yaml
- uses: soovwv/aienvmp@main
  with:
    directory: "."
    agents: "codex,claude,gemini"
    strict: "false"
```

Set `strict: "true"` only when you want policy warnings to fail automation.

See [examples/github-action.yml](examples/github-action.yml).

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

## Why It Is Different

- **AI-first**: the primary consumer is an AI coding agent, not only a human operator.
- **Version drift prevention**: policy warnings are designed to stop agents from silently using different Node, Python, Docker, or package manager assumptions.
- **Change intent before change**: agents can declare intent before touching shared environment state.
- **Append-only ledger**: environment-impacting changes are recorded for the next agent.
- **Non-blocking operations**: normal warnings do not lock or break the machine; strict mode is opt-in.
- **Small surface area**: no daemon, no database, no hosted service required.

## Project Links

- [Roadmap](ROADMAP.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Status

This is an early prototype.

Good fit today:

- shared development servers
- AI coding workspaces
- local projects using Codex, Claude, Gemini, Cursor, or Copilot
- self-hosted runner experiments

Planned next:

- deeper policy enforcement
- deeper nvm/fnm/volta/pyenv/mise/asdf scans
- global npm, pipx, and uv tool inventory

See [ROADMAP.md](ROADMAP.md) for the longer plan.

## Development

```bash
node --test
npm pack --dry-run
npm run smoke
```

## License

Apache-2.0
