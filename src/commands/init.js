import fs from "node:fs/promises";
import { stateDir, workspaceDir } from "../paths.js";

export async function initWorkspace(args) {
  const dir = workspaceDir(args);
  await fs.mkdir(stateDir(dir), { recursive: true });
  await fs.writeFile(`${stateDir(dir)}/policy.yml`, "# aienvmp policy\n", { flag: "wx" }).catch(() => {});
  console.log(`initialized ${stateDir(dir)}`);
}
