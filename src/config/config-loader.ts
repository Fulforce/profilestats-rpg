import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { ConfigValidationError } from "./config-error.js";
import { AppError } from "../errors/app-error.js";
import { normalizeConfig, validateConfig } from "./config-validator.js";
import type { AppConfig } from "./types.js";

export async function loadConfig(
  path = ".github/profile-stats-rpg.yml",
  today = new Date()
): Promise<AppConfig> {
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

  return normalizeConfig(parsed);
}
