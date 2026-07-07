import { isStaleTimestamp } from "./trust.js";

export function diagnose(manifest, context = {}) {
  const warnings = [];
  const hints = manifest.projectHints || {};
  const runtimes = manifest.runtimes || {};
  if (hints.nvmrc && runtimes.node && !String(runtimes.node).startsWith(String(hints.nvmrc).replace(/^v/, ""))) {
    warnings.push({
      code: "node-version-mismatch",
      message: `.nvmrc requests ${hints.nvmrc}, but detected node is ${runtimes.node}.`
    });
  }
  const py = runtimes.python || runtimes.python3;
  if (hints.pythonVersion && py && !String(py).startsWith(String(hints.pythonVersion))) {
    warnings.push({
      code: "python-version-mismatch",
      message: `.python-version requests ${hints.pythonVersion}, but detected python is ${py}.`
    });
  }
  const locks = ["packageLock", "pnpmLock", "yarnLock"].filter((key) => hints[key]);
  if (locks.length > 1) {
    warnings.push({
      code: "mixed-node-lockfiles",
      message: `Multiple Node lockfiles detected: ${locks.join(", ")}. Prefer one package manager.`
    });
  }
  if ((hints.pyproject || hints.requirements) && !py) {
    warnings.push({
      code: "python-missing",
      message: "Python project hints detected, but no Python runtime was found."
    });
  }
  if (hints.dockerfile && !manifest.containers?.docker) {
    warnings.push({
      code: "docker-missing",
      message: "Dockerfile detected, but Docker CLI was not found."
    });
  }
  if (isStaleTimestamp(manifest.generatedAt)) {
    warnings.push({
      code: "manifest-stale",
      message: "Environment snapshot is older than 24 hours. Run `aienvmp sync` before changing the environment."
    });
  }
  warnings.push(...coordinationWarnings(context.intents || []));
  return warnings;
}

export function coordinationWarnings(intents = []) {
  const warnings = [];
  const byTarget = new Map();
  for (const intent of intents) {
    const target = String(intent.target || inferTarget(intent.action) || "").trim().toLowerCase();
    if (!target) continue;
    const list = byTarget.get(target) || [];
    list.push(intent);
    byTarget.set(target, list);
  }
  for (const [target, list] of byTarget) {
    const actors = new Set(list.map((intent) => intent.actor).filter(Boolean));
    if (list.length > 1 && actors.size > 1) {
      warnings.push({
        code: "conflicting-open-intents",
        target,
        message: `Multiple agents have open environment intents for ${target}. Resolve or coordinate before changing it.`
      });
    }
  }
  return warnings;
}

function inferTarget(action = "") {
  const normalized = String(action).toLowerCase();
  for (const target of ["node", "python", "docker", "npm", "pnpm", "yarn", "uv", "pip", "pipx"]) {
    if (normalized.includes(target)) return target;
  }
  return "";
}
