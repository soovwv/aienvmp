# Changelog

## 0.1.6

- Added optional `sync --deep` / `scan --deep` read-only global tool inventory.
- Kept the default scan lightweight while exposing deep inventory summaries to `AIENV.md`, `context`, `handoff`, and the dashboard.
- Added parsers for npm global packages, pipx tools, uv tools, and Homebrew package versions.

## 0.1.5

- Added machine-readable trust states for observed, planned, changed, review, verified, and stale environment facts.
- Added multi-agent intent conflict warnings for shared runtime/package manager targets.
- Added trust and schema context to `context`, `handoff`, `doctor`, `AIENV.md`, and the dashboard.
- Repositioned the docs around AI environment coordination instead of general AI project memory.

## 0.1.4

- Added `aienvmp handoff` for next-agent environment handoff summaries.
- Added an AI Handoff card to the dashboard.
- Added handoff test coverage.

## 0.1.3

- Strengthened the dashboard audit summary with AI decision, open intents, warnings, and recent changes.
- Added dashboard render coverage for the audit summary surface.

## 0.1.2

- Added `aienvmp sync` as the simple one-step command for init, scan, `AIENV.md`, manifest, ledger, and dashboard generation.
- Improved AI preflight context with an explicit next action.
- Repositioned AGENTS.md integration as an optional snippet instead of default file generation.
- Added machine-readable sync/context improvements for AI and CI integrations.
- Simplified README for faster first-time understanding.
- Kept AGENTS.md, CLAUDE.md, and GEMINI.md integration explicit through `aienvmp snippet`.
- Added troubleshooting and bugfix logs for operational issue tracking.

## 0.1.1

- Added repo-scoped Codex skill wrapper.
- Normalized npm package metadata and published the initial npm package.

## 0.1.0

- Initial AI-first env map prototype.
- Added scan, context, intent, record, compile, doctor, diff, and dash commands.
- Added `AIENV.md`, agent file injection, append-only timeline, and lightweight dashboard output.
