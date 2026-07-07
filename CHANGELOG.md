# Changelog

## Unreleased

- Added preflight contract metadata so AI and CI consumers can rely on stable entry fields while ignoring additive changes.
- Added `aienvmp schema --json` to print the stable AI-readable output contract without scanning a workspace.
- Exposed coordination summaries at the root of `context --json` and `handoff --json`, with a human-readable handoff section.

## 0.1.40

- Added dependency handoff summaries so the next AI receives dependency read-set and protocol guidance directly in `handoff`.
- Added a compact `nextAgent` hint to status/preflight JSON for safer AI-to-AI continuation.
- Added target-level open intent coordination summaries so agents can detect dependency conflicts without parsing logs.
- Shortened the README around the 10-second AI flow, generated outputs, and advisory contract.
- Updated the dashboard handoff card with next-agent read hints, dependency files, and conflict targets.
- Printed the next-agent handoff command in the plain `status` output.

## 0.1.39

- Added a dependency read set to preflight, `AIENV.md`, and the dashboard so agents know which manifests and lockfiles to read before package or security changes.
- Added an advisory dependency change protocol so agents follow the same intent, refresh, record, and handoff flow for package/security edits.
- Surfaced the dependency change protocol in `plan.md` so human-readable plans match the AI preflight contract.
- Pointed security remediation recommendations at the dependency intent workflow instead of a generic context read.
- Treated dependency records and package/security intents as coordination signals for stale handoff and multi-agent conflict warnings.
- Added CLI regression coverage for `context --dir <workspace> --json` so remote and CI agents can safely inspect another workspace.
- Allowed `--dir <workspace>` before the command, so AI and CI agents can use either global-style or command-style workspace targeting.

## 0.1.38

- Added a 10-second AI quickstart flow to the shared preflight contract and status output.
- Added preflight intent target recommendations so agents can record runtime, package manager, dependency, Docker, or coordination changes consistently.
- Surfaced AI intent target recommendations in the dashboard so humans can review the same target guidance.
- Added the same quickstart and intent target guidance to `AIENV.md` so Markdown-first agents receive the current preflight.
- Aligned AGENTS/Claude/Gemini pointer snippets with the same status-first, target-aware AI flow.

## 0.1.37

- Added `lightSbom` to the manifest as an AI-ready package and vulnerability summary.
- Linked dependency manifests, ecosystem/group counts, vulnerable direct dependencies, and top risk packages into one compact SBOM view.
- Surfaced dependency change hints in AI-facing outputs and the dashboard so agents and humans can identify relevant manifests before edits.
- Added read-only lockfile awareness to dependency snapshots and light SBOM hints.
- Added package manager policy hints from lockfiles to reduce accidental npm/pnpm/yarn drift.

## 0.1.36

- Added an explicit enforcement profile to the shared AI preflight contract.
- Surfaced advisory-by-default vs optional strict mode in the dashboard.
- Clarified that strict checks are intended for CI or explicit human-requested gates, not default local blocking.

## 0.1.35

- Added a shared AI preflight contract across status, context, plan, and handoff outputs.
- Reused the same artifact map, read order, safe commands, decision, and enforcement guidance across AI-facing JSON.
- Reduced drift risk between multi-agent handoffs and environment planning.

## 0.1.34

- Added AI navigation metadata to `.aienvmp/status.json`.
- Included artifact paths, read order, safe commands, and agent-use rules in the compact status output.
- Kept the status enhancement read-only and lightweight so `sync` remains the simple default flow.

## 0.1.33

- Made `.aienvmp/status.json` a first-class artifact written by `aienvmp sync`.
- Added `aienvmp status --write` so AI agents and CI can refresh the compact state file directly.
- Updated the GitHub Action to use the built-in status writer instead of shell redirection.

## 0.1.32

- Added GitHub Action support for writing `.aienvmp/status.json` by default.
- Added a `write-status` action input so CI can keep compact AI status artifacts optional.
- Updated the GitHub Action example artifact list to include the status output.

## 0.1.31

- Added `aienvmp status` as a compact human and AI entrypoint.
- Summarized clear/review state, next command, counts, top action, and enforcement advice in one output.
- Kept `context --json` as the richer preflight while making first checks simpler.

## 0.1.30

- Added shared enforcement advice for AI and CI surfaces.
- Exposed advisory-by-default behavior, suggested strict scopes, and scoped CI commands in context and plan outputs.
- Moved strict scope logic into a reusable enforcement module while keeping existing `doctor --strict` behavior compatible.

## 0.1.29

- Added lightweight remediation priority scoring for vulnerable packages.
- Exposed priority level, score, and reasons in security summaries, plans, compact context, and dashboard rows.
- Kept scoring advisory-only so AI agents can choose safer next steps without blocking local operation.

## 0.1.28

- Linked vulnerable package summaries to the dependency snapshot when the package is directly declared.
- Added direct dependency metadata to remediation steps and dashboard security rows.
- Kept the linkage read-only and file-based so security context stays lightweight and non-disruptive.

## 0.1.27

