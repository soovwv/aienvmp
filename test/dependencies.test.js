import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { linkVulnerableDependencies, parsePyprojectDependencies, parseRequirementLine, scanDependencySnapshot } from "../src/dependencies.js";

test("parseRequirementLine separates package name and version spec", () => {
  assert.deepEqual(parseRequirementLine("django==3.2.0"), { name: "django", version: "==3.2.0" });
  assert.deepEqual(parseRequirementLine("requests>=2 # comment"), { name: "requests", version: ">=2" });
});

test("parsePyprojectDependencies reads project dependency arrays", () => {
  assert.deepEqual(parsePyprojectDependencies(`
[project]
dependencies = [
  "fastapi>=0.110",
  "uvicorn",
]
`), ["fastapi>=0.110", "uvicorn"]);
});

test("scanDependencySnapshot reads node and python manifests without installing", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-deps-"));
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({
    dependencies: { express: "^4.18.0" },
    devDependencies: { vitest: "^2.0.0" }
  }), "utf8");
  await fs.writeFile(path.join(dir, "requirements.txt"), "django==3.2.0\n# ignored\n-r other.txt\n", "utf8");

  const snapshot = await scanDependencySnapshot(dir);

  assert.equal(snapshot.mode, "snapshot");
  assert.equal(snapshot.summary.packages, 3);
  assert.deepEqual(snapshot.summary.ecosystems, ["npm", "python"]);
  assert.deepEqual(snapshot.manifests, ["package.json", "requirements.txt"]);
  assert.deepEqual(snapshot.packages.map((pkg) => pkg.name), ["express", "vitest", "django"]);
});

test("linkVulnerableDependencies marks direct dependency matches", () => {
  const security = linkVulnerableDependencies({
    enabled: true,
    topPackages: [
      { name: "express", scanner: "npm-audit", severity: "high" },
      { name: "transitive-only", scanner: "npm-audit", severity: "moderate" },
      { name: "django", scanner: "pip-audit", severity: "unknown" }
    ]
  }, {
    packages: [
      { ecosystem: "npm", name: "express", version: "^4.18.0", manifest: "package.json", group: "dependencies" },
      { ecosystem: "python", name: "django", version: "==3.2.0", manifest: "requirements.txt", group: "requirements" }
    ]
  });

  assert.equal(security.topPackages[0].directDependency, true);
  assert.equal(security.topPackages[0].dependency.manifest, "package.json");
  assert.equal(security.topPackages[1].directDependency, false);
  assert.equal(security.topPackages[1].dependency, null);
  assert.equal(security.topPackages[2].directDependency, true);
  assert.equal(security.topPackages[2].dependency.manifest, "requirements.txt");
});
