import { isAbsolute } from "node:path";
import type { AppConfig, ConfigValidationIssue, DisplayConfig, OutputConfig } from "./types.js";

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ROOT_KEYS = new Set(["schemaVersion", "profile", "theme", "journey", "display", "output"]);
const PROFILE_KEYS = new Set(["githubUser"]);
const THEME_KEYS = new Set(["id"]);
const JOURNEY_KEYS = new Set(["id", "startDate", "targetXP", "xpMultiplier"]);
const DISPLAY_KEYS = new Set(["layout", "showStats", "showTitle", "showAchievements"]);
const OUTPUT_KEYS = new Set(["svgPath", "dataDirectory"]);

export function validateConfig(value: unknown, today = new Date()): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  if (!isRecord(value)) {
    return [{ path: "config", message: "must be a YAML object" }];
  }

  validateUnknownKeys(value, ROOT_KEYS, "config", issues);
  if (value.schemaVersion !== 1) {
    issues.push({ path: "schemaVersion", message: "must be the integer 1" });
  }

  if (!isRecord(value.profile)) {
    issues.push({ path: "profile", message: "is required" });
  } else {
    validateUnknownKeys(value.profile, PROFILE_KEYS, "profile", issues);
    validateGithubUser(value.profile.githubUser, issues);
  }

  if (!isRecord(value.theme)) {
    issues.push({ path: "theme", message: "is required" });
  } else {
    validateUnknownKeys(value.theme, THEME_KEYS, "theme", issues);
    validateId(value.theme.id, "theme.id", issues);
  }

  if (!isRecord(value.journey)) {
    issues.push({ path: "journey", message: "is required" });
  } else {
    validateUnknownKeys(value.journey, JOURNEY_KEYS, "journey", issues);
    validateId(value.journey.id, "journey.id", issues);
    validateStartDate(value.journey.startDate, today, issues);
    validateTargetXP(value.journey.targetXP, issues);
    validateXpMultiplier(value.journey.xpMultiplier, issues);
  }

  validateDisplay(value.display, issues);
  validateOutput(value.output, issues);
  return issues;
}

export function normalizeConfig(value: unknown): AppConfig {
  if (
    !isRecord(value) ||
    !isRecord(value.profile) ||
    !isRecord(value.theme) ||
    !isRecord(value.journey)
  ) {
    throw new Error("Cannot normalize an invalid configuration.");
  }

  return {
    schemaVersion: 1,
    profile: { githubUser: String(value.profile.githubUser) },
    theme: { id: String(value.theme.id) },
    journey: {
      id: String(value.journey.id),
      startDate: String(value.journey.startDate),
      targetXP: Number(value.journey.targetXP),
      xpMultiplier: Number(value.journey.xpMultiplier)
    },
    display: normalizeDisplay(value.display),
    output: normalizeOutput(value.output)
  };
}

function validateDisplay(value: unknown, issues: ConfigValidationIssue[]): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    issues.push({ path: "display", message: "must be an object when provided" });
    return;
  }

  validateUnknownKeys(value, DISPLAY_KEYS, "display", issues);
  if (value.layout !== undefined && value.layout !== "standard" && value.layout !== "compact") {
    issues.push({ path: "display.layout", message: "must be standard or compact" });
  }
  validateBoolean(value.showStats, "display.showStats", issues);
  validateBoolean(value.showTitle, "display.showTitle", issues);
  validateBoolean(value.showAchievements, "display.showAchievements", issues);
}

function validateOutput(value: unknown, issues: ConfigValidationIssue[]): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    issues.push({ path: "output", message: "must be an object when provided" });
    return;
  }

  validateUnknownKeys(value, OUTPUT_KEYS, "output", issues);
  validateRelativePath(value.svgPath, "output.svgPath", issues);
  validateRelativePath(value.dataDirectory, "output.dataDirectory", issues);
}

function normalizeDisplay(value: unknown): DisplayConfig {
  const display = isRecord(value) ? value : {};
  return {
    layout: display.layout === "compact" ? "compact" : "standard",
    showStats: display.showStats === undefined ? true : Boolean(display.showStats),
    showTitle: display.showTitle === undefined ? true : Boolean(display.showTitle),
    showAchievements:
      display.showAchievements === undefined ? true : Boolean(display.showAchievements)
  };
}

function normalizeOutput(value: unknown): OutputConfig {
  const output = isRecord(value) ? value : {};
  return {
    svgPath: typeof output.svgPath === "string" ? output.svgPath : "output/journey.svg",
    dataDirectory: typeof output.dataDirectory === "string" ? output.dataDirectory : "data"
  };
}

function validateGithubUser(value: unknown, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: "profile.githubUser", message: "is required" });
  } else if (!GITHUB_USERNAME_PATTERN.test(value)) {
    issues.push({ path: "profile.githubUser", message: "must be a valid GitHub username" });
  }
}

function validateId(value: unknown, path: string, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    issues.push({ path, message: "must be a lowercase identifier of at most 64 characters" });
  }
}

function validateStartDate(value: unknown, today: Date, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    issues.push({ path: "journey.startDate", message: "must use YYYY-MM-DD format" });
    return;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    issues.push({ path: "journey.startDate", message: "must be a valid calendar date" });
    return;
  }

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (parsed.getTime() > todayUtc) {
    issues.push({ path: "journey.startDate", message: "cannot be in the future" });
  }
}

function validateTargetXP(value: unknown, issues: ConfigValidationIssue[]): void {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 1_000_000_000
  ) {
    issues.push({ path: "journey.targetXP", message: "must be an integer from 1 to 1000000000" });
  }
}

function validateXpMultiplier(value: unknown, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100) {
    issues.push({
      path: "journey.xpMultiplier",
      message: "must be greater than zero and at most 100"
    });
  }
}

function validateBoolean(value: unknown, path: string, issues: ConfigValidationIssue[]): void {
  if (value !== undefined && typeof value !== "boolean") {
    issues.push({ path, message: "must be a boolean" });
  }
}

function validateRelativePath(value: unknown, path: string, issues: ConfigValidationIssue[]): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "must be a non-empty relative path" });
    return;
  }

  const segments = value.split(/[\\/]+/);
  if (isAbsolute(value) || segments.includes("..") || value.includes("\0")) {
    issues.push({ path, message: "must stay inside the repository" });
  }
}

function validateUnknownKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
  issues: ConfigValidationIssue[]
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issues.push({ path: `${path}.${key}`, message: "is not supported" });
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
