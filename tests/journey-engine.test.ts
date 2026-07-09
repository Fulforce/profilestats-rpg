import { describe, expect, it } from "vitest";
import { calculateJourneyState } from "../src/journey/journey-engine.js";
import type { ThemeMap } from "../src/theme/types.js";

const map: ThemeMap = {
  targetXP: 1000,
  locations: [
    { id: "START", name: "Start", requiredXP: 0, x: 0 },
    { id: "MIDDLE", name: "Middle", requiredXP: 400, x: 40 },
    { id: "END", name: "End", requiredXP: 1000, x: 100 }
  ]
};

describe("calculateJourneyState", () => {
  it("starts at the first location", () => {
    expect(calculateJourneyState(0, map)).toEqual({
      xp: 0,
      targetXP: 1000,
      progressPercent: 0,
      currentLocationId: "START",
      currentLocationName: "Start",
      nextLocationId: "MIDDLE",
      nextLocationName: "Middle",
      characterX: 0,
      segmentProgressPercent: 0
    });
  });

  it("interpolates character position inside the active segment", () => {
    expect(calculateJourneyState(700, map)).toEqual({
      xp: 700,
      targetXP: 1000,
      progressPercent: 70,
      currentLocationId: "MIDDLE",
      currentLocationName: "Middle",
      nextLocationId: "END",
      nextLocationName: "End",
      characterX: 70,
      segmentProgressPercent: 50
    });
  });

  it("caps journey progress at target XP while preserving actual XP", () => {
    expect(calculateJourneyState(1250, map)).toEqual({
      xp: 1250,
      targetXP: 1000,
      progressPercent: 100,
      currentLocationId: "END",
      currentLocationName: "End",
      nextLocationId: undefined,
      nextLocationName: undefined,
      characterX: 100,
      segmentProgressPercent: 100
    });
  });

  it("supports user configured target XP independent of the theme default", () => {
    expect(calculateJourneyState(250, map, 500)).toMatchObject({
      targetXP: 500,
      progressPercent: 50,
      currentLocationId: "START",
      nextLocationId: "MIDDLE",
      characterX: 25,
      segmentProgressPercent: 62.5
    });
  });
});
