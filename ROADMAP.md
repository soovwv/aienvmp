# Roadmap

`aienvmp` focuses on AI coding workspace operations: helping multiple AI agents avoid runtime/version drift while keeping humans in control.

## Near Term

- Policy checks for Node, Python, and package manager drift
- Intent lifecycle: open, resolve, cancel
- JSON output for AI/tool integrations
- Non-blocking by default, strict only with `--ci`
- Dashboard improvements for policy and agent coordination

## Next

- Deeper runtime discovery:
  - nvm, fnm, volta
  - pyenv, uv, conda
  - mise, asdf
- Global tool inventory:
  - `npm -g`
  - `pipx list`
  - `uv tool list`
- Conflict detection:
  - multiple open intents for the same target
  - stale unresolved intents
  - package manager policy vs lockfile mismatch
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
