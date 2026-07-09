import type {
  AchievementCategory,
  AchievementConditionType,
  AchievementDefinition,
  RawThemeFiles,
  Theme,
  ThemeMap,
  ThemeMapLocation,
  ThemePalette,
  ThemeValidationIssue
} from "./types.js";
import type { Title } from "../domain/types.js";

const ID_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const ACHIEVEMENT_CATEGORIES = new Set<AchievementCategory>([
  "JOURNEY",
  "XP",
  "CONTRIBUTION",
  "MILESTONE"
]);
const CONDITION_TYPES = new Set<AchievementConditionType>([
  "xp",
  "location",
  "commits",
  "prsOpened",
  "prsMerged",
  "issuesOpened",
  "issuesClosed",
  "reviewsSubmitted",
  "repositoriesCreated",
  "releasesPublished"
]);

export function validateThemeFiles(themeId: string, files: RawThemeFiles): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];

  validateManifest(themeId, files.manifest, issues);
  const locationIds = validateMap(files.map, issues);
  const titleIds = validateTitles(files.titles, issues);
  validateAchievements(files.achievements, locationIds, issues);
  validatePalette(files.palette, issues);

  if (isRecord(files.manifest) && typeof files.manifest.startingTitle === "string") {
    if (!titleIds.has(files.manifest.startingTitle)) {
      issues.push({
        path: "theme.json.startingTitle",
        message: "must match a title id from titles.json"
      });
    }
  }

  return issues;
}

export function normalizeThemeFiles(files: RawThemeFiles): Theme {
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
      id: String(files.manifest.id),
      name: String(files.manifest.name),
      version: String(files.manifest.version),
      author: String(files.manifest.author),
      description: String(files.manifest.description),
      defaultTargetXP: Number(files.manifest.defaultTargetXP),
      startingTitle: String(files.manifest.startingTitle)
    },
    map: normalizeMap(files.map),
    titles: normalizeTitles(files.titles),
    achievements: normalizeAchievements(files.achievements),
    palette: normalizePalette(files.palette)
  };
}

function validateManifest(
  themeId: string,
  manifest: unknown,
  issues: ThemeValidationIssue[]
): void {
  if (!isRecord(manifest)) {
    issues.push({ path: "theme.json", message: "must be an object" });
    return;
  }

  validateString(manifest.id, "theme.json.id", issues);
  if (typeof manifest.id === "string" && manifest.id !== themeId) {
    issues.push({ path: "theme.json.id", message: `must match theme directory "${themeId}"` });
  }

  validateString(manifest.name, "theme.json.name", issues);
  validateString(manifest.author, "theme.json.author", issues);
  validateString(manifest.description, "theme.json.description", issues);
  validateId(manifest.startingTitle, "theme.json.startingTitle", issues);

  if (typeof manifest.version !== "string" || !SEMVER_PATTERN.test(manifest.version)) {
    issues.push({ path: "theme.json.version", message: "must use semver format" });
  }

  validateNonNegativeInteger(manifest.defaultTargetXP, "theme.json.defaultTargetXP", issues);
  if (typeof manifest.defaultTargetXP === "number" && manifest.defaultTargetXP <= 0) {
    issues.push({ path: "theme.json.defaultTargetXP", message: "must be greater than zero" });
  }
}

function validateMap(map: unknown, issues: ThemeValidationIssue[]): Set<string> {
  const locationIds = new Set<string>();

  if (!isRecord(map)) {
    issues.push({ path: "map.json", message: "must be an object" });
    return locationIds;
  }

  validateNonNegativeInteger(map.targetXP, "map.json.targetXP", issues);
  if (typeof map.targetXP === "number" && map.targetXP <= 0) {
    issues.push({ path: "map.json.targetXP", message: "must be greater than zero" });
  }

  if (!Array.isArray(map.locations) || map.locations.length === 0) {
    issues.push({ path: "map.json.locations", message: "must contain at least one location" });
    return locationIds;
  }

  let previousRequiredXP = -1;

  map.locations.forEach((location, index) => {
    const path = `map.json.locations[${index}]`;
    if (!isRecord(location)) {
      issues.push({ path, message: "must be an object" });
      return;
    }

    validateId(location.id, `${path}.id`, issues);
    if (typeof location.id === "string") {
      if (locationIds.has(location.id)) {
        issues.push({ path: `${path}.id`, message: "must be unique" });
      }
      locationIds.add(location.id);
    }

    validateString(location.name, `${path}.name`, issues);
    validateNonNegativeInteger(location.requiredXP, `${path}.requiredXP`, issues);
    validateNumber(location.x, `${path}.x`, issues);

    if (typeof location.requiredXP === "number") {
      if (location.requiredXP < previousRequiredXP) {
        issues.push({
          path: `${path}.requiredXP`,
          message: "must be sorted in ascending order"
        });
      }
      previousRequiredXP = location.requiredXP;
    }

    validateOptionalString(location.terrain, `${path}.terrain`, issues);
    validateOptionalString(location.description, `${path}.description`, issues);
  });

  return locationIds;
}

