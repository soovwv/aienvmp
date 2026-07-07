import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { openIntents, readJsonl, readTimeline } from "../timeline.js";
import { dashboardPath, intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { renderDashboard } from "../render.js";
import { loadPolicy, policyWarnings } from "../policy.js";

export async function dashWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp sync` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = openIntents(await readJsonl(intentsPath(dir)));
  const policy = await loadPolicy(dir);
  const warnings = [...diagnose(manifest), ...policyWarnings(manifest, policy)];
  const html = renderDashboard(manifest, timeline, warnings, intents, policy);
  const out = dashboardPath(dir);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, html, "utf8");
  if (!args.quiet) console.log(`dashboard: ${out}`);
  if (args.open) openFile(out);
  return { dashboard: out };
}

function openFile(file) {
  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", file], { windowsHide: true });
  } else if (process.platform === "darwin") {
    execFile("open", [file]);
  } else {
    execFile("xdg-open", [file]);
  }
}
