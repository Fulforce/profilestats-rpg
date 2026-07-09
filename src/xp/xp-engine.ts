import type { Activity, XPResult } from "../domain/types.js";
import { defaultXPRules, type XPRules } from "./xp-rules.js";

export function calculateXP(
  activity: Activity,
  multiplier: number,
  rules: XPRules = defaultXPRules
): XPResult {
  validateActivity(activity);
  validateMultiplier(multiplier);
  validateRules(rules);

  const rawXP = (Object.keys(rules) as Array<keyof Activity>).reduce(
    (total, key) => total + activity[key] * rules[key],
    0
  );

  return {
    rawXP,
    multiplier,
    finalXP: Math.round(rawXP * multiplier)
  };
}

function validateActivity(activity: Activity): void {
  for (const [key, value] of Object.entries(activity)) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Activity field "${key}" must be a non-negative integer.`);
    }
  }
}

function validateMultiplier(multiplier: number): void {
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error("XP multiplier must be greater than zero.");
  }
}

function validateRules(rules: XPRules): void {
  for (const [key, value] of Object.entries(rules)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`XP rule "${key}" must be a non-negative number.`);
    }
  }
}
