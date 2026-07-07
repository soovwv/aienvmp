import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function commandVersion(command, args = ["--version"]) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: 2500,
      windowsHide: true
    });
    return firstVersion(`${stdout}\n${stderr}`);
  } catch {
    return null;
  }
}

export async function commandOutput(command, args = []) {
  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout: 2500,
      windowsHide: true
    });
    return stdout.trim();
  } catch {
    return "";
  }
}

export function firstVersion(text) {
  const match = String(text).match(/(?:v)?(\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?)/);
  return match ? match[1] : null;
}
