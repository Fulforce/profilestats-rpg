import { access, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { parse } from "yaml";
import { ConfigValidationError } from "./config-error.js";
import { AppError } from "../errors/app-error.js";
import { normalizeConfig, validateConfig } from "./config-validator.js";
import type { AppConfig } from "./types.js";

export async function loadConfig(path = "config.yml", today = new Date()): Promise<AppConfig> {
  let file: string;
  let parsed: unknown;

  try {
    file = await readFile(path, "utf8");
  } catch (error) {
    throw new AppError("CONFIG_READ_FAILED", `Unable to read configuration file: ${path}`, {
      cause: error
    });
  }

  try {
    parsed = parse(file) as unknown;
  } catch (error) {
    throw new AppError("CONFIG_PARSE_FAILED", `Configuration file is not valid YAML: ${path}`, {
      cause: error
    });
  }

  const issues = validateConfig(parsed, today);

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  const config = normalizeConfig(parsed);
  await assertThemeDirectoryExists(config.theme);

  return config;
}

async function assertThemeDirectoryExists(theme: string): Promise<void> {
  const themesRoot = resolve("themes");
  const themePath = resolve(themesRoot, theme);

  if (!themePath.startsWith(`${themesRoot}${sep}`)) {
    throw new ConfigValidationError([{ path: "theme", message: "must stay inside themes/" }]);
  }

  try {
    await access(themePath);
  } catch {
    throw new ConfigValidationError([
      {
        path: "theme",
        message: `directory themes/${theme} does not exist`
      }
    ]);
  }
}
