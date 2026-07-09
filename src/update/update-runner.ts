import { calculateAchievementResult } from "../achievement/achievement-engine.js";
import { loadConfig } from "../config/config-loader.js";
import type { Event } from "../domain/types.js";
import { collectActivity } from "../github/activity-collector.js";
import { calculateJourneyState } from "../journey/journey-engine.js";
import { buildStorageSnapshot, readStorage, writeStorageSnapshot } from "../storage/storage-engine.js";
import { writeJourneySvg } from "../svg/svg-writer.js";
import type { PreviousStorage } from "../storage/types.js";
import { loadTheme } from "../theme/theme-loader.js";
import type { Theme } from "../theme/types.js";
import { calculateTitleResult } from "../title/title-engine.js";
import type { ActivityProvider, UpdateRunnerOptions, UpdateSummary } from "./types.js";
import { calculateXP } from "../xp/xp-engine.js";

export async function runUpdate(options: UpdateRunnerOptions = {}): Promise<UpdateSummary> {
  const config = await loadConfig(options.configPath);
  const theme = await loadTheme(config.theme, options.themesRoot);
  const previous = await readStorage(options.dataDir);
  const previouslyUnlockedTitles = getPreviouslyUnlockedTitles(previous, theme);
  const activityProvider = options.activityProvider ?? defaultActivityProvider;
  const activity = await activityProvider({
    githubUser: config.githubUser,
    startDate: config.journey.startDate,
    token: options.token
  });

  const xp = calculateXP(activity, config.journey.xpMultiplier);
  const journey = calculateJourneyState(xp.finalXP, theme.map, config.journey.targetXP);
  const title = calculateTitleResult(
    xp.finalXP,
    theme.titles,
    previouslyUnlockedTitles,
    options.date
  );
  const achievements = calculateAchievementResult(
    theme.achievements,
    { xp: xp.finalXP, activity, journey },
    getPreviouslyUnlockedAchievements(previous),
    options.date
  );
  const generatedEvents = [
    ...buildTitleEvents(title.unlockedTitles, previouslyUnlockedTitles, options.date ?? new Date()),
    ...buildLocationEvents(theme, xp.finalXP, options.date ?? new Date())
  ];
  const snapshot = buildStorageSnapshot(
    {
      config,
      activity,
      journey,
      title,
      achievements,
      events: generatedEvents,
      date: options.date
    },
    previous
  );

  await writeStorageSnapshot(snapshot, options.dataDir);
  await writeJourneySvg(snapshot.state, theme, options.outputDir);

  return {
    config,
    snapshot,
    generatedEvents
  };
}

const defaultActivityProvider: ActivityProvider = async ({ githubUser, startDate, token }) =>
  collectActivity({ githubUser, startDate, token });

function getPreviouslyUnlockedTitles(previous: PreviousStorage, theme: Theme): string[] {
  const eventTitles = previous.events
    .filter((event) => event.type === "TITLE_UNLOCKED")
    .map((event) => event.value);
  const stateDerivedTitles = previous.state
    ? theme.titles
        .filter((title) => title.requiredXP <= previous.state!.xp)
        .map((title) => title.id)
    : [];

  return [...new Set([...eventTitles, ...stateDerivedTitles])];
}

function getPreviouslyUnlockedAchievements(previous: PreviousStorage): string[] {
  const eventAchievements = previous.events
    .filter((event) => event.type === "ACHIEVEMENT_UNLOCKED")
    .map((event) => event.value);
  const stateAchievements = previous.state?.achievements ?? [];

  return [...new Set([...stateAchievements, ...eventAchievements])];
}

function buildLocationEvents(theme: Theme, xp: number, eventDate: Date): Event[] {
  const date = eventDate.toISOString().slice(0, 10);

  return theme.map.locations
    .filter((location) => location.requiredXP <= xp)
    .map((location) => ({
      date,
      type: "LOCATION_UNLOCKED" as const,
      value: location.id
    }));
}

function buildTitleEvents(
  unlockedTitles: string[],
  previouslyUnlockedTitles: string[],
  eventDate: Date
): Event[] {
  const previous = new Set(previouslyUnlockedTitles);
  const date = eventDate.toISOString().slice(0, 10);

  return unlockedTitles
    .filter((titleId) => !previous.has(titleId))
    .map((titleId) => ({
      date,
      type: "TITLE_UNLOCKED" as const,
      value: titleId
    }));
}
