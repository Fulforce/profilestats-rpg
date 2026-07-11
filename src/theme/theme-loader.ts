import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { ThemeValidationError } from "./theme-error.js";
import { normalizeThemeFiles, validateThemeFiles } from "./theme-validator.js";
import type { RawThemeFiles, Theme } from "./types.js";
import { sanitizeSvgAsset } from "./svg-asset-sanitizer.js";

const REQUIRED_THEME_FILES = [
  "theme.json",
  "map.json",
  "titles.json",
  "achievements.json",
  "palette.json"
] as const;
const MAX_ASSET_BYTES = 100 * 1024;
const MAX_THEME_ASSET_BYTES = 500 * 1024;

export async function loadTheme(themeId: string, themesRoot = "themes"): Promise<Theme> {
  const rootPath = resolve(themesRoot);
  const themePath = resolve(rootPath, themeId);

  if (!themePath.startsWith(`${rootPath}${sep}`)) {
    throw new ThemeValidationError([
      { path: "theme", message: "theme path must stay inside the themes directory" }
    ]);
  }

  const loaded = await readThemeFiles(themePath);
  const issues = [...loaded.issues, ...validateThemeFiles(themeId, loaded.files)];
  if (isV1Manifest(loaded.files.manifest)) {
    issues.push(...(await validateV1ThemeDirectory(themePath, themeId)));
  }

  if (issues.length > 0) {
    throw new ThemeValidationError(issues);
  }

  const theme = normalizeThemeFiles(loaded.files);
  const characterPath = join(themePath, "assets", "character.svg");
  const characterSource = await readAsset(characterPath);

  return {
    ...theme,
    assets: {
      character: sanitizeSvgAsset(
        characterSource,
        characterPath,
        `psrpg-${theme.manifest.id}-character`
      )
    }
  };
}

async function readAsset(path: string): Promise<string> {
  try {
    const source = await readFile(path, "utf8");
    if (Buffer.byteLength(source, "utf8") > MAX_ASSET_BYTES) {
      throw new ThemeValidationError([
        { path, message: `must not exceed ${MAX_ASSET_BYTES} bytes` }
      ]);
    }
    return source;
  } catch (error) {
    if (error instanceof ThemeValidationError) throw error;
    const message = error instanceof Error ? error.message : "unknown error";
    throw new ThemeValidationError([{ path, message }]);
  }
}

async function readThemeFiles(
  themePath: string
): Promise<{ files: RawThemeFiles; issues: Array<{ path: string; message: string }> }> {
  const entries = await Promise.all(
    REQUIRED_THEME_FILES.map(async (fileName) => {
      const path = join(themePath, fileName);
      try {
        return {
          fileName,
          value: JSON.parse(await readFile(path, "utf8")) as unknown
        };
      } catch (error) {
        return {
          fileName,
          value: undefined,
          issue: { path: fileName, message: safeFileError(error) }
        };
      }
    })
  );

  return {
    files: {
      manifest: entries.find(({ fileName }) => fileName === "theme.json")?.value,
      map: entries.find(({ fileName }) => fileName === "map.json")?.value,
      titles: entries.find(({ fileName }) => fileName === "titles.json")?.value,
      achievements: entries.find(({ fileName }) => fileName === "achievements.json")?.value,
      palette: entries.find(({ fileName }) => fileName === "palette.json")?.value
    },
    issues: entries.flatMap((entry) => (entry.issue ? [entry.issue] : []))
  };
}

async function validateV1ThemeDirectory(
  themePath: string,
  themeId: string
): Promise<Array<{ path: string; message: string }>> {
  const issues: Array<{ path: string; message: string }> = [];
  try {
    const license = await readFile(join(themePath, "LICENSE.md"), "utf8");
    if (license.trim().length === 0) {
      issues.push({ path: "LICENSE.md", message: "must not be empty" });
    }
  } catch (error) {
    issues.push({ path: "LICENSE.md", message: safeFileError(error) });
  }

  const assetsRoot = join(themePath, "assets");
  let assets: string[] = [];
  try {
    assets = await listAssetFiles(assetsRoot);
  } catch (error) {
    issues.push({ path: "assets", message: safeFileError(error) });
    return issues;
  }
  if (!assets.some((path) => relative(assetsRoot, path) === "character.svg")) {
    issues.push({ path: "assets/character.svg", message: "is required" });
  }

  let totalBytes = 0;
  for (const assetPath of assets) {
    const displayPath = `assets/${relative(assetsRoot, assetPath).split(sep).join("/")}`;
    try {
      const content = await readFile(assetPath);
      const bytes = content.byteLength;
      totalBytes += bytes;
      if (bytes > MAX_ASSET_BYTES) {
        issues.push({ path: displayPath, message: `must not exceed ${MAX_ASSET_BYTES} bytes` });
      }
      if (!assetPath.toLowerCase().endsWith(".svg")) {
        issues.push({ path: displayPath, message: "must be a static SVG asset" });
        continue;
      }
      const source = content.toString("utf8");
      try {
        sanitizeSvgAsset(source, displayPath, `psrpg-${themeId}-validation`);
      } catch (error) {
        if (error instanceof ThemeValidationError) issues.push(...error.issues);
        else issues.push({ path: displayPath, message: safeFileError(error) });
      }
    } catch (error) {
      issues.push({ path: displayPath, message: safeFileError(error) });
    }
  }
  if (totalBytes > MAX_THEME_ASSET_BYTES) {
    issues.push({
      path: "assets",
      message: `combined assets must not exceed ${MAX_THEME_ASSET_BYTES} bytes`
    });
  }
  return issues;
}

async function listAssetFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((first, second) => first.name.localeCompare(second.name));
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`symbolic links are not supported: ${entry.name}`);
    }
    if (entry.isDirectory()) files.push(...(await listAssetFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function isV1Manifest(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    value.schemaVersion === 1
  );
}

function safeFileError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  ) {
    return "is required";
  }
  return error instanceof SyntaxError ? "must contain valid JSON" : "could not be read safely";
}
