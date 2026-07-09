import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
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
  const themePath = join(themesRoot, themeId);
  const files = await readThemeFiles(themePath);
  const issues = validateThemeFiles(themeId, files);

  if (issues.length > 0) {
    throw new ThemeValidationError(issues);
  }

  await ensureAssetDirectories(themePath);

  return normalizeThemeFiles(files);
}

async function readThemeFiles(themePath: string): Promise<RawThemeFiles> {
  const entries = await Promise.all(
    REQUIRED_THEME_FILES.map(async (fileName) => [fileName, await readJson(join(themePath, fileName))])
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

async function ensureAssetDirectories(themePath: string): Promise<void> {
  await Promise.all(
    ["assets/sprites", "assets/terrain", "assets/icons", "assets/backgrounds"].map((directory) =>
      mkdir(join(themePath, directory), { recursive: true })
    )
  );
}
