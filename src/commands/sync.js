import { initWorkspace } from "./init.js";
import { scanWorkspace } from "./scan.js";
import { compileWorkspace } from "./compile.js";
import { dashWorkspace } from "./dash.js";
import { statusWorkspace } from "./status.js";

export async function syncWorkspace(args) {
  const quiet = args.quiet || args.json;
  const next = { ...args, quiet };

  const initialized = await initWorkspace(next);
  const scanned = await scanWorkspace(next);
  const compiled = await compileWorkspace(next);
  const dashboard = await dashWorkspace(next);
  const status = await statusWorkspace({ ...next, json: false, write: true, quiet: true });

  const result = {
    status: "ok",
    outputs: {
      aiEnv: compiled.aiEnv,
      manifest: scanned.manifest,
      timeline: scanned.timeline,
      status: status.artifact,
      dashboard: dashboard.dashboard
    },
    changes: scanned.changes,
    initialized: initialized.stateDir
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!quiet) {
    console.log("sync complete: AIENV.md, manifest, status, ledger, intents, and dashboard are up to date");
  }

  return result;
}
