import type { AppConfig, ConfigValidationIssue, DisplayConfig } from "./types.js";

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function validateConfig(value: unknown, today = new Date()): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  if (!isRecord(value)) {
    return [{ path: "config", message: "must be a YAML object" }];
  }

  validateGithubUser(value.githubUser, issues);
  validateTheme(value.theme, issues);

  if (!isRecord(value.journey)) {
    issues.push({ path: "journey", message: "is required" });
  } else {
    validateStartDate(value.journey.startDate, today, issues);
    validateTargetXP(value.journey.targetXP, issues);
    validateXpMultiplier(value.journey.xpMultiplier, issues);
  }

  if (value.display !== undefined && !isRecord(value.display)) {
    issues.push({ path: "display", message: "must be an object when provided" });
  } else if (isRecord(value.display)) {
    validateBoolean(value.display.showStats, "display.showStats", issues);
    validateBoolean(value.display.showTitle, "display.showTitle", issues);
    validateBoolean(value.display.showAchievements, "display.showAchievements", issues);
  }

  return issues;
}

export function normalizeConfig(value: unknown): AppConfig {
  if (!isRecord(value) || !isRecord(value.journey)) {
    throw new Error("Cannot normalize an invalid configuration.");
  }

  const display = isRecord(value.display) ? value.display : {};

  return {
    githubUser: String(value.githubUser),
    theme: String(value.theme ?? "middle-earth"),
    journey: {
      startDate: String(value.journey.startDate),
      targetXP: Number(value.journey.targetXP),
      xpMultiplier: Number(value.journey.xpMultiplier)
    },
    display: normalizeDisplay(display)
  };
}

function normalizeDisplay(display: Record<string, unknown>): DisplayConfig {
  return {
    showStats: display.showStats === undefined ? true : Boolean(display.showStats),
    showTitle: display.showTitle === undefined ? true : Boolean(display.showTitle),
    showAchievements: display.showAchievements === undefined ? true : Boolean(display.showAchievements)
  };
}

function validateGithubUser(value: unknown, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: "githubUser", message: "is required" });
    return;
  }

  if (!GITHUB_USERNAME_PATTERN.test(value)) {
    issues.push({ path: "githubUser", message: "must be a valid GitHub username" });
  }
}

function validateTheme(value: unknown, issues: ConfigValidationIssue[]): void {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: "theme", message: "must be a non-empty string" });
  }
}

function validateStartDate(
  value: unknown,
  today: Date,
  issues: ConfigValidationIssue[]
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path: "journey.startDate", message: "is required" });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    issues.push({ path: "journey.startDate", message: "must be an ISO date in YYYY-MM-DD format" });
    return;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    issues.push({ path: "journey.startDate", message: "must be a valid calendar date" });
    return;
  }

  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (parsed.getTime() > todayUtc.getTime()) {
    issues.push({ path: "journey.startDate", message: "cannot be in the future" });
  }
}

function validateTargetXP(value: unknown, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    issues.push({ path: "journey.targetXP", message: "must be an integer greater than zero" });
  }
}

function validateXpMultiplier(value: unknown, issues: ConfigValidationIssue[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    issues.push({ path: "journey.xpMultiplier", message: "must be greater than zero" });
  }
}

function validateBoolean(
  value: unknown,
  path: string,
  issues: ConfigValidationIssue[]
): void {
  if (value !== undefined && typeof value !== "boolean") {
    issues.push({ path, message: "must be a boolean" });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
