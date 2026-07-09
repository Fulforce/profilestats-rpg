import { describe, expect, it } from "vitest";
import { calculateAchievementResult } from "../src/achievement/achievement-engine.js";
import type { Activity, JourneyState } from "../src/domain/types.js";
import type { AchievementDefinition } from "../src/theme/types.js";

const definitions: AchievementDefinition[] = [
  {
    id: "XP_1000",
    name: "First Footsteps",
    description: "Earn 1,000 XP.",
    category: "XP",
    condition: { type: "xp", value: 1000 }
  },
  {
    id: "ENTERED_MORIA",
    name: "Into Darkness",
    description: "Enter the Mines of Moria.",
    category: "JOURNEY",
    condition: { type: "location", value: "MORIA" }
  },
  {
    id: "FIRST_PR_MERGED",
    name: "First Victory",
    description: "Merge your first pull request.",
    category: "CONTRIBUTION",
    condition: { type: "prsMerged", value: 1 }
  },
  {
    id: "FIRST_RELEASE",
    name: "Signal Fire",
    description: "Publish your first release.",
    category: "CONTRIBUTION",
    condition: { type: "releasesPublished", value: 1 }
  }
];

const activity: Activity = {
  commits: 25,
  prsOpened: 2,
  prsMerged: 1,
  issuesOpened: 0,
  issuesClosed: 0,
  reviewsSubmitted: 0,
  repositoriesCreated: 0,
  releasesPublished: 0,
  streaks: 0
};

const journey: JourneyState = {
  xp: 1500,
  targetXP: 50000,
  progressPercent: 3,
  currentLocationId: "MORIA",
  currentLocationName: "Moria",
  nextLocationId: "LOTHLORIEN",
  nextLocationName: "Lothlorien",
  characterX: 400,
  segmentProgressPercent: 0
};

describe("calculateAchievementResult", () => {
  it("evaluates XP, location, and contribution achievements", () => {
    expect(
      calculateAchievementResult(
        definitions,
        { xp: 1500, activity, journey },
        [],
        new Date("2026-07-09T12:00:00Z")
      )
    ).toEqual({
      achievements: ["XP_1000", "ENTERED_MORIA", "FIRST_PR_MERGED"],
      unlockedThisRun: ["XP_1000", "ENTERED_MORIA", "FIRST_PR_MERGED"],
      achievementCount: 3,
      events: [
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "XP_1000" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "ENTERED_MORIA" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "FIRST_PR_MERGED" }
      ]
    });
  });

  it("keeps previously unlocked achievements and only emits new events", () => {
    expect(
      calculateAchievementResult(
        definitions,
        { xp: 1500, activity, journey },
        ["XP_1000"],
        new Date("2026-07-09T12:00:00Z")
      )
    ).toMatchObject({
      achievements: ["XP_1000", "ENTERED_MORIA", "FIRST_PR_MERGED"],
      unlockedThisRun: ["ENTERED_MORIA", "FIRST_PR_MERGED"],
      achievementCount: 3,
      events: [
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "ENTERED_MORIA" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "FIRST_PR_MERGED" }
      ]
    });
  });

  it("does not relock achievements that no longer satisfy their condition", () => {
    const result = calculateAchievementResult(
      definitions,
      {
        xp: 0,
        activity: { ...activity, prsMerged: 0 },
        journey: { ...journey, currentLocationId: "SHIRE", currentLocationName: "The Shire" }
      },
      ["FIRST_PR_MERGED"]
    );

    expect(result).toMatchObject({
      achievements: ["FIRST_PR_MERGED"],
      unlockedThisRun: [],
      achievementCount: 1,
      events: []
    });
  });
});
