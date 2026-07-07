import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { dashWorkspace } from "../src/commands/dash.js";
import { writeJson } from "../src/fsutil.js";
import { renderDashboard } from "../src/render.js";

test("renderDashboard includes the audit summary surface", () => {
  const html = renderDashboard({
    generatedAt: "2026-07-08T00:00:00.000Z",
    workspace: { name: "sample", path: "/tmp/sample" },
    os: { platform: "linux", release: "test", arch: "x64", shell: "bash" },
    runtimes: { node: "24.0.0" },
    packageManagers: { npm: "11.0.0" },
    containers: {},
    projectHints: {},
    agentFiles: {},
    dependencySnapshot: {
      mode: "snapshot",
      enabled: true,
      manifests: ["package.json"],
      summary: { ecosystems: ["npm"], manifests: 1, packages: 1 },
      packages: [{ ecosystem: "npm", name: "express", version: "^4.18.0", manifest: "package.json", group: "dependencies" }]
    },
    lightSbom: {
      mode: "light-sbom",
      summary: {
        manifests: ["package.json"],
        lockfiles: [{ file: "package-lock.json", ecosystem: "npm", manager: "npm" }],
        packages: 1,
        vulnerabilities: 1,
        directVulnerablePackages: 1,
        transitiveOrUnmatchedVulnerablePackages: 0
      },
      topRisk: [{
        name: "express",
        ecosystem: "npm",
        severity: "high",
        directDependency: true,
        manifest: "package.json",
        version: "^4.18.0",
        priority: "high",
        score: 90,
        fixAvailable: true,
        fixVersions: ["4.18.3"]
      }],
      riskSummary: {
        level: "high",
        score: 80,
        scanner: "enabled",
        next: "Review dependency read set and topRisk before remediation; do not auto-fix without user approval.",
        signals: ["1 high vulnerability finding(s)", "1 vulnerable direct dependency package(s)"],
        reviewTargets: ["package.json", "express"]
      },
      packageManagerPolicy: {
        status: "clear",
        ecosystems: {
          npm: {
            managers: ["npm"],
            lockfiles: ["package-lock.json"],
            status: "single-manager",
            recommendedManager: "npm",
            guidance: "Use the detected package manager for dependency changes unless the user says otherwise."
          }
        },
        guidance: "Preserve existing lockfile and package manager choices during dependency changes."
      },
      dependencyChangeHints: [{
        manifest: "package.json",
        ecosystem: "npm",
        manager: "npm",
        groups: ["dependencies"],
        lockfiles: [{ file: "package-lock.json", ecosystem: "npm", manager: "npm" }],
        packages: 1,
        riskPackages: [{ name: "express", severity: "high", priority: "high", fixAvailable: true }]
      }]
    },
    security: {
      mode: "security",
      enabled: true,
      summary: { total: 1, critical: 0, high: 1, moderate: 0, low: 0, info: 0 },
      topPackages: [{
        name: "express",
        severity: "high",
        remediationPriority: { level: "high", score: 90, reasons: [] },
        fixAvailable: true,
        directDependency: true,
        dependency: { ecosystem: "npm", manifest: "package.json", group: "dependencies", version: "^4.18.0" }
      }]
    },
    recommendedActions: [{
      id: "review-security-remediation",
      priority: "high",
      category: "security",
      summary: "Review express before dependency changes.",
      command: "aienvmp context --json"
    }],
    planArtifacts: {
      markdown: ".aienvmp/plan.md",
      json: ".aienvmp/plan.json"
    },
    planRemediation: [{
      package: "express",
      severity: "high",
      remediationPriority: { level: "high", score: 90, reasons: [] },
      fixVersions: ["4.17.21"],
      fixAvailable: true,
      advisories: ["GHSA-test"],
      directDependency: true,
      dependency: { ecosystem: "npm", manifest: "package.json", group: "dependencies", version: "^4.18.0" }
    }],
    planEnvironment: [{
      code: "node-version-mismatch",
      category: "runtime",
      summary: ".nvmrc requests 20, but detected node is 24.0.0."
    }],
    ciReadiness: [{
      scope: "security",
      status: "pass",
      matchedWarningCodes: []
    }, {
      scope: "policy",
      status: "fail",
      matchedWarningCodes: ["node-version-mismatch"]
    }, {
      scope: "coordination",
      status: "pass",
      matchedWarningCodes: []
    }, {
      scope: "all",
      status: "fail",
      matchedWarningCodes: ["node-version-mismatch"]
    }],
    preflight: {
      contract: {
        name: "aienvmp-preflight",
        version: 1,
        stability: "additive",
        aiEntryFields: ["state", "nextAgent", "coordination", "agentActivity", "dependencyReadSet"],
        rule: "Consumers should ignore unknown fields."
      },
      intentTargets: [{
        target: "dependency",
        reason: "Security findings are dependency-related; record dependency intent before remediation.",
        sources: ["security"],
        command: "aienvmp intent --actor agent:id --action planned-change --target dependency"
      }],
      nextAgent: {
        readFirst: ".aienvmp/status.json",
        dependencyFiles: ["package.json", "package-lock.json"],
        rule: "Next AI may continue project-local work; record intent before environment changes."
      },
      coordination: {
        openIntentCount: 2,
        conflictTargets: ["dependency"],
        targets: [{
          target: "dependency",
          count: 2,
          actors: ["agent:codex", "agent:claude"],
          actions: ["update dependency", "fix vulnerable package"],
          conflict: true
        }]
      },
      followUps: [{
        at: "2026-07-08T00:00:00.000Z",
        actor: "agent:codex",
        target: "dependency",
        summary: "dependency-change",
        reason: "Dependency or security records should refresh the env map and handoff context.",
        commands: ["aienvmp sync", "aienvmp status --write", "aienvmp handoff --record --actor agent:id"]
      }],
      agentActivity: {
        environmentRecordCount: 2,
        multiActorTargets: ["dependency"],
        next: "Run handoff and review follow-ups before another environment change.",
        targets: [{
          target: "dependency",
          count: 2,
          actors: ["agent:codex", "agent:claude"],
          latestSummary: "dependency remediation",
          multiActor: true
        }]
      },
      dependencyReadSet: [{
        manifest: "package.json",
        ecosystem: "npm",
        manager: "npm",
        groups: ["dependencies"],
        lockfiles: ["package-lock.json"],
        riskPackages: ["express"],
        reason: "Read before dependency or security remediation; vulnerable packages are linked to this manifest."
      }],
      dependencyChangeProtocol: {
        mode: "advisory",
        packageManagerPolicy: "clear",
        commands: {
          recordIntent: "aienvmp intent --actor agent:id --action planned-change --target dependency",
          refreshAfterChange: "aienvmp sync",
          recordAfterChange: "aienvmp record --actor agent:id --summary dependency-change --target dependency",
          checkpointAfterChange: "aienvmp checkpoint --actor agent:id --summary dependency-change --target dependency"
        },
        mustNotDo: ["Do not switch package managers because another lockfile exists without user approval."]
      },
      enforcementProfile: {
        defaultMode: "advisory",
        localOperation: "non-blocking",
        strictUse: "CI or explicit human-requested checks only",
        gate: {
          defaultMode: "advisory",
          strictMode: "off",
          localDefault: "warn-only",
          failCondition: "never in default mode",
          exitCode: "0 unless the command itself errors",
          rule: "Do not block local or shared machine operation unless --strict or --ci is explicitly requested."
        },
        recommendedStrictCommand: "aienvmp doctor --strict policy",
        reason: "Avoid disrupting shared servers or developer machines while still making drift visible.",
        strictCommands: [
          "aienvmp doctor --strict security",
          "aienvmp doctor --strict policy",
          "aienvmp doctor --strict coordination",
          "aienvmp doctor --strict all"
        ]
      }
    }
  }, [], [], [], {});

  assert.match(html, /Audit summary/);
  assert.match(html, /AI decision/);
  assert.match(html, /Runtime drift/);
  assert.match(html, /Open env changes/);
  assert.match(html, /Trust/);
  assert.match(html, /AI Handoff/);
  assert.match(html, /Read first/);
  assert.match(html, /\.aienvmp\/status\.json/);
  assert.match(html, /Dependency files/);
  assert.match(html, /Conflicts/);
  assert.match(html, /Recommended Actions/);
  assert.match(html, /Review express/);
  assert.match(html, /AI Intent Targets/);
  assert.match(html, /Follow-ups/);
  assert.match(html, /dependency-change/);
  assert.match(html, /aienvmp status --write/);
  assert.match(html, /Agent Activity/);
  assert.match(html, /dependency remediation/);
  assert.match(html, /multi-agent/);
  assert.match(html, /AI Contract/);
  assert.match(html, /aienvmp-preflight/);
  assert.match(html, /nextAgent/);
  assert.match(html, /dependency/);
  assert.match(html, /planned-change --target dependency/);
  assert.match(html, /Dependency Read Set/);
  assert.match(html, /package-lock\.json/);
  assert.match(html, /Dependency Protocol/);
  assert.match(html, /checkpoint --actor agent:id --summary dependency-change --target dependency/);
  assert.match(html, /AI Plan Artifacts/);
  assert.match(html, /plan\.md/);
  assert.match(html, /Remediation Steps/);
  assert.match(html, /4\.17\.21/);
  assert.match(html, /"level":"high"/);
  assert.match(html, /"score":90/);
  assert.match(html, /Environment Steps/);
  assert.match(html, /node-version-mismatch/);
  assert.match(html, /CI Readiness/);
  assert.match(html, /Enforcement Mode/);
  assert.match(html, /advisory/);
  assert.match(html, /warn-only/);
  assert.match(html, /never in default mode/);
  assert.match(html, /0 unless the command itself errors/);
  assert.match(html, /doctor --strict policy/);
  assert.match(html, /security/);
  assert.match(html, /policy/);
  assert.match(html, /Global Inventory/);
  assert.match(html, /Dependency Snapshot/);
  assert.match(html, /Light SBOM/);
  assert.match(html, /Risk summary/);
  assert.match(html, /vulnerable direct dependency/);
  assert.match(html, /Direct vulnerable/);
  assert.match(html, /Dependency change hints/);
  assert.match(html, /Package manager policy/);
  assert.match(html, /package-lock\.json/);
  assert.match(html, /express/);
  assert.match(html, /Security Summary/);
  assert.match(html, /package\.json/);
  assert.match(html, /express/);
});

