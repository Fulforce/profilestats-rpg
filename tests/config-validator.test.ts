import { describe, expect, it } from "vitest";
import { normalizeConfig, validateConfig } from "../src/config/config-validator.js";

const today = new Date("2026-07-09T12:00:00.000Z");

const validConfig = {
  schemaVersion: 1,
  profile: { githubUser: "octocat" },
  theme: { id: "middle-earth" },
  journey: {
    id: "road-to-mordor-2026",
    startDate: "2026-01-01",
    targetXP: 50000,
    xpMultiplier: 1
  },
  display: {
    layout: "standard",
    showStats: true,
    showTitle: true,
    showAchievements: true
  },
  output: {
    svgPath: "output/journey.svg",
    dataDirectory: "data"
  }
};

describe("validateConfig", () => {
  it("accepts the version-1 configuration contract", () => {
    expect(validateConfig(validConfig, today)).toEqual([]);
  });

  it("applies display and output defaults", () => {
    const normalized = normalizeConfig({
      ...validConfig,
      display: undefined,
      output: undefined
    });

    expect(normalized.display).toEqual({
      layout: "standard",
      showStats: true,
      showTitle: true,
      showAchievements: true
    });
    expect(normalized.output).toEqual({
      svgPath: "output/journey.svg",
      dataDirectory: "data"
    });
  });

  it("rejects invalid version, identity, date, target, and multiplier values", () => {
    const issues = validateConfig(
      {
        ...validConfig,
        schemaVersion: 2,
        profile: { githubUser: "-bad-user-" },
        theme: { id: "../private" },
        journey: {
          id: "Bad ID",
          startDate: "2027-01-01",
          targetXP: 0,
          xpMultiplier: 101
        }
      },
      today
    );

    expect(issues.map((issue) => issue.path)).toEqual([
      "schemaVersion",
      "profile.githubUser",
      "theme.id",
      "journey.id",
      "journey.startDate",
      "journey.targetXP",
      "journey.xpMultiplier"
    ]);
  });

  it("rejects unknown keys and paths outside the repository", () => {
    const issues = validateConfig(
      {
        ...validConfig,
        unexpected: true,
        output: {
          svgPath: "../journey.svg",
          dataDirectory: "/tmp/data",
          rawHtml: true
        }
      },
      today
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        { path: "config.unexpected", message: "is not supported" },
        { path: "output.rawHtml", message: "is not supported" },
        { path: "output.svgPath", message: "must stay inside the repository" },
        { path: "output.dataDirectory", message: "must stay inside the repository" }
      ])
    );
  });
});
