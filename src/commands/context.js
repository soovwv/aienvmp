import { diagnose } from "../doctor.js";
import { readJson } from "../fsutil.js";
import { readJsonl, readTimeline } from "../timeline.js";
import { intentsPath, manifestPath, timelinePath, workspaceDir } from "../paths.js";
import { renderContext } from "../render.js";

export async function contextWorkspace(args) {
  const dir = workspaceDir(args);
  const manifest = await readJson(manifestPath(dir));
  if (!manifest) throw new Error("missing manifest; run `aienvmp scan` first");
  const timeline = await readTimeline(timelinePath(dir));
  const intents = await readJsonl(intentsPath(dir));
  const warnings = diagnose(manifest);
  console.log(renderContext(manifest, timeline, warnings, intents));
}
