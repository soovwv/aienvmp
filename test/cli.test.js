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
