import type { RawThemeFiles, ThemeValidationIssue } from "./types.js";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const METRICS = new Set([
  "xp",
  "location",
  "commits",
  "prsOpened",
  "prsMerged",
  "issuesOpened",
  "issuesClosed",
  "reviewsSubmitted",
  "repositoriesCreated",
  "releasesPublished",
  "streaks"
]);
const CATEGORIES = new Set(["JOURNEY", "XP", "CONTRIBUTION", "MILESTONE"]);
const PALETTE_KEYS = [
  "background",
  "surface",
  "primary",
  "secondary",
  "accent",
  "text",
  "mutedText",
  "route",
  "routeComplete"
] as const;

export function validateThemeV1Files(
  themeId: string,
  files: RawThemeFiles
): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];
  const manifest = validateManifest(themeId, files.manifest, issues);
  const map = validateMap(files.map, issues);
  const titles = validateTitles(files.titles, map.targetXP, issues);
  validateAchievements(files.achievements, map.locationIds, issues);
  validatePalette(files.palette, issues);

  if (manifest.startingTitleId) {
    const startingTitle = titles.get(manifest.startingTitleId);
    if (startingTitle === undefined) {
      issues.push({
        path: "theme.json.startingTitleId",
        message: "must reference a title from titles.json"
      });
    } else if (startingTitle !== 0) {
      issues.push({ path: "theme.json.startingTitleId", message: "must require 0 XP" });
    }
  }
  if (
    manifest.defaultTargetXP !== undefined &&
    map.targetXP !== undefined &&
    manifest.defaultTargetXP !== map.targetXP
  ) {
    issues.push({
      path: "theme.json.defaultTargetXP",
      message: "must equal map.json.targetXP"
    });
  }
  return issues;
}

function validateManifest(
  themeId: string,
  value: unknown,
  issues: ThemeValidationIssue[]
): { startingTitleId?: string; defaultTargetXP?: number } {
  if (!isRecord(value)) {
    issues.push({ path: "theme.json", message: "must be an object" });
    return {};
  }
  unknownKeys(
    value,
    [
      "schemaVersion",
      "id",
      "name",
      "version",
      "author",
      "description",
      "defaultTargetXP",
      "startingTitleId"
    ],
    "theme.json",
    issues
  );
  if (value.schemaVersion !== 1) {
    issues.push({ path: "theme.json.schemaVersion", message: "must be the integer 1" });
  }
  validateId(value.id, "theme.json.id", issues);
  if (typeof value.id === "string" && value.id !== themeId) {
    issues.push({ path: "theme.json.id", message: `must match theme directory "${themeId}"` });
  }
  validateText(value.name, "theme.json.name", 64, issues);
  validateText(value.author, "theme.json.author", 100, issues);
  validateText(value.description, "theme.json.description", 160, issues);
  validateId(value.startingTitleId, "theme.json.startingTitleId", issues);
  if (typeof value.version !== "string" || !SEMVER_PATTERN.test(value.version)) {
    issues.push({ path: "theme.json.version", message: "must use semantic versioning" });
  }
  positiveInteger(value.defaultTargetXP, "theme.json.defaultTargetXP", issues);
  return {
    startingTitleId: typeof value.startingTitleId === "string" ? value.startingTitleId : undefined,
    defaultTargetXP: typeof value.defaultTargetXP === "number" ? value.defaultTargetXP : undefined
  };
}

