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
});
