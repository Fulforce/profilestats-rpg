import { describe, expect, it } from "vitest";
import { calculateTitleResult } from "../src/title/title-engine.js";
import type { Title } from "../src/domain/types.js";

const titles: Title[] = [
  { id: "HOBBIT", name: "Hobbit", requiredXP: 0 },
  { id: "WANDERER", name: "Wanderer", requiredXP: 1000 },
  { id: "RANGER", name: "Ranger", requiredXP: 5000 },
  { id: "ADVENTURER", name: "Adventurer", requiredXP: 10000 }
];

describe("calculateTitleResult", () => {
  it("selects the highest title whose XP requirement is satisfied", () => {
    expect(
      calculateTitleResult(7500, titles, ["HOBBIT", "WANDERER"], new Date("2026-07-09T12:00:00Z"))
    ).toEqual({
      currentTitleId: "RANGER",
      currentTitleName: "Ranger",
      unlockedTitles: ["HOBBIT", "WANDERER", "RANGER"],
      newlyUnlockedTitle: "RANGER",
      event: {
        date: "2026-07-09",
        type: "TITLE_UNLOCKED",
        value: "RANGER"
      }
    });
  });

  it("does not generate an event for titles already unlocked", () => {
    expect(calculateTitleResult(7500, titles, ["HOBBIT", "WANDERER", "RANGER"])).toEqual({
      currentTitleId: "RANGER",
      currentTitleName: "Ranger",
      unlockedTitles: ["HOBBIT", "WANDERER", "RANGER"],
      newlyUnlockedTitle: undefined,
      event: undefined
    });
  });

  it("returns the starting title at zero XP", () => {
    expect(calculateTitleResult(0, titles, ["HOBBIT"])).toMatchObject({
      currentTitleId: "HOBBIT",
      currentTitleName: "Hobbit",
      unlockedTitles: ["HOBBIT"]
    });
  });

  it("sorts title definitions defensively before evaluating", () => {
    expect(calculateTitleResult(7500, [...titles].reverse(), ["HOBBIT", "WANDERER"])).toMatchObject({
      currentTitleId: "RANGER",
      unlockedTitles: ["HOBBIT", "WANDERER", "RANGER"]
    });
  });
});
