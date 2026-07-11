import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function resolveActionRoot(moduleUrl: string, configuredPath?: string): string {
  if (configuredPath) return resolve(configuredPath);

  let candidate = dirname(fileURLToPath(moduleUrl));
  for (let depth = 0; depth < 4; depth += 1) {
    if (existsSync(join(candidate, "action.yml")) && existsSync(join(candidate, "themes"))) {
      return candidate;
    }
    const parent = dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }

  throw new Error("Unable to locate the installed Profile Stats RPG Action files.");
}
