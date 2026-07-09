# AI Workspace Coordination Case Study

Use this case study to explain `aienvmp` to humans or AI agents before installing it on a shared machine.

## Scenario

A team shares one GPU server for AI coding work.

- Codex starts a task and installs a Node dependency.
- Claude continues later and assumes the old lockfile is still current.
- Gemini reviews a Python issue and suggests a package upgrade.
- A human sees tests fail because the server environment changed, but no one can tell which AI changed what.

This is not a classic SBOM problem. It is an AI workspace coordination problem: multiple agents are making environment-affecting decisions from different assumptions.

## What Can Go Wrong

- two AI agents use different Node, Python, or package manager assumptions
- one agent rewrites a lockfile because its preferred tool differs from the repo
- vulnerability remediation runs before the light SBOM or dependency read set is reviewed
- a later AI continues without knowing a previous environment change still needs sync or handoff
- local work is blocked by overly strict checks that were meant for CI

## aienvmp Flow

```bash
npx aienvmp onboard
npx aienvmp status
npx aienvmp context --json
```

Before changing dependencies, runtimes, package managers, Docker, or global tools:

```bash
npx aienvmp intent --actor agent:id --action "planned-change" --target dependency
```

After the accepted change:

```bash
npx aienvmp checkpoint --actor agent:id --summary "dependency-change" --target dependency
```

## What Each AI Reads

- `.aienvmp/status.json`: first clear/review decision and next command
- `.aienvmp/summary.md`: compact human/AI handoff
- `aienvmp discover --json` `aiDiscovery.decision`: `auto-ready` when pointers can be picked up, `fallback-required` when the AI should use the fallback read path
- `AIENV.md`: Markdown environment map
- `.aienvmp/sbom.json`: light SBOM and dependency review hints
- `.aienvmp/sbom.json` `dependencyCoordination`: SBOM-to-intent/checkpoint/handoff loop for dependency work
- `.aienvmp/timeline.jsonl`: append-only environment ledger
- `.aienvmp/intents.jsonl`: planned environment changes

## Why It Stays Lightweight

`aienvmp` is advisory by default.

- no daemon
- no default global lock
- no install-time dependency tree
- no scanner requirement unless security confidence matters
- strict checks only when CI or a human explicitly asks
- npm publish remains held by `releaseReadiness.publishGate` until meaningful changes are batched

## Result

The next AI can answer these before touching the environment:

- Is the env map fresh?
- Is another AI already changing this target?
- Which files and lockfiles define dependency state?
- Is light SBOM risk high enough to run optional scanners?
- What does `dependencyCoordination` require before dependency or security remediation?
- What command records the accepted change and handoff?
- Does `aiDiscovery.decision` say automatic pickup is ready, or should this AI use the fallback startup path?
- Does the dashboard show the same discovery decision for the human operator?

That is the product promise: one lightweight env map and light SBOM that keeps multiple AI agents from silently drifting on the same workspace.
