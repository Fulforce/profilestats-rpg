import { describe, expect, it } from "vitest";
import { validateThemeFiles } from "../src/theme/theme-validator.js";
import type { RawThemeFiles } from "../src/theme/types.js";

const validFiles: RawThemeFiles = {
  manifest: {
    id: "middle-earth",
    name: "Middle-earth",
    version: "1.0.0",
    author: "Theme Author",
    description: "Journey from The Shire to Mount Doom.",
    defaultTargetXP: 50000,
    startingTitle: "HOBBIT"
  },
  map: {
    targetXP: 50000,
    locations: [
      { id: "SHIRE", name: "The Shire", requiredXP: 0, x: 0 },
      { id: "MORIA", name: "Moria", requiredXP: 10000, x: 500 }
    ]
  },
  titles: [
    { id: "HOBBIT", name: "Hobbit", requiredXP: 0 },
    { id: "RANGER", name: "Ranger", requiredXP: 5000 }
  ],
  achievements: [
    {
      id: "ENTERED_MORIA",
      name: "Into Darkness",
      description: "Enter the Mines of Moria.",
      category: "JOURNEY",
      condition: { type: "location", value: "MORIA" }
    }
  ],
  palette: {
    background: "#FDF6E3",
    primary: "#2E7D32",
    secondary: "#8D6E63",
    accent: "#FFB300",
    text: "#222222"
  }
};

const validV1Files: RawThemeFiles = {
  manifest: {
    schemaVersion: 1,
    id: "test-theme",
    name: "Test Theme",
    version: "1.0.0",
    author: "Theme Author",
    description: "A safe contract fixture.",
    defaultTargetXP: 1000,
    startingTitleId: "newcomer"
  },
  map: {
    targetXP: 1000,
    locations: [
      { id: "start", name: "Start", requiredXP: 0, x: 0, y: 180 },
      { id: "finish", name: "Finish", requiredXP: 1000, x: 1200, y: 180 }
    ]
  },
  titles: [
    { id: "newcomer", name: "Newcomer", requiredXP: 0 },
    { id: "finisher", name: "Finisher", requiredXP: 1000 }
  ],
  achievements: [
    {
      id: "reach-finish",
      name: "Reached the Finish",
      description: "Complete the route.",
      category: "JOURNEY",
      condition: { metric: "location", operator: "reached", value: "finish" }
    },
    {
      id: "first-xp",
      name: "First XP",
      description: "Earn one XP.",
      category: "XP",
      condition: { metric: "xp", operator: "gte", value: 1 }
    }
  ],
  palette: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    primary: "#006400",
    secondary: "#5A3A20",
    accent: "#8B4513",
    text: "#111111",
    mutedText: "#595959",
    route: "#666666",
    routeComplete: "#006400"
  }
};

describe("validateThemeFiles", () => {
  it("accepts a valid theme payload", () => {
    expect(validateThemeFiles("middle-earth", validFiles)).toEqual([]);
  });

  it("rejects cross-file references that do not resolve", () => {
    const issues = validateThemeFiles("middle-earth", {
      ...validFiles,
      manifest: {
        ...(validFiles.manifest as object),
        startingTitle: "WIZARD"
      },
      achievements: [
        {
          id: "LOST",
          name: "Lost",
          description: "Reference an unknown location.",
          category: "JOURNEY",
          condition: { type: "location", value: "UNKNOWN" }
        }
      ]
    });

    expect(issues.map((issue) => issue.path)).toEqual([
      "achievements.json[0].condition.value",
      "theme.json.startingTitle"
    ]);
  });

  it("rejects unsorted locations and duplicate titles", () => {
    const issues = validateThemeFiles("middle-earth", {
      ...validFiles,
      map: {
        targetXP: 50000,
        locations: [
          { id: "MORIA", name: "Moria", requiredXP: 10000, x: 500 },
          { id: "SHIRE", name: "The Shire", requiredXP: 0, x: 0 }
        ]
      },
      titles: [
        { id: "HOBBIT", name: "Hobbit", requiredXP: 0 },
        { id: "HOBBIT", name: "Hobbit Again", requiredXP: 1000 }
      ]
    });

    expect(issues.map((issue) => issue.path)).toEqual([
      "map.json.locations[1].requiredXP",
      "titles.json[1].id"
    ]);
  });

  it("accepts the complete schema-version-1 contract", () => {
    expect(validateThemeFiles("test-theme", validV1Files)).toEqual([]);
  });

  it("accumulates schema, reference, boundary, operator, and contrast issues", () => {
    const issues = validateThemeFiles("test-theme", {
      ...validV1Files,
      manifest: {
        ...(validV1Files.manifest as Record<string, unknown>),
        unexpected: true,
        startingTitleId: "missing-title",
        defaultTargetXP: 2000
      },
      map: {
        targetXP: 1000,
        locations: [
          { id: "START", name: "<Start>", requiredXP: 5, x: -1, y: 361 },
          { id: "finish", name: "Finish", requiredXP: 5, x: 1200, y: 180 }
        ]
      },
      titles: [
        { id: "newcomer", name: "Newcomer", requiredXP: 1 },
        { id: "newcomer", name: "Again", requiredXP: 1 }
      ],
      achievements: [
        {
          id: "bad-achievement",
          name: "Bad",
          description: "Invalid combinations.",
          category: "JOURNEY",
          condition: { metric: "location", operator: "gte", value: "unknown" }
        }
      ],
      palette: {
        ...(validV1Files.palette as Record<string, unknown>),
        text: "#FFFFFF",
        mutedText: "#EEEEEE"
      }
    });
    const paths = issues.map((issue) => issue.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "theme.json.unexpected",
        "theme.json.startingTitleId",
        "theme.json.defaultTargetXP",
        "map.json.locations[0].id",
        "map.json.locations[0].name",
        "map.json.locations[0].requiredXP",
        "map.json.locations[0].x",
        "map.json.locations[0].y",
        "map.json.locations[1].requiredXP",
        "titles.json[0].requiredXP",
        "titles.json[1].id",
        "titles.json[1].requiredXP",
        "achievements.json[0].condition.operator",
        "achievements.json[0].condition.value",
        "palette.json.text",
        "palette.json.mutedText"
      ])
    );
    expect(issues.length).toBeGreaterThan(16);
  });

  it("requires schema version 1 for themes other than the migration exception", () => {
    expect(validateThemeFiles("new-theme", validFiles)).toEqual(
      expect.arrayContaining([
        { path: "theme.json.schemaVersion", message: "must be the integer 1" }
      ])
    );
  });
});
