import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  buildStorageSnapshot,
  getSnapshotForDate,
  persistStorageUpdate,
  readStorage
} from "../src/storage/storage-engine.js";
import type {
  Activity,
  ActivityReport,
  AchievementResult,
  JourneyState,
  TitleResult,
  XPResult
} from "../src/domain/types.js";
import type { AppConfig } from "../src/config/types.js";
import type { PreviousStorage } from "../src/storage/types.js";

const config: AppConfig = {
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
};

const activity: Activity = {
  commits: 100,
  prsOpened: 4,
  prsMerged: 2,
  issuesOpened: 3,
  issuesClosed: 1,
  reviewsSubmitted: 5,
  repositoriesCreated: 1,
  releasesPublished: 0,
  streaks: 1
};

const activityReport: ActivityReport = {
  counts: activity,
  githubUser: "octocat",
  window: { from: "2026-01-01", to: "2026-07-09" },
  collectedAt: "2026-07-09T12:00:00.000Z",
  source: "github-public-api",
  complete: true,
  warnings: []
};

const xp: XPResult = {
  ruleSetVersion: "1.0.0",
  sources: [],
  rawXP: 1500,
  multiplier: 1,
  calculatedXP: 1500,
  awardedXP: 1500
};

const journey: JourneyState = {
  xp: 1500,
  targetXP: 50000,
  progressPercent: 3,
  currentLocationId: "BREE",
  currentLocationName: "Bree",
  nextLocationId: "WEATHERTOP",
  nextLocationName: "Weathertop",
  characterX: 88,
  segmentProgressPercent: 60
};

const title: TitleResult = {
  currentTitleId: "WANDERER",
  currentTitleName: "Wanderer",
  unlockedTitles: ["HOBBIT", "WANDERER"],
  newlyUnlockedTitle: "WANDERER",
  event: {
    date: "2026-07-09",
    type: "TITLE_UNLOCKED",
    value: "WANDERER"
  }
};

const achievements: AchievementResult = {
  achievements: ["XP_1000", "FIRST_PR_MERGED"],
  unlockedThisRun: ["FIRST_PR_MERGED"],
  achievementCount: 2,
  events: [
    {
      date: "2026-07-09",
      type: "ACHIEVEMENT_UNLOCKED",
      value: "FIRST_PR_MERGED"
    }
  ]
};

describe("buildStorageSnapshot", () => {
  it("builds state, daily log, and deduplicated events", () => {
    const previous: PreviousStorage = {
      dailyLog: [
        {
          date: "2026-07-09",
          xp: 1000,
          title: "Hobbit",
          currentLocation: "The Shire",
          nextLocation: "Bree",
          progressPercent: 2,
          characterX: 50,
          segmentProgressPercent: 20,
          achievementCount: 1,
          achievements: ["XP_1000"],
          stats: { ...activity, prsMerged: 0 },
          activityReport: {
            ...activityReport,
            counts: { ...activity, prsMerged: 0 }
          },
          xpBreakdown: { ...xp, calculatedXP: 1000, awardedXP: 1000 }
        }
      ],
      events: [
        {
          date: "2026-07-01",
          type: "ACHIEVEMENT_UNLOCKED",
          value: "FIRST_PR_MERGED"
        }
      ]
    };

    const snapshot = buildStorageSnapshot(
      {
        config,
        activity: activityReport,
        xp,
        journey,
        title,
        achievements,
        date: new Date("2026-07-09T12:00:00Z")
      },
      previous
    );

    expect(snapshot.state).toMatchObject({
      metadata: {
        theme: "middle-earth",
        githubUser: "octocat",
        journeyStartDate: "2026-01-01",
        targetXP: 50000,
        xpMultiplier: 1
      },
      lastUpdated: "2026-07-09",
      xp: 1500,
      title: "Wanderer",
      currentLocation: "Bree",
      nextLocation: "Weathertop",
      achievementCount: 2
    });
    expect(snapshot.dailyLog).toHaveLength(1);
    expect(snapshot.dailyLog[0]).toMatchObject({
      date: "2026-07-09",
      xp: 1500,
      title: "Wanderer",
      currentLocation: "Bree"
    });
    expect(snapshot.events).toEqual([
      {
        date: "2026-07-01",
        type: "ACHIEVEMENT_UNLOCKED",
        value: "FIRST_PR_MERGED"
      },
      {
        date: "2026-07-09",
        type: "TITLE_UNLOCKED",
        value: "WANDERER"
      }
    ]);
  });

  it("supports historical snapshot lookup by date", () => {
    const snapshot = buildStorageSnapshot({
      config,
      activity: activityReport,
      xp,
      journey,
      title,
      achievements,
      date: new Date("2026-07-09T12:00:00Z")
    });

    expect(getSnapshotForDate(snapshot.dailyLog, "2026-07-09")).toMatchObject({
      date: "2026-07-09",
      currentLocation: "Bree"
    });
  });
});

describe("persistStorageUpdate", () => {
  it("writes state, daily log, and events files", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-storage-"));

    await persistStorageUpdate(
      {
        config,
        activity: activityReport,
        xp,
        journey,
        title,
        achievements,
        date: new Date("2026-07-09T12:00:00Z")
      },
      dataDir
    );

    const state = JSON.parse(await readFile(join(dataDir, "state.json"), "utf8")) as {
      title: string;
    };
    const dailyLog = JSON.parse(
      await readFile(join(dataDir, "daily-log.json"), "utf8")
    ) as unknown[];
    const events = JSON.parse(await readFile(join(dataDir, "events.json"), "utf8")) as unknown[];

    expect(state.title).toBe("Wanderer");
    expect(dailyLog).toHaveLength(1);
    expect(events).toHaveLength(2);
  });

  it("rejects malformed persisted data with a stable error", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-storage-invalid-"));
    await writeFile(join(dataDir, "daily-log.json"), JSON.stringify({ not: "an array" }));

    await expect(readStorage(dataDir)).rejects.toMatchObject({
      code: "STORAGE_INVALID"
    });
  });
});
