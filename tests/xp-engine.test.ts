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
    expect(calculateXP(exampleActivity, 1)).toEqual({
      rawXP: 2775,
      multiplier: 1,
      finalXP: 2775
    });
  });

  it("rounds final XP after applying the multiplier", () => {
    expect(calculateXP(exampleActivity, 1.5)).toEqual({
      rawXP: 2775,
      multiplier: 1.5,
      finalXP: 4163
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
