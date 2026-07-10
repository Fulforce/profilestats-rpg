import { join } from "node:path";
import { calculateAchievementResult } from "../achievement/achievement-engine.js";
import { loadConfig } from "../config/config-loader.js";
import { collectActivity } from "../github/activity-collector.js";
import { writeFilesTransaction } from "../io/transactional-files.js";
import { calculateJourneyState } from "../journey/journey-engine.js";
import {
  applyMonotonicXP,
  buildJourneyEvents,
  buildJourneyRecord,
  getPreviouslyUnlockedTitleIds,
  planJourneyRun,
  scaleTitles
} from "../journey/journey-lifecycle.js";
import {
  buildStorageArtifacts,
  buildStorageSnapshot,
  readStorage,
  toRenderState
} from "../storage/storage-engine.js";
import { buildJourneySvgArtifact } from "../svg/svg-writer.js";
import { loadTheme } from "../theme/theme-loader.js";
import { calculateTitleResult } from "../title/title-engine.js";
import type { ActivityProvider, UpdateRunnerOptions, UpdateSummary } from "./types.js";
import { calculateXP } from "../xp/xp-engine.js";

export async function runUpdate(options: UpdateRunnerOptions = {}): Promise<UpdateSummary> {
  const runDate = options.date ?? new Date();
  const timestamp = runDate.toISOString();
  const config = await loadConfig(options.configPath, runDate);
  const theme = await loadTheme(config.theme.id, options.themesRoot);
  const dataDirectory = options.dataDir ?? config.output.dataDirectory;
  const svgPath =
    options.svgPath ??
    (options.outputDir ? join(options.outputDir, "journey.svg") : config.output.svgPath);
  const previous = await readStorage(dataDirectory);
  const plan = planJourneyRun(config, theme, previous, options.allowAbandon ?? false, timestamp);

  if (plan.kind === "FROZEN") {
    const snapshot = {
      state: previous.state!,
      journeys: previous.journeys,
      dailyLog: previous.dailyLog,
      events: previous.events
    };
    const renderState = toRenderState(snapshot.state);
    await writeFilesTransaction([buildJourneySvgArtifact(renderState, theme, svgPath)]);
    return { config, snapshot, generatedEvents: [] };
  }

  const activityProvider = options.activityProvider ?? defaultActivityProvider;
  const activity = await activityProvider({
    githubUser: config.profile.githubUser,
    startDate: config.journey.startDate,
    token: options.token,
    date: runDate
  });
  const calculatedXP = calculateXP(activity.counts, config.journey.xpMultiplier);
  const xp = applyMonotonicXP(calculatedXP, plan.previousRecord);
  const journey = calculateJourneyState(xp.awardedXP, theme.map, config.journey.targetXP);
  const scaledTitles = scaleTitles(theme.titles, theme.map.targetXP, config.journey.targetXP);
  const previouslyUnlockedTitles = getPreviouslyUnlockedTitleIds(previous, config.journey.id);
  const title = calculateTitleResult(xp.awardedXP, scaledTitles, previouslyUnlockedTitles, runDate);
  const previousAchievementIds =
    plan.previousRecord?.achievements.map((achievement) => achievement.achievementId) ?? [];
  const achievements = calculateAchievementResult(
    theme.achievements,
    { xp: xp.awardedXP, activity: activity.counts, journey },
    previousAchievementIds,
    runDate
  );
  const record = buildJourneyRecord({
    config,
    theme,
    activity,
    xp,
    journey,
    title,
    achievements,
    previousRecord: plan.previousRecord,
    timestamp
  });
  const generatedEvents = buildJourneyEvents(
    record,
    title,
    achievements,
    previous,
    plan.isNewJourney,
    timestamp
  );
  const snapshot = buildStorageSnapshot(
    {
      githubUser: config.profile.githubUser,
      current: record,
      archivedJourneys: plan.archivedJourneys,
      newEvents: generatedEvents
    },
    previous
  );
  const renderState = toRenderState(snapshot.state);
  const artifacts = [
    ...buildStorageArtifacts(snapshot, dataDirectory),
    buildJourneySvgArtifact(renderState, theme, svgPath)
  ];
  await writeFilesTransaction(artifacts);

  return { config, snapshot, generatedEvents };
}

const defaultActivityProvider: ActivityProvider = async ({ githubUser, startDate, token, date }) =>
  collectActivity({ githubUser, startDate, token, date });
