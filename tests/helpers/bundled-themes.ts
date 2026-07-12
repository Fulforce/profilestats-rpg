import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Activity, JourneyRecord, XPSource } from "../../src/domain/types.js";
import type { StateDocument } from "../../src/storage/types.js";
import type { Theme } from "../../src/theme/types.js";

export function discoverBundledThemeIds(themesRoot = "themes"): string[] {
  return readdirSync(themesRoot)
    .filter((entry) => {
      const themePath = join(themesRoot, entry);
      return statSync(themePath).isDirectory() && existsSync(join(themePath, "theme.json"));
    })
    .sort((first, second) => first.localeCompare(second, "en", { sensitivity: "base" }));
}

export function buildBundledThemeActiveState(theme: Theme): StateDocument {
  const targetXP = theme.map.targetXP;
  const route = theme.map.locations.map((location) => ({
    id: location.id,
    name: location.name,
    requiredXP: location.requiredXP,
    x: location.x
  }));
  const currentIndex = Math.min(Math.max(1, Math.floor(route.length / 3)), route.length - 2);
  const current = route[currentIndex];
  const next = route[currentIndex + 1];
  const xp = current.requiredXP;
  const currentTitle = [...theme.titles]
    .sort((first, second) => second.requiredXP - first.requiredXP)
    .find((title) => title.requiredXP <= xp);
  const achievements = theme.achievements.slice(0, 2).map((achievement, index) => ({
    achievementId: achievement.id,
    name: achievement.name,
    description: achievement.description,
    unlockedAt: `2026-07-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`
  }));

  const record: JourneyRecord = {
    definition: {
      id: `${theme.manifest.id}-contract`,
      startDate: "2026-01-01",
      targetXP,
      xpMultiplier: 1,
      themeId: theme.manifest.id,
      themeVersion: theme.manifest.version,
      xpRuleSetVersion: "1.0.0"
    },
    progress: {
      journeyId: `${theme.manifest.id}-contract`,
      status: "ACTIVE",
      xp,
      targetXP,
      progressPercent: roundToOneDecimal((xp / targetXP) * 100),
      currentLocationId: current.id,
      nextLocationId: next.id,
      characterX: current.x,
      segmentProgressPercent: 0,
      startedAt: "2026-01-01"
    },
    activity: {
      counts: activity,
      githubUser: "octocat",
      window: { from: "2026-01-01", to: "2026-07-09" },
      collectedAt: "2026-07-09T12:00:00.000Z",
      source: "github-public-api",
      complete: true,
      warnings: []
    },
    xp: {
      ruleSetVersion: "1.0.0",
      sources,
      rawXP: xp,
      multiplier: 1,
      calculatedXP: xp,
      awardedXP: xp
    },
    titleId: currentTitle?.id ?? theme.manifest.startingTitle,
    titleName: currentTitle?.name ?? "Adventurer",
    achievements,
    route,
    themeName: theme.manifest.name,
    lastUpdated: "2026-07-09T12:00:00.000Z"
  };

  return {
    schemaVersion: 1,
    engineVersion: "1.0.0",
    profile: { githubUser: "octocat" },
    current: record
  };
}

const activity: Activity = {
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

const sources: XPSource[] = [
  { metric: "prsMerged", count: 42, unitXP: 60, earnedXP: 2520 },
  { metric: "commits", count: 1204, unitXP: 2, earnedXP: 2408 },
  { metric: "streaks", count: 12, unitXP: 200, earnedXP: 2400 },
  { metric: "reviewsSubmitted", count: 67, unitXP: 25, earnedXP: 1675 },
  { metric: "prsOpened", count: 75, unitXP: 20, earnedXP: 1500 },
  { metric: "issuesClosed", count: 41, unitXP: 30, earnedXP: 1230 }
];

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
