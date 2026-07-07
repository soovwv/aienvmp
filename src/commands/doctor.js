import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { manifestPath, workspaceDir } from "../paths.js";

export async function doctorWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp scan` first");
  const warnings = diagnose(manifest);
  if (!warnings.length) {
    console.log("doctor: no blocking environment warnings detected");
    return;
  }
  for (const warning of warnings) {
    console.log(`[${warning.code}] ${warning.message}`);
  }
}
