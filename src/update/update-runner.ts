import { readFile } from "node:fs/promises";
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
  readStorage
} from "../storage/storage-engine.js";
import { buildJourneySvgArtifact } from "../svg/svg-writer.js";
import { buildRenderViewModel } from "../svg/render-view-model.js";
import { loadTheme } from "../theme/theme-loader.js";
import { calculateTitleResult } from "../title/title-engine.js";
import type { ActivityProvider, UpdateRunnerOptions, UpdateSummary } from "./types.js";
import { calculateXP } from "../xp/xp-engine.js";
import type { JourneyRecord } from "../domain/types.js";

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
    const renderView = buildRenderViewModel(snapshot.state, theme, config.display);
    const artifacts = [buildJourneySvgArtifact(renderView, svgPath)];
    const changedPaths = await writeChangedArtifacts(artifacts);
    return {
      config,
      snapshot,
      generatedEvents: [],
      artifactPaths: artifacts.map(({ path }) => path),
      changedPaths
    };
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

  if (isUnchangedSameDayRecord(record, plan.previousRecord)) {
    const snapshot = {
      state: previous.state!,
      journeys: previous.journeys,
      dailyLog: previous.dailyLog,
      events: previous.events
    };
    const renderView = buildRenderViewModel(snapshot.state, theme, config.display);
    const artifacts = [buildJourneySvgArtifact(renderView, svgPath)];
    const changedPaths = await writeChangedArtifacts(artifacts);
    return {
      config,
      snapshot,
      generatedEvents: [],
      artifactPaths: [
        ...buildStorageArtifacts(snapshot, dataDirectory).map(({ path }) => path),
        svgPath
      ],
      changedPaths
    };
  }

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
  const renderView = buildRenderViewModel(snapshot.state, theme, config.display);
  const artifacts = [
    ...buildStorageArtifacts(snapshot, dataDirectory),
    buildJourneySvgArtifact(renderView, svgPath)
  ];
  const changedPaths = await writeChangedArtifacts(artifacts);

  return {
    config,
    snapshot,
    generatedEvents,
    artifactPaths: artifacts.map(({ path }) => path),
    changedPaths
  };
}

function isUnchangedSameDayRecord(
  candidate: JourneyRecord,
  previous: JourneyRecord | undefined
): boolean {
  if (!previous || candidate.lastUpdated.slice(0, 10) !== previous.lastUpdated.slice(0, 10)) {
    return false;
  }

  return (
    JSON.stringify(withoutCollectionTimes(candidate)) ===
    JSON.stringify(withoutCollectionTimes(previous))
  );
}

function withoutCollectionTimes(record: JourneyRecord): JourneyRecord {
  return {
    ...record,
    lastUpdated: "",
    activity: {
      ...record.activity,
      collectedAt: ""
    }
  };
}

async function writeChangedArtifacts(
  artifacts: Array<{ path: string; content: string }>
): Promise<string[]> {
  const comparisons = await Promise.all(
    artifacts.map(async (artifact) => {
      try {
        return (await readFile(artifact.path, "utf8")) === artifact.content ? undefined : artifact;
      } catch (error) {
        if (isFileNotFound(error)) return artifact;
        throw error;
      }
    })
  );
  const changed = comparisons.filter((artifact) => artifact !== undefined);
  if (changed.length > 0) await writeFilesTransaction(changed);
  return changed.map(({ path }) => path);
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ENOENT"
  );
}

const defaultActivityProvider: ActivityProvider = async ({ githubUser, startDate, token, date }) =>
  collectActivity({ githubUser, startDate, token, date });
