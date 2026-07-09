import { describe, expect, it } from "vitest";
import { normalizeConfig, validateConfig } from "../src/config/config-validator.js";

const today = new Date("2026-07-09T12:00:00.000Z");

describe("validateConfig", () => {
  it("accepts the MVP configuration shape", () => {
    const issues = validateConfig(
      {
        githubUser: "octocat",
        theme: "middle-earth",
        journey: {
          startDate: "2026-01-01",
          targetXP: 50000,
          xpMultiplier: 1
        },
        display: {
          showStats: true,
          showTitle: true,
          showAchievements: true
        }
      },
      today
    );

    expect(issues).toEqual([]);
  });

  it("defaults the theme and display flags when optional values are omitted", () => {
    const normalized = normalizeConfig({
      githubUser: "octocat",
      journey: {
        startDate: "2026-01-01",
        targetXP: 50000,
        xpMultiplier: 1
      }
    });

    expect(normalized.theme).toBe("middle-earth");
    expect(normalized.display).toEqual({
      showStats: true,
      showTitle: true,
      showAchievements: true
    });
  });

  it("rejects invalid user, date, target XP, and multiplier values", () => {
    const issues = validateConfig(
      {
        githubUser: "-bad-user-",
        theme: "",
        journey: {
          startDate: "2027-01-01",
          targetXP: 0,
          xpMultiplier: -1
        },
        display: {
          showStats: "yes"
        }
      },
      today
    );

    expect(issues.map((issue) => issue.path)).toEqual([
      "githubUser",
      "theme",
      "journey.startDate",
      "journey.targetXP",
      "journey.xpMultiplier",
      "display.showStats"
    ]);
  });
});
