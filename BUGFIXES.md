# Bugfix Log

Short record of bugs, fixes, and follow-up checks.

## 2026-07-08

### CLI version was hardcoded

- Issue: `npm run smoke` printed `0.1.0` after the package version changed.
- Fix: CLI now reads the version from `package.json`.
- Verification: `npm run smoke` prints the package version.

### AGENTS.md default generation conflicted with product focus

- Issue: default agent instruction file generation made `aienvmp` look like an AGENTS.md generator.
- Fix: `sync` now focuses on `AIENV.md`, manifest, intent log, timeline, and dashboard. Agent instruction integration is explicit through `aienvmp snippet`.
- Verification: `node --test` confirms `sync` does not create `AGENTS.md` by default and `snippet --write` only updates the marker block.

### npm publish metadata appeared stale

- Issue: npm publish returned success for `0.1.2`, but `npm view aienvmp version` briefly returned `0.1.1`.
- Fix: verified with `npm view aienvmp versions --json` and `npm dist-tag ls aienvmp`; registry later reported `0.1.2`.
- Verification: `npm view aienvmp version` returns `0.1.2`.

### macOS SSH PATH did not expose Node/npm

- Issue: remote macOS non-interactive SSH command did not find `node` or `npm`.
- Fix: test command used `/bin/zsh -lc` to load login shell PATH.
- Verification: remote test detected Node `v25.3.0`, npm `11.11.0`, and completed `aienvmp sync`.

### Security summaries lacked remediation hints

- Issue: AI agents could see vulnerable package names but not enough bounded detail to plan the next dependency update.
- Fix: npm and Python security summaries now include fix versions and advisory references when scanners provide them.
- Verification: parser tests cover npm remediation objects and pip-audit advisory ids; Windows and macOS tarball tests completed `sync --security`.

## Template

### Title

- Issue:
- Fix:
- Verification:
- Follow-up:
