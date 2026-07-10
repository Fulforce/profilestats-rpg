import { describe, expect, it } from "vitest";
import { calculateXP } from "../src/xp/xp-engine.js";
import type { Activity } from "../src/domain/types.js";

const exampleActivity: Activity = {
  commits: 500,
  prsOpened: 10,
  prsMerged: 8,
  issuesOpened: 20,
  issuesClosed: 15,
  reviewsSubmitted: 12,
  repositoriesCreated: 2,
  releasesPublished: 1,
  streaks: 3
};

describe("calculateXP", () => {
  it("calculates raw XP using the MVP defaults from the spec", () => {
    const result = calculateXP(exampleActivity, 1);

    expect(result).toMatchObject({
      ruleSetVersion: "1.0.0",
      rawXP: 3000,
      multiplier: 1,
      calculatedXP: 3000,
      awardedXP: 3000
    });
    expect(result.sources).toHaveLength(9);
    expect(result.sources).toContainEqual({
      metric: "prsMerged",
      count: 8,
      unitXP: 40,
      earnedXP: 320
    });
    expect(result.sources.reduce((total, source) => total + source.earnedXP, 0)).toBe(result.rawXP);
  });

  it("floors calculated XP after applying the multiplier", () => {
    expect(calculateXP(exampleActivity, 1.0005)).toMatchObject({
      rawXP: 3000,
      multiplier: 1.0005,
      calculatedXP: 3001,
      awardedXP: 3001
    });
  });

  it("accepts configurable XP rules", () => {
    const result = calculateXP(exampleActivity, 1, {
      commits: 2,
      prsOpened: 0,
      prsMerged: 0,
      issuesOpened: 0,
      issuesClosed: 0,
      reviewsSubmitted: 0,
      repositoriesCreated: 0,
      releasesPublished: 0,
      streaks: 0
    });

    expect(result.rawXP).toBe(1000);
  });
});
