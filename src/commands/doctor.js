import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { manifestPath, workspaceDir } from "../paths.js";
import { loadPolicy, policyWarnings } from "../policy.js";

export async function doctorWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp scan` first");
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest), ...policyWarnings(manifest, policy)];
  if (args.json) {
    console.log(JSON.stringify({
      status: warnings.length ? "warning" : "ok",
      policy,
      warnings
    }, null, 2));
    if (args.ci && warnings.length) {
      process.exitCode = 1;
    }
    return;
  }
  if (!warnings.length) {
    console.log("doctor: no blocking environment warnings detected");
    return;
  }
  for (const warning of warnings) {
    console.log(`[${warning.code}] ${warning.message}`);
  }
  console.log("doctor: warnings are non-blocking by default; pass --ci to fail automation.");
  if (args.ci) {
    process.exitCode = 1;
  }
}