function validateMap(
  value: unknown,
  issues: ThemeValidationIssue[]
): { locationIds: Set<string>; targetXP?: number } {
  const locationIds = new Set<string>();
  if (!isRecord(value)) {
    issues.push({ path: "map.json", message: "must be an object" });
    return { locationIds };
  }
  unknownKeys(value, ["targetXP", "locations"], "map.json", issues);
  positiveInteger(value.targetXP, "map.json.targetXP", issues);
  const targetXP = typeof value.targetXP === "number" ? value.targetXP : undefined;
  if (!Array.isArray(value.locations) || value.locations.length < 2) {
    issues.push({ path: "map.json.locations", message: "must contain at least two locations" });
    return { locationIds, targetXP };
  }
  let previousXP = -1;
  value.locations.forEach((location, index) => {
    const path = `map.json.locations[${index}]`;
    if (!isRecord(location)) {
      issues.push({ path, message: "must be an object" });
      return;
    }
    unknownKeys(
      location,
      ["id", "name", "requiredXP", "x", "y", "description", "terrain", "landmark"],
      path,
      issues
    );
    validateUniqueId(location.id, `${path}.id`, locationIds, issues);
    validateText(location.name, `${path}.name`, 64, issues);
    validateOptionalText(location.description, `${path}.description`, 160, issues);
    validateOptionalText(location.terrain, `${path}.terrain`, 64, issues);
    if (location.landmark !== undefined && typeof location.landmark !== "boolean") {
      issues.push({ path: `${path}.landmark`, message: "must be a boolean" });
    }
    nonNegativeInteger(location.requiredXP, `${path}.requiredXP`, issues);
    coordinate(location.x, 0, 1200, `${path}.x`, issues);
    coordinate(location.y, 0, 360, `${path}.y`, issues);
    if (typeof location.requiredXP === "number" && Number.isSafeInteger(location.requiredXP)) {
      if (location.requiredXP <= previousXP) {
        issues.push({ path: `${path}.requiredXP`, message: "must be strictly increasing" });
      }
      if (index === 0 && location.requiredXP !== 0) {
        issues.push({ path: `${path}.requiredXP`, message: "first location must require 0 XP" });
      }
      previousXP = location.requiredXP;
    }
  });
  const last = value.locations.at(-1);
  if (isRecord(last) && targetXP !== undefined && last.requiredXP !== targetXP) {
    issues.push({
      path: `map.json.locations[${value.locations.length - 1}].requiredXP`,
      message: "final location must equal map.json.targetXP"
    });
  }
  return { locationIds, targetXP };
}

function validateTitles(
  value: unknown,
  targetXP: number | undefined,
  issues: ThemeValidationIssue[]
): Map<string, number> {
  const titles = new Map<string, number>();
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path: "titles.json", message: "must contain at least one title" });
    return titles;
  }
  let previousXP = -1;
  value.forEach((title, index) => {
    const path = `titles.json[${index}]`;
    if (!isRecord(title)) {
      issues.push({ path, message: "must be an object" });
      return;
    }
    unknownKeys(title, ["id", "name", "requiredXP"], path, issues);
    validateId(title.id, `${path}.id`, issues);
    if (typeof title.id === "string") {
      if (titles.has(title.id)) issues.push({ path: `${path}.id`, message: "must be unique" });
      if (typeof title.requiredXP === "number") titles.set(title.id, title.requiredXP);
    }
    validateText(title.name, `${path}.name`, 64, issues);
    nonNegativeInteger(title.requiredXP, `${path}.requiredXP`, issues);
    if (typeof title.requiredXP === "number" && Number.isSafeInteger(title.requiredXP)) {
      if (title.requiredXP <= previousXP) {
        issues.push({ path: `${path}.requiredXP`, message: "must be strictly increasing" });
      }
      if (index === 0 && title.requiredXP !== 0) {
        issues.push({ path: `${path}.requiredXP`, message: "first title must require 0 XP" });
      }
      if (targetXP !== undefined && title.requiredXP > targetXP) {
        issues.push({ path: `${path}.requiredXP`, message: "must not exceed map targetXP" });
      }
      previousXP = title.requiredXP;
    }
  });
  return titles;
}

function validateAchievements(
  value: unknown,
  locationIds: Set<string>,
  issues: ThemeValidationIssue[]
): void {
  const ids = new Set<string>();
  if (!Array.isArray(value)) {
    issues.push({ path: "achievements.json", message: "must be an array" });
    return;
  }
  value.forEach((achievement, index) => {
    const path = `achievements.json[${index}]`;
    if (!isRecord(achievement)) {
      issues.push({ path, message: "must be an object" });
      return;
    }
    unknownKeys(achievement, ["id", "name", "description", "category", "condition"], path, issues);
    validateUniqueId(achievement.id, `${path}.id`, ids, issues);
    validateText(achievement.name, `${path}.name`, 64, issues);
    validateText(achievement.description, `${path}.description`, 160, issues);
    if (typeof achievement.category !== "string" || !CATEGORIES.has(achievement.category)) {
      issues.push({ path: `${path}.category`, message: "must be a supported category" });
    }
    validateCondition(achievement.condition, `${path}.condition`, locationIds, issues);
  });
}

