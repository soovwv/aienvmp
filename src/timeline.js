import fs from "node:fs/promises";

export async function readTimeline(file) {
  return readJsonl(file);
}

export async function readJsonl(file) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
