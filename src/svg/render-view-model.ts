import type { DisplayConfig } from "../config/types.js";
import type { ActivityMetric } from "../domain/types.js";
import type { StateDocument } from "../storage/types.js";
import { StorageError } from "../storage/storage-error.js";
import type { Theme } from "../theme/types.js";
import type { RenderRouteLocation, RenderSourceRow, RenderViewModel } from "./types.js";

const SOURCE_LABELS: Record<ActivityMetric, string> = {
  commits: "Commits",
  prsOpened: "PRs opened",
  prsMerged: "PRs merged",
  issuesOpened: "Issues opened",
  issuesClosed: "Issues closed",
  reviewsSubmitted: "Reviews",
  repositoriesCreated: "Repositories",
  releasesPublished: "Releases",
  streaks: "Streaks"
};

export function buildRenderViewModel(
  state: StateDocument,
  theme: Theme,
  display: DisplayConfig
): RenderViewModel {
  const record = state.current;
  const current = record.route.find(
    (location) => location.id === record.progress.currentLocationId
  );
  const next = record.route.find((location) => location.id === record.progress.nextLocationId);
  if (!current) {
    throw new StorageError(
      "STORAGE_INVALID",
      `Current journey location is missing: ${record.progress.currentLocationId}`
    );
  }

  const completed = record.progress.status === "COMPLETED";
  const percent = completed ? 100 : record.progress.progressPercent;
  const sources = display.showStats ? buildSources(record.xp.sources) : undefined;
  const achievements = display.showAchievements
    ? {
        count: record.achievements.length,
        names: record.achievements.map((achievement) => achievement.name)
      }
    : undefined;
  const route = buildRoute(state, theme);
  const warningSummary = record.activity.complete
    ? undefined
    : record.activity.warnings.map((warning) => warning.message).join(" ") ||
      "Some public activity could not be collected.";
  const statusText = completed
    ? `Journey completed at ${current.name}.`
    : `Currently at ${current.name}; next destination ${next?.name ?? "the final destination"}.`;
  const warningText = warningSummary ? ` Activity data is incomplete. ${warningSummary}` : "";
  const achievementText = achievements ? ` ${achievements.count} achievements unlocked.` : "";

  return {
    layout: display.layout,
    width: display.layout === "compact" ? 495 : 1200,
    height: display.layout === "compact" ? 195 : 420,
    theme: {
      id: theme.manifest.id,
      name: theme.manifest.name,
      palette: theme.palette,
      character: theme.assets.character
    },
    profile: {
      githubUser: state.profile.githubUser,
      title: display.showTitle ? record.titleName : undefined
    },
    progress: {
      status: record.progress.status,
      awardedXP: record.xp.awardedXP,
      targetXP: record.definition.targetXP,
      percent,
      currentLocation: current.name,
      nextLocation: completed ? undefined : next?.name,
      characterX: record.progress.characterX
    },
    dates: {
      started: record.definition.startDate,
      updated: record.lastUpdated.slice(0, 10),
      completed: record.progress.completedAt?.slice(0, 10)
    },
    achievements,
    sources,
    activity: { complete: record.activity.complete, warningSummary },
    route,
    accessibleDescription: `${theme.manifest.name} journey for ${state.profile.githubUser}. ${statusText} ${formatNumber(record.xp.awardedXP)} of ${formatNumber(record.definition.targetXP)} XP, ${formatPercent(percent)} percent complete. Journey started ${record.definition.startDate}; last successful update ${record.lastUpdated.slice(0, 10)}.${achievementText}${warningText}`
  };
}

function buildSources(sources: StateDocument["current"]["xp"]["sources"]): RenderSourceRow[] {
  return sources
    .filter((source) => source.earnedXP > 0)
    .map((source) => ({
      metric: source.metric,
      label: SOURCE_LABELS[source.metric],
      count: source.count,
      earnedXP: source.earnedXP
    }))
    .sort(
      (a, b) =>
        b.earnedXP - a.earnedXP || a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    );
}

function buildRoute(state: StateDocument, theme: Theme): RenderRouteLocation[] {
  const record = state.current;
  const lastIndex = record.route.length - 1;
  return record.route.map((location, index) => {
    const isCurrent = location.id === record.progress.currentLocationId;
    const isNext = location.id === record.progress.nextLocationId;
    const themeLocation = theme.map.locations.find((candidate) => candidate.id === location.id);
    let labelPriority: number | undefined;
    if (isCurrent) labelPriority = 1;
    else if (isNext) labelPriority = 2;
    else if (index === 0 || index === lastIndex) labelPriority = 3;
    else if (themeLocation?.landmark) labelPriority = 4;

    return {
      id: location.id,
      name: location.name,
      x: location.x,
      status: isCurrent
        ? "current"
        : location.requiredXP <= record.progress.xp
          ? "reached"
          : "future",
      labelPriority
    };
  });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}