- Added a read-only dependency snapshot to the manifest, context, AIENV.md, and dashboard.
- Captured npm and Python project dependencies from `package.json`, `requirements.txt`, and `pyproject.toml` without installing or resolving packages.
- Linked the env map and light SBOM story so AI agents can see runtime, dependency, and vulnerability context together.

## 0.1.26

- Shared one AI decision contract across `context --json`, `plan`, and `handoff`.
- Added decision mode and required command guidance to plan and handoff outputs.
- Reduced duplicated guidance so multiple AI agents receive the same environment-change rules.

## 0.1.25

- Added a more explicit AI decision contract to `context --json`.
- Included project-local work allowance, environment-change review state, warning codes, and required follow-up commands.
- Clarified that local project work can continue while environment changes remain intent-gated and review-oriented.

## 0.1.24

- Added a dashboard CI Readiness card for `doctor --strict security|policy|coordination|all`.
- Reused the same non-blocking warning engine so humans can pick CI enforcement scope without changing local operation.
- Surfaced matched warning codes per strict scope for faster AI and human review.

## 0.1.23

- Added compact `stepSummary` output to `context --json`.
- Reused the AI plan step model so preflight context can show remediation and environment drift summaries.
- Kept full step details in `aienvmp plan` while keeping context lightweight.

## 0.1.22

- Reworked the README around Quick Start, AI Usage, CI Usage, and outputs.
- Made the project positioning clearer: AI-first environment maps for shared coding machines.
- Emphasized read-only planning and avoiding runtime/tool drift across agents.

## 0.1.21

- Added a GitHub Actions artifact upload example for `AIENV.md`, plan outputs, manifest, and dashboard.
- Added a short README CI pointer to the example workflow.
- Kept the core composite action lightweight and read-only by default.

## 0.1.20

- Added a dashboard Environment Steps card backed by `.aienvmp/plan.json`.
- Surfaced runtime, package manager, Docker, and coordination plan summaries for humans.
- Kept detailed step lists in `plan.md` while keeping the dashboard bounded.

## 0.1.19

- Added runtime, package manager, Docker, and coordination environment steps to `aienvmp plan`.
- Kept environment plans read-only and ask-first for global changes.
- Improved AI guidance for resolving version drift and multi-agent coordination warnings.

## 0.1.18

- Added a dashboard remediation steps card backed by `.aienvmp/plan.json`.
- Kept dashboard remediation details bounded to package, severity, fix version, and advisory references.
- Improved human visibility for AI-generated read-only security plans.

## 0.1.17

- Added bounded security remediation steps to `aienvmp plan`.
- Included package fix versions and advisory references in plan JSON and markdown output.
- Kept remediation output read-only and review-oriented.

## 0.1.16

- Added scoped strict checks with `doctor --strict security|policy|coordination|all`.
- Kept `doctor --ci` compatible as strict `all`.
- Updated the GitHub Action `strict` input to support scoped enforcement while keeping advisory mode by default.

## 0.1.15

- Added dashboard links for written AI plan artifacts.
- Added `write-plan` support to the GitHub Action so CI can emit read-only plan outputs.
- Updated the GitHub Action example to show the sync, plan, and doctor flow.

## 0.1.14

- Added `aienvmp plan` for read-only AI environment action plans.
- Added optional `aienvmp plan --write` artifacts at `.aienvmp/plan.json` and `.aienvmp/plan.md`.
- Kept plan output advisory-only with review gates instead of automatic fixes.

## 0.1.13

- Added `recommendedActions` to AI handoff output.
- Added a Recommended Actions dashboard card for human review.
- Reused the same advisory action engine across context, doctor, handoff, and dashboard.

## 0.1.12

- Added AI-readable `recommendedActions` to `context --json` and `doctor --json`.
- Added concise recommended actions to text context and doctor output.
- Kept recommendations advisory-only; strict failure still requires `doctor --ci`.

## 0.1.11

- Added bounded remediation details to security summaries, including fix versions and advisory references.
- Surfaced remediation hints in `AIENV.md` and the dashboard so AI agents can plan safer dependency updates.
- Kept security scanning read-only and opt-in.

## 0.1.10

- Added optional `pip-audit` JSON parsing for Python security summaries.
- Combined npm and Python vulnerable package summaries into the same AI-facing security context.
- Kept missing Python scanners non-blocking with explicit scanner availability metadata.

## 0.1.9

- Added top vulnerable package summaries for AI context, handoff, `AIENV.md`, and the dashboard.
- Ranked vulnerable packages by severity so agents can prioritize review without reading full audit output.
- Kept security package details bounded to preserve lightweight output.

## 0.1.8

- Added optional `sync --security` / `scan --security` vulnerability summary collection.
- Added read-only npm audit parsing for light SBOM security awareness.
- Exposed security summaries to AI-facing context, handoff, `AIENV.md`, and the dashboard.

## 0.1.7

- Added stale open intent warnings for long-running environment change plans.
- Added stale handoff warnings when environment changes happen after the last recorded AI handoff.
- Added optional `aienvmp handoff --record --actor <agent:id>` timeline entries.

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
