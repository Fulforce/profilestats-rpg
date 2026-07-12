import type {
  AchievementCategory,
  AchievementConditionType,
  AchievementDefinition,
  RawThemeFiles,
  ThemeData,
  ThemeMap,
  ThemeMapLocation,
  ThemePalette,
  ThemeValidationIssue
} from "./types.js";
import type { Title } from "../domain/types.js";
import { validateThemeV1Files } from "./theme-v1-validator.js";

export function validateThemeFiles(themeId: string, files: RawThemeFiles): ThemeValidationIssue[] {
  return validateThemeV1Files(themeId, files);
}

export function normalizeThemeFiles(files: RawThemeFiles): ThemeData {
  if (
    !isRecord(files.manifest) ||
    !isRecord(files.map) ||
    !Array.isArray(files.titles) ||
    !Array.isArray(files.achievements) ||
    !isRecord(files.palette)
  ) {
    throw new Error("Cannot normalize invalid theme files.");
  }

  return {
    manifest: {
      schemaVersion: 1,
      id: String(files.manifest.id),
      name: String(files.manifest.name),
      version: String(files.manifest.version),
      author: String(files.manifest.author),
      description: String(files.manifest.description),
      defaultTargetXP: Number(files.manifest.defaultTargetXP),
      startingTitle: String(files.manifest.startingTitleId)
    },
    map: normalizeMap(files.map),
    titles: normalizeTitles(files.titles),
    achievements: normalizeAchievements(files.achievements),
    palette: normalizePalette(files.palette)
  };
}

function normalizeMap(map: Record<string, unknown>): ThemeMap {
  return {
    targetXP: Number(map.targetXP),
    locations: (map.locations as Record<string, unknown>[]).map((location): ThemeMapLocation => ({
      id: String(location.id),
      name: String(location.name),
      requiredXP: Number(location.requiredXP),
      x: Number(location.x),
      y: Number(location.y),
      terrain: toOptionalString(location.terrain),
      description: toOptionalString(location.description),
      landmark: toOptionalBoolean(location.landmark)
    }))
  };
}

function normalizeTitles(titles: unknown[]): Title[] {
  return titles.map((title) => {
    const record = title as Record<string, unknown>;

    return {
      id: String(record.id),
      name: String(record.name),
      requiredXP: Number(record.requiredXP)
    };
  });
}

function normalizeAchievements(achievements: unknown[]): AchievementDefinition[] {
  return achievements.map((achievement) => {
    const record = achievement as Record<string, unknown>;
    const condition = record.condition as Record<string, unknown>;

    return {
      id: String(record.id),
      name: String(record.name),
      description: String(record.description),
      category: record.category as AchievementCategory,
      condition: {
        type: condition.metric as AchievementConditionType,
        value: condition.value as string | number
      }
    };
  });
}

function normalizePalette(palette: Record<string, unknown>): ThemePalette {
  return {
    background: String(palette.background),
    primary: String(palette.routeComplete),
    secondary: String(palette.mutedText),
    accent: String(palette.accent),
    text: String(palette.text)
  };
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return value === undefined ? undefined : Boolean(value);
}

function toOptionalString(value: unknown): string | undefined {
  return value === undefined ? undefined : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