test("dashWorkspace links written plan artifacts", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aienvmp-dash-plan-"));
  await fs.mkdir(path.join(dir, ".aienvmp"), { recursive: true });
  await writeJson(path.join(dir, ".aienvmp", "manifest.json"), {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    trust: { state: "observed", verified: false },
    workspace: { path: dir, name: path.basename(dir) },
    os: { platform: "test", release: "test", arch: "x64" },
    runtimes: { node: "24.0.0" },
    packageManagers: {},
    containers: {},
    projectHints: { nvmrc: "20" },
    dependencySnapshot: {
      mode: "snapshot",
      enabled: true,
      manifests: ["requirements.txt"],
      summary: { ecosystems: ["python"], manifests: 1, packages: 1 },
      packages: [{ ecosystem: "python", name: "django", version: "==3.2.0", manifest: "requirements.txt", group: "requirements" }]
    },
    lightSbom: {
      mode: "light-sbom",
      summary: { manifests: ["requirements.txt"], lockfiles: [{ file: "uv.lock", ecosystem: "python", manager: "uv" }], packages: 1, vulnerabilities: 0, directVulnerablePackages: 0, transitiveOrUnmatchedVulnerablePackages: 0 },
      topRisk: [],
      dependencyChangeHints: [{
        manifest: "requirements.txt",
        ecosystem: "python",
        manager: "pip",
        groups: ["requirements"],
        lockfiles: [{ file: "uv.lock", ecosystem: "python", manager: "uv" }],
        packages: 1,
        riskPackages: []
      }]
    },
    agentFiles: {}
  });
  await fs.writeFile(path.join(dir, ".aienvmp", "plan.md"), "# plan\n", "utf8");
  await fs.writeFile(path.join(dir, ".aienvmp", "plan.json"), JSON.stringify({
    remediationSteps: [{
      package: "django",
      severity: "unknown",
      fixAvailable: true,
      fixVersions: ["3.2.25"],
      advisories: [{ id: "PYSEC-1" }]
    }],
    environmentSteps: [{
      code: "mixed-node-lockfiles",
      category: "package-manager",
      summary: "Multiple Node lockfiles detected."
    }]
  }), "utf8");

  await dashWorkspace({ dir, quiet: true });
  const html = await fs.readFile(path.join(dir, ".aienvmp", "dashboard.html"), "utf8");

  assert.match(html, /AI Plan Artifacts/);
  assert.match(html, /AI Intent Targets/);
  assert.match(html, /planned-change --target node/);
  assert.match(html, /Dependency Read Set/);
  assert.match(html, /Dependency Protocol/);
  assert.match(html, /href="plan\.md"/);
  assert.match(html, /href="plan\.json"/);
  assert.match(html, /Remediation Steps/);
  assert.match(html, /django/);
  assert.match(html, /3\.2\.25/);
  assert.match(html, /Environment Steps/);
  assert.match(html, /mixed-node-lockfiles/);
  assert.match(html, /CI Readiness/);
  assert.match(html, /Enforcement Mode/);
  assert.match(html, /doctor --strict policy/);
  assert.match(html, /node-version-mismatch/);
  assert.match(html, /Dependency Snapshot/);
  assert.match(html, /Light SBOM/);
  assert.match(html, /Dependency change hints/);
  assert.match(html, /requirements\.txt/);
  assert.match(html, /uv\.lock/);
  assert.match(html, /django/);
});
