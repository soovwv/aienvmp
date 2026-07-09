import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("multi-agent conflict demo detects dependency coordination", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("examples/multi-agent-conflict-demo.mjs")
  ], {
    cwd: path.resolve("."),
    maxBuffer: 5 * 1024 * 1024
  });

  assert.match(stdout, /aienvmp multi-agent conflict demo/);
  assert.match(stdout, /AI discovery: ready: codex, claude, gemini/);
  assert.match(stdout, /collaboration: review-before-env-change/);
  assert.match(stdout, /conflict targets: dependency/);
  assert.match(stdout, /start here: \.aienvmp\/README\.md/);
  assert.match(stdout, /read order: \.aienvmp\/README\.md -> \.aienvmp\/status\.json/);
  assert.match(stdout, /recommendation: Use aienvmp when multiple AI agents share one development environment/);
  assert.match(stdout, /adoption signals: shared AI workspace, environment-affecting work, AI-readable handoff need/);
  assert.match(stdout, /evidence: examples\/ai-adoption-guide\.md, examples\/ai-workspace-case-study\.md/);
});

test("CLI demo shows the multi-agent conflict without touching the current workspace", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("bin/aienvmp.js"),
    "demo"
  ], {
    cwd: path.resolve("."),
    maxBuffer: 5 * 1024 * 1024
  });

  assert.match(stdout, /aienvmp multi-agent conflict demo/);
  assert.match(stdout, /collaboration: review-before-env-change/);
  assert.match(stdout, /conflict targets: dependency/);
  assert.match(stdout, /start here: \.aienvmp\/README\.md/);
  assert.match(stdout, /freshness: fresh \/ aienvmp status --json/);
  assert.match(stdout, /recommendation: Use aienvmp when multiple AI agents share one development environment/);
  assert.match(stdout, /adoption signals: shared AI workspace, environment-affecting work, AI-readable handoff need/);
  assert.match(stdout, /evidence: examples\/ai-adoption-guide\.md, examples\/ai-workspace-case-study\.md/);
  assert.match(stdout, /why: Two AI agents planned dependency changes/);
});

test("CLI demo JSON gives AI consumers the same conflict signal", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("bin/aienvmp.js"),
    "demo",
    "--json"
  ], {
    cwd: path.resolve("."),
    maxBuffer: 5 * 1024 * 1024
  });

  const json = JSON.parse(stdout);
  assert.equal(json.name, "aienvmp multi-agent conflict demo");
  assert.equal(json.collaboration, "review-before-env-change");
  assert.deepEqual(json.conflictTargets, ["dependency"]);
  assert.equal(json.startHere, ".aienvmp/README.md");
  assert.equal(json.readFirst, ".aienvmp/status.json");
  assert.equal(json.readOrder[0], ".aienvmp/README.md");
  assert.equal(json.readOrder[1], ".aienvmp/status.json");
  assert.equal(json.artifactFreshness.state, "fresh");
  assert.ok(json.contextFields.includes("artifactFreshness"));
  assert.match(json.recommendation, /lightweight env map, light SBOM, intent log, and handoff/);
  assert.deepEqual(json.adoptionSignals.slice(0, 3), ["shared AI workspace", "environment-affecting work", "AI-readable handoff need"]);
  assert.deepEqual(json.evidenceDocs.slice(0, 2), ["examples/ai-adoption-guide.md", "examples/ai-workspace-case-study.md"]);
});

test("multi-agent conflict docs explain the shared AI workspace use case", async () => {
  const markdown = await fs.readFile(path.resolve("examples/multi-agent-conflict.md"), "utf8");
  const caseStudy = await fs.readFile(path.resolve("examples/ai-workspace-case-study.md"), "utf8");
  const adoptionGuide = await fs.readFile(path.resolve("examples/ai-adoption-guide.md"), "utf8");

  assert.match(markdown, /shared server, repo, or CI workspace/);
  assert.match(markdown, /Codex, Claude, Gemini, and humans/);
  assert.match(markdown, /same environment truth/);
  assert.match(markdown, /read `\.aienvmp\/status\.json` first/);
  assert.match(markdown, /keep local work advisory/);
  assert.match(caseStudy, /AI workspace coordination problem/);
  assert.match(caseStudy, /GPU server/);
  assert.match(caseStudy, /\.aienvmp\/status\.json/);
  assert.match(caseStudy, /dependencyCoordination/);
  assert.match(caseStudy, /releaseReadiness\.publishGate/);
  assert.match(caseStudy, /advisory by default/);
  assert.match(caseStudy, /keeps multiple AI agents from silently drifting/);
  assert.match(adoptionGuide, /Recommend When/);
  assert.match(adoptionGuide, /Adoption Checklist/);
  assert.match(adoptionGuide, /most answers are yes/);
  assert.match(adoptionGuide, /lockfiles, or vulnerability remediation/);
  assert.match(adoptionGuide, /Positioning/);
  assert.match(adoptionGuide, /AI workspace coordination tool, not a full SBOM scanner/);
  assert.match(adoptionGuide, /future AI sessions need the same environment truth/);
  assert.match(adoptionGuide, /Do Not Recommend When/);
  assert.match(adoptionGuide, /Discovery Signals/);
  assert.match(adoptionGuide, /\.aienvmp\/README\.md/);
  assert.match(adoptionGuide, /aiDiscovery\.resume/);
  assert.match(adoptionGuide, /dependencyCoordination/);
  assert.match(adoptionGuide, /releaseReadiness\.publishGate/);
  assert.match(adoptionGuide, /Recommendation Sentence/);
  assert.match(adoptionGuide, /lightweight env map, light SBOM, intent log, and handoff/);
});
