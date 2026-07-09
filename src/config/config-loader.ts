import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { ConfigValidationError } from "./config-error.js";
import { normalizeConfig, validateConfig } from "./config-validator.js";
import type { AppConfig } from "./types.js";

export async function loadConfig(path = "config.yml", today = new Date()): Promise<AppConfig> {
  const file = await readFile(path, "utf8");
  const parsed = parse(file);
  const issues = validateConfig(parsed, today);

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  const config = normalizeConfig(parsed);
  await assertThemeDirectoryExists(config.theme);

  return config;
}

async function assertThemeDirectoryExists(theme: string): Promise<void> {
  try {
    await access(join("themes", theme));
  } catch {
    throw new ConfigValidationError([
      {
        path: "theme",
        message: `directory themes/${theme} does not exist`
      }
    ]);
  }
}
