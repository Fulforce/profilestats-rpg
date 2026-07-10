import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { JourneyEvent, JourneyRecord } from "../src/domain/types.js";
import {
  buildStorageSnapshot,
  getSnapshotForDate,
  readStorage,
  toRenderState,
  writeStorageSnapshot
} from "../src/storage/storage-engine.js";
import type { PreviousStorage } from "../src/storage/types.js";

const activeRecord: JourneyRecord = {
  definition: {
    id: "road-to-mordor-2026",
    startDate: "2026-01-01",
    targetXP: 50000,
    xpMultiplier: 1,
    themeId: "middle-earth",
    themeVersion: "1.0.0",
    xpRuleSetVersion: "1.0.0"
  },
  progress: {
    journeyId: "road-to-mordor-2026",
    status: "ACTIVE",
    xp: 1500,
    targetXP: 50000,
    progressPercent: 3,
    currentLocationId: "BREE",
    nextLocationId: "WEATHERTOP",
    characterX: 88,
    segmentProgressPercent: 60,
    startedAt: "2026-01-01"
  },
  activity: {
    counts: {
      commits: 100,
      prsOpened: 4,
      prsMerged: 2,
      issuesOpened: 3,
      issuesClosed: 1,
      reviewsSubmitted: 5,
      repositoriesCreated: 1,
      releasesPublished: 0,
      streaks: 1
    },
    githubUser: "octocat",
    window: { from: "2026-01-01", to: "2026-07-09" },
    collectedAt: "2026-07-09T12:00:00.000Z",
    source: "github-public-api",
    complete: true,
    warnings: []
  },
  xp: {
    ruleSetVersion: "1.0.0",
    sources: [],
    rawXP: 1500,
    multiplier: 1,
    calculatedXP: 1500,
    awardedXP: 1500
  },
  titleId: "WANDERER",
  titleName: "Wanderer",
  achievements: [
    {
      achievementId: "XP_1000",
      name: "First Footsteps",
      description: "Earn 1,000 XP.",
      unlockedAt: "2026-07-09T12:00:00.000Z"
    }
  ],
  route: [
    { id: "SHIRE", name: "The Shire", requiredXP: 0, x: 40 },
    { id: "BREE", name: "Bree", requiredXP: 1000, x: 80 },
    { id: "WEATHERTOP", name: "Weathertop", requiredXP: 2000, x: 120 }
  ],
  themeName: "Middle-earth",
  lastUpdated: "2026-07-09T12:00:00.000Z"
};

const startEvent: JourneyEvent = {
  id: "road-to-mordor-2026:JOURNEY_STARTED:road-to-mordor-2026",
  journeyId: "road-to-mordor-2026",
  occurredAt: "2026-07-09T12:00:00.000Z",
  type: "JOURNEY_STARTED",
  value: "road-to-mordor-2026"
};

const emptyStorage: PreviousStorage = {
  journeys: { schemaVersion: 1, journeys: [] },
  dailyLog: { schemaVersion: 1, snapshots: [] },
  events: { schemaVersion: 1, events: [] }
};

describe("buildStorageSnapshot", () => {
  it("builds versioned state, history, daily log, and event documents", () => {
    const snapshot = buildStorageSnapshot(
      {
        githubUser: "octocat",
        current: activeRecord,
        newEvents: [startEvent, startEvent]
      },
      emptyStorage
    );

    expect(snapshot.state).toMatchObject({
      schemaVersion: 1,
      profile: { githubUser: "octocat" },
      current: { definition: { id: "road-to-mordor-2026" } }
    });
    expect(snapshot.journeys.journeys).toEqual([]);
    expect(snapshot.dailyLog.snapshots).toHaveLength(1);
    expect(snapshot.events.events).toEqual([startEvent]);
    expect(
      getSnapshotForDate(snapshot.dailyLog, "road-to-mordor-2026", "2026-07-09")
    ).toMatchObject({ awardedXP: 1500, locationId: "BREE" });
  });

  it("archives a completed journey exactly once", () => {
    const completed: JourneyRecord = {
      ...activeRecord,
      progress: {
        ...activeRecord.progress,
        status: "COMPLETED",
        xp: 50000,
        progressPercent: 100,
        currentLocationId: "WEATHERTOP",
        nextLocationId: undefined,
        completedAt: "2026-07-09T12:00:00.000Z"
      }
    };
    const first = buildStorageSnapshot({ githubUser: "octocat", current: completed }, emptyStorage);
    const second = buildStorageSnapshot(
      { githubUser: "octocat", current: completed },
      {
        state: first.state,
        journeys: first.journeys,
        dailyLog: first.dailyLog,
        events: first.events
      }
    );

    expect(second.journeys.journeys).toHaveLength(1);
    expect(second.journeys.journeys[0]).toMatchObject({
      archiveReason: "COMPLETED",
      archivedAt: "2026-07-09T12:00:00.000Z"
    });
  });

  it("adapts the persisted contract for the current renderer", () => {
    const snapshot = buildStorageSnapshot(
      { githubUser: "octocat", current: activeRecord },
      emptyStorage
    );

    expect(toRenderState(snapshot.state)).toMatchObject({
      xp: 1500,
      title: "Wanderer",
      currentLocation: "Bree",
      nextLocation: "Weathertop",
      achievements: ["XP_1000"]
    });
  });
});

describe("storage persistence", () => {
  it("writes and reloads all four versioned documents", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-storage-"));
    const snapshot = buildStorageSnapshot(
      { githubUser: "octocat", current: activeRecord, newEvents: [startEvent] },
      emptyStorage
    );
    await writeStorageSnapshot(snapshot, dataDir);

    const reloaded = await readStorage(dataDir);
    expect(reloaded.state?.current.definition.id).toBe("road-to-mordor-2026");
    expect(reloaded.events.events).toEqual([startEvent]);
    await expect(readFile(join(dataDir, "journeys.json"), "utf8")).resolves.toContain(
      '"schemaVersion": 1'
    );
  });

  it("rejects malformed persisted data with a stable error", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-storage-invalid-"));
    await writeFile(join(dataDir, "daily-log.json"), JSON.stringify({ not: "a document" }));

    await expect(readStorage(dataDir)).rejects.toMatchObject({ code: "STORAGE_INVALID" });
  });
});
