import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("CLI context reads a workspace passed with --dir", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-cli-dir-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await fs.writeFile(path.join(dir, ".aienvmp", "manifest.json"), JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { enabled: false, summary: { total: 0 } }
  }), "utf8");

  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("bin/aienvmp.js"),
    "context",
    "--json",
    "--dir",
    dir
  ], { cwd: path.resolve(".") });

  const json = JSON.parse(stdout);
  assert.equal(json.workspace.path, dir);
  assert.equal(json.status, "clear");
});

test("CLI context accepts --dir before the command", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-cli-global-dir-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await fs.writeFile(path.join(dir, ".aienvmp", "manifest.json"), JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    runtimes: {},
    packageManagers: {},
    containers: {},
    projectHints: {},
    dependencySnapshot: { summary: { packages: 0 } },
    security: { enabled: false, summary: { total: 0 } }
  }), "utf8");

  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("bin/aienvmp.js"),
    "--dir",
    dir,
    "context",
    "--json"
  ], { cwd: path.resolve(".") });

  const json = JSON.parse(stdout);
  assert.equal(json.workspace.path, dir);
  assert.equal(json.status, "clear");
});

test("CLI schema prints the AI-readable output contract without a workspace", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("bin/aienvmp.js"),
    "schema",
    "--json"
  ], { cwd: path.resolve(".") });

  const json = JSON.parse(stdout);
  assert.equal(json.name, "aienvmp-contract");
  assert.equal(json.contractVersion, "0.1-prototype");
  assert.equal(json.stableFrom, "0.2.0");
  assert.equal(json.outputs.status.contract.name, "aienvmp-preflight");
});

test("package, README, and CLI help share the AI workspace coordination positioning", async () => {
  const pkg = JSON.parse(await fs.readFile(path.resolve("package.json"), "utf8"));
  const readme = await fs.readFile(path.resolve("README.md"), "utf8");
  const { stdout } = await execFileAsync(process.execPath, [
    path.resolve("bin/aienvmp.js"),
    "--help"
  ], { cwd: path.resolve(".") });

  assert.match(pkg.description, /AI workspace coordination/);
  assert.ok(pkg.keywords.includes("ai-workspace"));
  assert.ok(pkg.keywords.includes("coordination"));
  assert.ok(pkg.keywords.includes("multi-agent"));
  assert.match(readme.slice(0, 1200), /AI workspace coordination/);
  assert.match(readme.slice(0, 1200), /without heavy locks/);
  assert.match(stdout, /AI workspace coordination with a lightweight env map and SBOM/);
});

test("package stays runtime dependency-free for lightweight shared machines", async () => {
  const pkg = JSON.parse(await fs.readFile(path.resolve("package.json"), "utf8"));

  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.optionalDependencies, undefined);
  assert.equal(pkg.peerDependencies, undefined);
  assert.equal(pkg.bundledDependencies, undefined);
});

test("package publish allowlist stays small and intentional", async () => {
  const pkg = JSON.parse(await fs.readFile(path.resolve("package.json"), "utf8"));

  assert.deepEqual(pkg.files, [
    "bin",
    "src",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "BUGFIXES.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "TROUBLESHOOTING.md",
    "ROADMAP.md",
    "action.yml",
    "examples",
    ".agents"
  ]);
  assert.equal(pkg.files.includes("test"), false);
  assert.equal(pkg.files.includes(".aienvmp"), false);
});