function validateTitles(titles: unknown, issues: ThemeValidationIssue[]): Set<string> {
  const titleIds = new Set<string>();

  if (!Array.isArray(titles) || titles.length === 0) {
    issues.push({ path: "titles.json", message: "must contain at least one title" });
    return titleIds;
  }

  let previousRequiredXP = -1;

  titles.forEach((title, index) => {
    const path = `titles.json[${index}]`;
    if (!isRecord(title)) {
      issues.push({ path, message: "must be an object" });
      return;
    }

    validateId(title.id, `${path}.id`, issues);
    if (typeof title.id === "string") {
      if (titleIds.has(title.id)) {
        issues.push({ path: `${path}.id`, message: "must be unique" });
      }
      titleIds.add(title.id);
    }

    validateString(title.name, `${path}.name`, issues);
    validateNonNegativeInteger(title.requiredXP, `${path}.requiredXP`, issues);

    if (typeof title.requiredXP === "number") {
      if (title.requiredXP < previousRequiredXP) {
        issues.push({
          path: `${path}.requiredXP`,
          message: "must be sorted in ascending order"
        });
      }
      previousRequiredXP = title.requiredXP;
    }
  });

  return titleIds;
}

function validateAchievements(
  achievements: unknown,
  locationIds: Set<string>,
  issues: ThemeValidationIssue[]
): void {
  const achievementIds = new Set<string>();

  if (!Array.isArray(achievements)) {
    issues.push({ path: "achievements.json", message: "must be an array" });
    return;
  }

  achievements.forEach((achievement, index) => {
    const path = `achievements.json[${index}]`;
    if (!isRecord(achievement)) {
      issues.push({ path, message: "must be an object" });
      return;
    }

    validateId(achievement.id, `${path}.id`, issues);
    if (typeof achievement.id === "string") {
      if (achievementIds.has(achievement.id)) {
        issues.push({ path: `${path}.id`, message: "must be unique" });
      }
      achievementIds.add(achievement.id);
    }

    validateString(achievement.name, `${path}.name`, issues);
    validateString(achievement.description, `${path}.description`, issues);

    if (
      typeof achievement.category !== "string" ||
      !ACHIEVEMENT_CATEGORIES.has(achievement.category as AchievementCategory)
    ) {
      issues.push({ path: `${path}.category`, message: "must be a supported category" });
    }

    validateAchievementCondition(achievement.condition, `${path}.condition`, locationIds, issues);
  });
}

function validateAchievementCondition(
  condition: unknown,
  path: string,
  locationIds: Set<string>,
  issues: ThemeValidationIssue[]
): void {
  if (!isRecord(condition)) {
    issues.push({ path, message: "must be an object" });
    return;
  }

  if (
    typeof condition.type !== "string" ||
    !CONDITION_TYPES.has(condition.type as AchievementConditionType)
  ) {
    issues.push({ path: `${path}.type`, message: "must be a supported condition type" });
    return;
  }

  if (condition.type === "location") {
    validateId(condition.value, `${path}.value`, issues);
    if (typeof condition.value === "string" && !locationIds.has(condition.value)) {
      issues.push({ path: `${path}.value`, message: "must match a location id from map.json" });
    }
    return;
  }

  validateNonNegativeInteger(condition.value, `${path}.value`, issues);
}

function validatePalette(palette: unknown, issues: ThemeValidationIssue[]): void {
  if (!isRecord(palette)) {
    issues.push({ path: "palette.json", message: "must be an object" });
    return;
  }

  for (const key of ["background", "primary", "secondary", "accent", "text"]) {
    const value = palette[key];
    if (typeof value !== "string" || !HEX_COLOR_PATTERN.test(value)) {
      issues.push({ path: `palette.json.${key}`, message: "must be a hex color" });
    }
  }
}

function normalizeMap(map: Record<string, unknown>): ThemeMap {
  return {
    targetXP: Number(map.targetXP),
    locations: (map.locations as Record<string, unknown>[]).map(
      (location): ThemeMapLocation => ({
        id: String(location.id),
        name: String(location.name),
        requiredXP: Number(location.requiredXP),
        x: Number(location.x),
        terrain: toOptionalString(location.terrain),
        description: toOptionalString(location.description)
      })
    )
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
        type: condition.type as AchievementConditionType,
        value: condition.value as string | number
      }
    };
  });
}

function normalizePalette(palette: Record<string, unknown>): ThemePalette {
  return {
    background: String(palette.background),
    primary: String(palette.primary),
    secondary: String(palette.secondary),
    accent: String(palette.accent),
    text: String(palette.text)
  };
}

function validateString(
  value: unknown,
  path: string,
  issues: ThemeValidationIssue[]
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "must be a non-empty string" });
  }
}

function validateOptionalString(
  value: unknown,
  path: string,
  issues: ThemeValidationIssue[]
): void {
  if (value !== undefined && (typeof value !== "string" || value.trim().length === 0)) {
    issues.push({ path, message: "must be a non-empty string when provided" });
  }
}

function validateId(value: unknown, path: string, issues: ThemeValidationIssue[]): void {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    issues.push({ path, message: "must be an uppercase identifier" });
  }
}

function validateNonNegativeInteger(
  value: unknown,
  path: string,
  issues: ThemeValidationIssue[]
): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    issues.push({ path, message: "must be a non-negative integer" });
  }
}

function validateNumber(value: unknown, path: string, issues: ThemeValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ path, message: "must be a number" });
  }
}

function toOptionalString(value: unknown): string | undefined {
  return value === undefined ? undefined : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
