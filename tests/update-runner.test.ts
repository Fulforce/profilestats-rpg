import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { runUpdate } from "../src/update/update-runner.js";
import type { Activity } from "../src/domain/types.js";
import type { DailyLogEntry, StoredState } from "../src/storage/types.js";

const activity: Activity = {
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

describe("runUpdate", () => {
  it("runs the full pipeline and writes storage files", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-update-"));
    const outputDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-output-"));
    const summary = await runUpdate({
      dataDir,
      outputDir,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => activity
    });

    const state = JSON.parse(await readFile(join(dataDir, "state.json"), "utf8")) as StoredState;
    const dailyLog = JSON.parse(
      await readFile(join(dataDir, "daily-log.json"), "utf8")
    ) as DailyLogEntry[];
    const svg = await readFile(join(outputDir, "journey.svg"), "utf8");

    expect(summary.snapshot.state).toMatchObject({
      xp: 2775,
      title: "Wanderer",
      currentLocation: "Bree",
      nextLocation: "Weathertop",
      achievementCount: 5
    });
    expect(state.xp).toBe(2775);
    expect(dailyLog).toHaveLength(1);
    expect(dailyLog[0]).toMatchObject({
      date: "2026-07-09",
      xp: 2775,
      title: "Wanderer"
    });
    expect(svg).toContain("Middle-earth Journey");
    expect(svg).toContain("Wanderer");
    expect(summary.snapshot.events).toEqual(
      expect.arrayContaining([
        { date: "2026-07-09", type: "LOCATION_UNLOCKED", value: "SHIRE" },
        { date: "2026-07-09", type: "LOCATION_UNLOCKED", value: "BREE" },
        { date: "2026-07-09", type: "TITLE_UNLOCKED", value: "HOBBIT" },
        { date: "2026-07-09", type: "TITLE_UNLOCKED", value: "WANDERER" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "XP_1000" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "LEFT_SHIRE" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "FIRST_PR_MERGED" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "FIRST_RELEASE" },
        { date: "2026-07-09", type: "ACHIEVEMENT_UNLOCKED", value: "HUNDRED_COMMITS" }
      ])
    );
  });

  it("uses previous storage to avoid duplicate milestone events", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-update-"));
    const outputDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-output-"));

    await runUpdate({
      dataDir,
      outputDir,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => activity
    });
    const second = await runUpdate({
      dataDir,
      outputDir,
      date: new Date("2026-07-09T14:00:00Z"),
      activityProvider: async () => activity
    });

    const eventKeys = second.snapshot.events.map((event) => `${event.type}:${event.value}`);
    expect(new Set(eventKeys).size).toBe(eventKeys.length);
  });
});
