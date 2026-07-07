import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";
import { intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { renderContext } from "../render.js";
import { loadPolicy, policyWarnings } from "../policy.js";

export async function contextWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp scan` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest), ...policyWarnings(manifest, policy)];
  if (args.json) {
    console.log(JSON.stringify({
      status: warnings.length ? "review-required" : "clear",
      workspace: manifest.workspace,
      runtimes: manifest.runtimes,
      packageManagers: manifest.packageManagers,
      containers: manifest.containers,
      projectHints: manifest.projectHints,
      warnings,
      policy,
      intents: intents.slice(-5),
      recentLedger: timeline.slice(-5),
      protocol: manifest.agentProtocol
    }, null, 2));
    return;
  }
  console.log(renderContext(manifest, timeline, warnings, intents, policy));
}
