export function diagnose(manifest) {
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
  return warnings;
}
