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

### Advisory doctor behavior needed clearer verification

- Issue: `doctor` warnings can look like failures to AI/CI consumers even though local operation should stay non-blocking by default.
- Fix: `doctor --json` now exposes `exitBehavior`, and enforcement gate metadata explains when strict mode sets a failure exit code.
- Verification: Windows and macOS candidate smoke checks confirmed default `doctor --json` exits successfully while `doctor --strict policy --json` fails on matching policy warnings.

### Record follow-up loop needed platform verification

- Issue: dependency/security records need to guide the next AI back through sync, status, and handoff without forcing operations.
- Fix: `record` timeline entries now include follow-up metadata, and status/context/dashboard surface unresolved follow-ups.
- Verification: Windows and macOS candidate smoke checks confirmed `record --target dependency` appears in `status --json` followUps and the dashboard Follow-ups card.

### Multi-agent records were less visible than open intents

- Issue: open intents showed planning conflicts, but two agents could record changes to the same env target after a handoff without a compact coordination signal.
- Fix: `doctor`, status/context, handoff, and the dashboard now expose same-target multi-agent records through advisory warnings and `agentActivity`.
- Verification: tests cover multi-agent record detection, later handoff reset, status JSON, handoff text, dashboard HTML, and recommended actions.

### Post-change loop was too many commands for routine AI handoff

- Issue: after an environment change, agents had to remember separate record, sync, status, and handoff commands.
- Fix: `aienvmp checkpoint` now performs the post-change loop and records an explicit sync ledger entry so follow-ups can be closed.
- Verification: checkpoint tests cover text/JSON output, status artifact refresh, timeline entries, handoff recording, and cleared follow-ups.

### Light SBOM risk required too much parsing

- Issue: AI consumers could see package and vulnerability details, but had to infer risk level and next commands from several nested fields.
- Fix: `lightSbom.riskSummary` and preflight `sbomRisk` now provide a compact risk score, signals, review targets, and advisory next steps.
- Verification: tests cover risk scoring, top-risk severity fallback, scanner-off guidance, status/context exposure, dashboard rendering, and recommended actions.

### Light SBOM was only nested inside larger artifacts

- Issue: CI tools and AI agents that only need dependency/SBOM context had to read the full manifest or context payload.
- Fix: `aienvmp sbom --json` and `.aienvmp/sbom.json` now expose a standalone light SBOM artifact.
- Verification: tests cover standalone SBOM construction, writing, sync output, schema metadata, and dashboard linking.

### Light SBOM needed a lightweight standard export

- Issue: the standalone SBOM was AI-friendly, but less convenient for tools expecting CycloneDX-shaped data.
- Fix: `aienvmp sbom --format cyclonedx-lite` and `.aienvmp/sbom.cdx.json` now export project-manifest packages in a CycloneDX-compatible shape with explicit limitations.
- Verification: tests cover component mapping, vulnerability hints, sync output, schema metadata, and dashboard links.

### CI example did not surface SBOM artifacts clearly

- Issue: sync could generate SBOM artifacts, but the GitHub Action and example upload list did not make them explicit.
- Fix: the Action now has `write-sbom` and the example uploads both native and CycloneDX-lite SBOM artifacts.
- Verification: Action tests cover input metadata, SBOM write commands, and example artifact paths.

### CI and AI review still needed a short handoff view

- Issue: `status.json` was AI-friendly, but GitHub Actions and quick human review still required opening JSON artifacts or the dashboard.
- Fix: `aienvmp summary` now writes `.aienvmp/summary.md`, `sync` creates it by default, and the GitHub Action appends it to `GITHUB_STEP_SUMMARY`.
- Verification: tests cover summary rendering, sync artifact creation, schema metadata, Action wiring, and example upload paths.

### Windows-created JSON files could be missed

- Issue: UTF-8 BOM JSON files created by some Windows tools could fail JSON parsing and make dependency snapshots look empty.
- Fix: `readJson` now strips a leading UTF-8 BOM before parsing.
- Verification: regression tests cover BOM JSON parsing and Windows smoke testing confirmed dependency counts in `summary.md`.

### Agent instructions lagged behind the current protocol

- Issue: packaged skill and pointer snippets still emphasized older context/record flows and did not direct agents to `summary.md`.
- Fix: snippets and the Codex skill now use the current status, summary, context, intent, and checkpoint flow with agent-specific actor examples.
- Verification: regression tests cover snippet output for AGENTS.md, Claude, and Gemini, and summary/status tests cover the read order and dependency protocol.

## Template

### Title

- Issue:
- Fix:
- Verification:
- Follow-up:
