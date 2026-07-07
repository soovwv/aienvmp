# Roadmap

`aienvmp` focuses on AI coding workspace operations: helping multiple AI agents avoid runtime/version drift while keeping humans in control.

## Near Term

- Strengthen trust states: observed, planned, changed, review, verified, stale
- Detect multi-agent environment intent conflicts
- Keep one advisory decision engine with optional strict enforcement
- Stabilize `.aienvmp/manifest.json` and JSON command schemas
- Keep `sync`, `context`, and `handoff` as the simple core flow
- Improve the dashboard for 10-second human review

## Next

- Deeper runtime discovery:
  - nvm, fnm, volta
  - pyenv, uv, conda
  - mise, asdf
- Global tool inventory:
  - richer summaries for `npm -g`, `pipx list`, `uv tool list`, and Homebrew
  - optional `--deep` scanners for more toolchains
- Conflict detection:
  - package manager policy vs lockfile mismatch
  - monorepo/project boundary aware intent targets
- CI mode:
  - stable exit codes
  - GitHub Action example

## Later

- CycloneDX/SPDX export
- Optional Syft/Trivy integration
- Team dashboard mode
- Signed/attested environment snapshots
- Policy presets for common AI coding workspaces

## Non-goals

- Replacing full SBOM generators
- Replacing vulnerability scanners
- Taking hard locks on shared machines by default
- Installing or modifying runtime versions automatically
