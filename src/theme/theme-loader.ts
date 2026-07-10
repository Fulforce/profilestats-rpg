import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { ThemeValidationError } from "./theme-error.js";
import { normalizeThemeFiles, validateThemeFiles } from "./theme-validator.js";
import type { RawThemeFiles, Theme } from "./types.js";

const REQUIRED_THEME_FILES = [
  "theme.json",
  "map.json",
  "titles.json",
  "achievements.json",
  "palette.json"
] as const;

export async function loadTheme(themeId: string, themesRoot = "themes"): Promise<Theme> {
  const rootPath = resolve(themesRoot);
  const themePath = resolve(rootPath, themeId);

  if (!themePath.startsWith(`${rootPath}${sep}`)) {
    throw new ThemeValidationError([
      { path: "theme", message: "theme path must stay inside the themes directory" }
    ]);
  }

  const files = await readThemeFiles(themePath);
  const issues = validateThemeFiles(themeId, files);

  if (issues.length > 0) {
    throw new ThemeValidationError(issues);
  }

  return normalizeThemeFiles(files);
}

async function readThemeFiles(themePath: string): Promise<RawThemeFiles> {
  const entries = await Promise.all(
    REQUIRED_THEME_FILES.map(async (fileName) => [
      fileName,
      await readJson(join(themePath, fileName))
    ])
  );

  return {
    manifest: entries.find(([fileName]) => fileName === "theme.json")?.[1],
    map: entries.find(([fileName]) => fileName === "map.json")?.[1],
    titles: entries.find(([fileName]) => fileName === "titles.json")?.[1],
    achievements: entries.find(([fileName]) => fileName === "achievements.json")?.[1],
    palette: entries.find(([fileName]) => fileName === "palette.json")?.[1]
  };
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new ThemeValidationError([{ path, message }]);
  }
}