function validateCondition(
  value: unknown,
  path: string,
  locationIds: Set<string>,
  issues: ThemeValidationIssue[]
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object" });
    return;
  }
  unknownKeys(value, ["metric", "operator", "value"], path, issues);
  if (typeof value.metric !== "string" || !METRICS.has(value.metric)) {
    issues.push({ path: `${path}.metric`, message: "must be a supported metric" });
    return;
  }
  const location = value.metric === "location";
  const expectedOperator = location ? "reached" : "gte";
  if (value.operator !== expectedOperator) {
    issues.push({ path: `${path}.operator`, message: `must be ${expectedOperator}` });
  }
  if (location) {
    validateId(value.value, `${path}.value`, issues);
    if (typeof value.value === "string" && !locationIds.has(value.value)) {
      issues.push({ path: `${path}.value`, message: "must reference a location from map.json" });
    }
  } else {
    positiveInteger(value.value, `${path}.value`, issues);
  }
}

function validatePalette(value: unknown, issues: ThemeValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path: "palette.json", message: "must be an object" });
    return;
  }
  unknownKeys(value, [...PALETTE_KEYS], "palette.json", issues);
  for (const key of PALETTE_KEYS) {
    if (typeof value[key] !== "string" || !COLOR_PATTERN.test(value[key])) {
      issues.push({ path: `palette.json.${key}`, message: "must be a six-digit hex color" });
    }
  }
  for (const [foreground, background] of [
    ["text", "background"],
    ["text", "surface"],
    ["mutedText", "background"],
    ["mutedText", "surface"]
  ] as const) {
    const fg = value[foreground];
    const bg = value[background];
    if (
      typeof fg === "string" &&
      COLOR_PATTERN.test(fg) &&
      typeof bg === "string" &&
      COLOR_PATTERN.test(bg)
    ) {
      const ratio = contrastRatio(fg, bg);
      if (ratio < 4.5) {
        issues.push({
          path: `palette.json.${foreground}`,
          message: `contrast against ${background} must be at least 4.5:1 (received ${ratio.toFixed(2)}:1)`
        });
      }
    }
  }
}

function contrastRatio(first: string, second: string): number {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function validateUniqueId(
  value: unknown,
  path: string,
  ids: Set<string>,
  issues: ThemeValidationIssue[]
): void {
  validateId(value, path, issues);
  if (typeof value === "string") {
    if (ids.has(value)) issues.push({ path, message: "must be unique" });
    ids.add(value);
  }
}

function validateId(value: unknown, path: string, issues: ThemeValidationIssue[]): void {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    issues.push({ path, message: "must be a lowercase kebab-case identifier" });
  }
}

function validateText(
  value: unknown,
  path: string,
  maximum: number,
  issues: ThemeValidationIssue[]
): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    [...value.trim()].length > maximum
  ) {
    issues.push({ path, message: `must contain 1 through ${maximum} characters` });
  } else if (
    value.includes("<") ||
    value.includes(">") ||
    [...value].some((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code <= 31 || code === 127;
    })
  ) {
    issues.push({ path, message: "must not contain control characters or markup" });
  }
}

function validateOptionalText(
  value: unknown,
  path: string,
  maximum: number,
  issues: ThemeValidationIssue[]
): void {
  if (value !== undefined) validateText(value, path, maximum, issues);
}

function positiveInteger(value: unknown, path: string, issues: ThemeValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    issues.push({ path, message: "must be a positive safe integer" });
  }
}

function nonNegativeInteger(value: unknown, path: string, issues: ThemeValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    issues.push({ path, message: "must be a non-negative safe integer" });
  }
}

function coordinate(
  value: unknown,
  minimum: number,
  maximum: number,
  path: string,
  issues: ThemeValidationIssue[]
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    issues.push({ path, message: `must be a number from ${minimum} through ${maximum}` });
  }
}

function unknownKeys(
  value: Record<string, unknown>,
  allowed: string[],
  path: string,
  issues: ThemeValidationIssue[]
): void {
  const keys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) issues.push({ path: `${path}.${key}`, message: "is not supported" });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
