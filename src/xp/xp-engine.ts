import type { Activity, XPResult } from "../domain/types.js";
import { AppError } from "../errors/app-error.js";
import { defaultXPRules, XP_RULE_SET_VERSION, type XPRules } from "./xp-rules.js";

export function calculateXP(
  activity: Activity,
  multiplier: number,
  rules: XPRules = defaultXPRules
): XPResult {
  validateActivity(activity);
  validateMultiplier(multiplier);
  validateRules(rules);

  const sources = (Object.keys(rules) as Array<keyof Activity>).map((metric) => {
    const earnedXP = activity[metric] * rules[metric];

    if (!Number.isSafeInteger(earnedXP)) {
      throw new AppError("XP_OVERFLOW", `XP for activity metric "${metric}" exceeds safe limits.`);
    }

    return {
      metric,
      count: activity[metric],
      unitXP: rules[metric],
      earnedXP
    };
  });
  const rawXP = sources.reduce((total, source) => total + source.earnedXP, 0);

  if (!Number.isSafeInteger(rawXP)) {
    throw new AppError("XP_OVERFLOW", "Raw XP exceeds safe limits.");
  }

  const calculatedXP = Math.floor(rawXP * multiplier);

  if (!Number.isSafeInteger(calculatedXP)) {
    throw new AppError("XP_OVERFLOW", "Calculated XP exceeds safe limits.");
  }

  return {
    ruleSetVersion: XP_RULE_SET_VERSION,
    sources,
    rawXP,
    multiplier,
    calculatedXP,
    awardedXP: calculatedXP
  };
}

function validateActivity(activity: Activity): void {
  for (const [key, value] of Object.entries(activity)) {
    if (!Number.isInteger(value) || value < 0) {
      throw new AppError(
        "XP_INVALID_ACTIVITY",
        `Activity field "${key}" must be a non-negative integer.`
      );
    }
  }
}

function validateMultiplier(multiplier: number): void {
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new AppError("XP_INVALID_MULTIPLIER", "XP multiplier must be greater than zero.");
  }
}

function validateRules(rules: XPRules): void {
  for (const [key, value] of Object.entries(rules)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new AppError(
        "XP_INVALID_RULE",
        `XP rule "${key}" must be a non-negative safe integer.`
      );
    }
  }
}
