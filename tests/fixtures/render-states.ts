import type { Activity, JourneyRecord } from "../../src/domain/types.js";
import type { StateDocument } from "../../src/storage/types.js";

const counts: Activity = {
  commits: 1204,
  prsOpened: 75,
  prsMerged: 42,
  issuesOpened: 28,
  issuesClosed: 41,
  reviewsSubmitted: 67,
  repositoriesCreated: 3,
  releasesPublished: 5,
  streaks: 12
};

const route = [
  ["SHIRE", "The Shire", 0, 40],
  ["BREE", "Bree", 2500, 120],
  ["WEATHERTOP", "Weathertop", 5000, 205],
  ["RIVENDELL", "Rivendell", 8500, 300],
  ["MORIA", "Moria", 12500, 395],
  ["LOTHLORIEN", "Lothlorien", 16500, 480],
  ["AMON_HEN", "Amon Hen", 20500, 555],
  ["EMYN_MUIL", "Emyn Muil", 24500, 635],
  ["DEAD_MARSHES", "Dead Marshes", 28500, 715],
  ["BLACK_GATE", "Black Gate", 33000, 790],
  ["ITHILIEN", "Ithilien", 37000, 865],
  ["CIRITH_UNGOL", "Cirith Ungol", 41000, 940],
  ["SHELOBS_LAIR", "Shelob's Lair", 45500, 1015],
  ["MOUNT_DOOM", "Mount Doom", 50000, 1100]
].map(([id, name, requiredXP, x]) => ({
  id: String(id),
  name: String(name),
  requiredXP: Number(requiredXP),
  x: Number(x)
}));

const baseRecord: JourneyRecord = {
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
    xp: 16500,
    targetXP: 50000,
    progressPercent: 33,
    currentLocationId: "LOTHLORIEN",
    nextLocationId: "AMON_HEN",
    characterX: 480,
    segmentProgressPercent: 0,
    startedAt: "2026-01-01"
  },
  activity: {
    counts,
    githubUser: "octocat",
    window: { from: "2026-01-01", to: "2026-07-09" },
    collectedAt: "2026-07-09T12:00:00.000Z",
    source: "github-public-api",
    complete: true,
    warnings: []
  },
  xp: {
    ruleSetVersion: "1.0.0",
    sources: [
      { metric: "prsMerged", count: 42, unitXP: 60, earnedXP: 2520 },
      { metric: "commits", count: 1204, unitXP: 2, earnedXP: 2408 },
      { metric: "streaks", count: 12, unitXP: 200, earnedXP: 2400 },
      { metric: "reviewsSubmitted", count: 67, unitXP: 25, earnedXP: 1675 },
      { metric: "prsOpened", count: 75, unitXP: 20, earnedXP: 1500 },
      { metric: "issuesClosed", count: 41, unitXP: 30, earnedXP: 1230 }
    ],
    rawXP: 16500,
    multiplier: 1,
    calculatedXP: 16500,
    awardedXP: 16500
  },
  titleId: "ADVENTURER",
  titleName: "Adventurer",
  achievements: [
    {
      achievementId: "LEFT_SHIRE",
      name: "The Road Goes Ever On",
      description: "Leave the Shire.",
      unlockedAt: "2026-02-01T12:00:00.000Z"
    },
    {
      achievementId: "FIRST_PR_MERGED",
      name: "Fellowship Formed",
      description: "Merge a pull request.",
      unlockedAt: "2026-02-02T12:00:00.000Z"
    }
  ],
  route,
  themeName: "Middle-earth",
  lastUpdated: "2026-07-09T12:00:00.000Z"
};

export function activeRenderState(): StateDocument {
  return document(baseRecord);
}

export function zeroRenderState(): StateDocument {
  const zeroCounts = Object.fromEntries(
    Object.keys(counts).map((key) => [key, 0])
  ) as unknown as Activity;
  return document({
    ...baseRecord,
    progress: {
      ...baseRecord.progress,
      xp: 0,
      progressPercent: 0,
      currentLocationId: "SHIRE",
      nextLocationId: "BREE",
      characterX: 40
    },
    activity: { ...baseRecord.activity, counts: zeroCounts },
    xp: {
      ...baseRecord.xp,
      sources: [],
      rawXP: 0,
      calculatedXP: 0,
      awardedXP: 0
    },
    achievements: []
  });
}

export function completedRenderState(): StateDocument {
  return document({
    ...baseRecord,
    progress: {
      ...baseRecord.progress,
      status: "COMPLETED",
      xp: 50000,
      progressPercent: 100,
      currentLocationId: "MOUNT_DOOM",
      nextLocationId: undefined,
      characterX: 1100,
      completedAt: "2026-07-09T12:00:00.000Z"
    },
    xp: { ...baseRecord.xp, calculatedXP: 50000, awardedXP: 50000 }
  });
}

export function partialRenderState(): StateDocument {
  return document({
    ...baseRecord,
    activity: {
      ...baseRecord.activity,
      complete: false,
      warnings: [
        {
          code: "SEARCH_INCOMPLETE",
          metric: "commits",
          message: "Commit totals may be lower than the public total."
        }
      ]
    }
  });
}

export function longTextRenderState(): StateDocument {
  return {
    ...document({
      ...baseRecord,
      titleName: "Keeper of the Extremely Long and Unexpectedly Detailed Developer Chronicle",
      route: baseRecord.route.map((location) =>
        location.id === "LOTHLORIEN"
          ? { ...location, name: "Lothlorien and the Very Long Woodland Realm" }
          : location
      )
    }),
    profile: {
      githubUser: "octocat-with-a-very-long-but-valid-profile-name"
    }
  };
}

function document(record: JourneyRecord): StateDocument {
  return {
    schemaVersion: 1,
    engineVersion: "0.1.0",
    profile: { githubUser: "octocat" },
    current: record
  };
}
