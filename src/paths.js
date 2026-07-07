import path from "node:path";

export function workspaceDir(args) {
  return path.resolve(String(args.dir || "."));
}

export function stateDir(dir) {
  return path.join(dir, ".aienvmp");
}

export function manifestPath(dir) {
  return path.join(stateDir(dir), "manifest.json");
}

export function previousManifestPath(dir) {
  return path.join(stateDir(dir), "manifest.previous.json");
}

export function timelinePath(dir) {
  return path.join(stateDir(dir), "timeline.jsonl");
}

export function intentsPath(dir) {
  return path.join(stateDir(dir), "intents.jsonl");
}

export function dashboardPath(dir) {
  return path.join(stateDir(dir), "dashboard.html");
}

export function aiEnvPath(dir) {
  return path.join(dir, "AIENV.md");
}
