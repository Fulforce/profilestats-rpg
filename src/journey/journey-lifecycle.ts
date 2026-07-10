import type { AppConfig } from "../config/types.js";
import type {
  AchievementResult,
  ActivityReport,
  JourneyEvent,
  JourneyRecord,
  JourneyState,
  StoredAchievementUnlock,
  Title,
  TitleResult,
  XPResult
} from "../domain/types.js";
import { AppError } from "../errors/app-error.js";
import type { ArchivedJourneyRecord, PreviousStorage } from "../storage/types.js";
import type { Theme } from "../theme/types.js";
import { XP_RULE_SET_VERSION } from "../xp/xp-rules.js";

export type JourneyRunPlan =
  | { kind: "FROZEN"; current: JourneyRecord }
  | {
      kind: "CALCULATE";
      previousRecord?: JourneyRecord;
      archivedJourneys: ArchivedJourneyRecord[];
      isNewJourney: boolean;
    };

export type BuildJourneyRecordInput = {
  config: AppConfig;
  theme: Theme;
  activity: ActivityReport;
  xp: XPResult;
  journey: JourneyState;
  title: TitleResult;
  achievements: AchievementResult;
  previousRecord?: JourneyRecord;
  timestamp: string;
};

export function planJourneyRun(
  config: AppConfig,
  theme: Theme,
  previous: PreviousStorage,
  allowAbandon: boolean,
  timestamp: string
): JourneyRunPlan {
  const current = previous.state?.current;
  const requestedId = config.journey.id;

  if (previous.journeys.journeys.some((record) => record.definition.id === requestedId)) {
    if (current?.definition.id !== requestedId) {
      throw new AppError(
        "JOURNEY_ID_REUSED",
        `Journey id "${requestedId}" has already been archived and cannot be reused.`
      );
    }
  }

  if (!current) {
    return { kind: "CALCULATE", archivedJourneys: [], isNewJourney: true };
  }

  if (current.definition.id === requestedId) {
    assertJourneyDefinition(config, theme, previous.state!.profile.githubUser, current);
    return current.progress.status === "COMPLETED"
      ? { kind: "FROZEN", current }
      : {
          kind: "CALCULATE",
          previousRecord: current,
          archivedJourneys: [],
          isNewJourney: false
        };
  }

  if (current.progress.status === "ACTIVE" && !allowAbandon) {
    throw new AppError(
      "JOURNEY_ACTIVE",
      `Journey "${current.definition.id}" is still active. Set allowAbandon explicitly to start "${requestedId}".`
    );
  }

  const archivedJourneys =
    current.progress.status === "ACTIVE"
      ? [
          {
            ...current,
            archiveReason: "ABANDONED" as const,
            archivedAt: timestamp
          }
        ]
      : [];

  return { kind: "CALCULATE", archivedJourneys, isNewJourney: true };
}

export function buildJourneyRecord(input: BuildJourneyRecordInput): JourneyRecord {
  const completed = input.xp.awardedXP >= input.config.journey.targetXP;
  const previousAchievements = input.previousRecord?.achievements ?? [];
  const previousAchievementIds = new Set(
    previousAchievements.map((achievement) => achievement.achievementId)
  );
  const newAchievements = input.achievements.unlockedThisRun
    .filter((id) => !previousAchievementIds.has(id))
    .map((id): StoredAchievementUnlock => {
      const definition = input.theme.achievements.find((achievement) => achievement.id === id);
      if (!definition) {
        throw new AppError(
          "JOURNEY_ACHIEVEMENT_MISSING",
          `Achievement definition is missing: ${id}`
        );
      }
      return {
        achievementId: id,
        name: definition.name,
        description: definition.description,
        unlockedAt: input.timestamp
      };
    });

  return {
    definition: {
      id: input.config.journey.id,
      startDate: input.config.journey.startDate,
      targetXP: input.config.journey.targetXP,
      xpMultiplier: input.config.journey.xpMultiplier,
      themeId: input.config.theme.id,
      themeVersion: input.theme.manifest.version,
      xpRuleSetVersion: input.xp.ruleSetVersion
    },
    progress: {
      journeyId: input.config.journey.id,
      status: completed ? "COMPLETED" : "ACTIVE",
      xp: input.xp.awardedXP,
      targetXP: input.config.journey.targetXP,
      progressPercent: input.journey.progressPercent,
      currentLocationId: input.journey.currentLocationId,
      nextLocationId: input.journey.nextLocationId,
      characterX: input.journey.characterX,
      segmentProgressPercent: input.journey.segmentProgressPercent,
      startedAt: input.previousRecord?.progress.startedAt ?? input.config.journey.startDate,
      completedAt: completed
        ? (input.previousRecord?.progress.completedAt ?? input.timestamp)
        : undefined
    },
    activity: input.activity,
    xp: input.xp,
    titleId: input.title.currentTitleId,
    titleName: input.title.currentTitleName,
    achievements: [...previousAchievements, ...newAchievements],
    route: input.journey.effectiveLocations,
    themeName: input.theme.manifest.name,
    lastUpdated: input.timestamp
  };
}

export function buildJourneyEvents(
  record: JourneyRecord,
  title: TitleResult,
  achievements: AchievementResult,
  previous: PreviousStorage,
  isNewJourney: boolean,
  timestamp: string
): JourneyEvent[] {
  const candidates: JourneyEvent[] = [];

  if (isNewJourney) {
    candidates.push(
      createEvent(record.definition.id, "JOURNEY_STARTED", record.definition.id, timestamp)
    );
  }

  for (const location of record.route.filter(
    (candidate) => candidate.requiredXP <= record.progress.xp
  )) {
    candidates.push(createEvent(record.definition.id, "LOCATION_UNLOCKED", location.id, timestamp));
  }

  for (const titleId of title.unlockedTitles) {
    candidates.push(createEvent(record.definition.id, "TITLE_UNLOCKED", titleId, timestamp));
  }

  for (const achievementId of achievements.unlockedThisRun) {
    candidates.push(
      createEvent(record.definition.id, "ACHIEVEMENT_UNLOCKED", achievementId, timestamp)
    );
  }

  if (record.progress.status === "COMPLETED") {
    candidates.push(
      createEvent(record.definition.id, "JOURNEY_COMPLETED", record.definition.id, timestamp)
    );
  }

  const existingIds = new Set(previous.events.events.map((event) => event.id));
  return candidates.filter((event) => !existingIds.has(event.id));
}

export function getPreviouslyUnlockedTitleIds(
  previous: PreviousStorage,
  journeyId: string
): string[] {
  return previous.events.events
    .filter((event) => event.journeyId === journeyId && event.type === "TITLE_UNLOCKED")
    .map((event) => event.value);
}

export function scaleTitles(titles: Title[], themeTargetXP: number, targetXP: number): Title[] {
  return titles.map((title, index) => ({
    ...title,
    requiredXP: index === 0 ? 0 : Math.round((title.requiredXP / themeTargetXP) * targetXP)
  }));
}

export function applyMonotonicXP(xp: XPResult, previousRecord?: JourneyRecord): XPResult {
  const awardedXP = Math.max(previousRecord?.xp.awardedXP ?? 0, xp.calculatedXP);
  return { ...xp, awardedXP };
}

function assertJourneyDefinition(
  config: AppConfig,
  theme: Theme,
  storedGithubUser: string,
  current: JourneyRecord
): void {
  const differences: string[] = [];
  if (config.profile.githubUser !== storedGithubUser) differences.push("profile.githubUser");
  if (config.theme.id !== current.definition.themeId) differences.push("theme.id");
  if (config.journey.startDate !== current.definition.startDate)
    differences.push("journey.startDate");
  if (config.journey.targetXP !== current.definition.targetXP) differences.push("journey.targetXP");
  if (config.journey.xpMultiplier !== current.definition.xpMultiplier) {
    differences.push("journey.xpMultiplier");
  }
  if (current.progress.status === "ACTIVE") {
    if (theme.manifest.version !== current.definition.themeVersion)
      differences.push("theme.version");
    if (current.definition.xpRuleSetVersion !== XP_RULE_SET_VERSION) {
      differences.push("xpRuleSetVersion");
    }
  }

  if (differences.length > 0) {
    throw new AppError(
      "JOURNEY_CONFIG_CHANGED",
      `Journey "${current.definition.id}" cannot change locked fields: ${differences.join(", ")}. Choose a new journey id.`
    );
  }
}

function createEvent(
  journeyId: string,
  type: JourneyEvent["type"],
  value: string,
  occurredAt: string
): JourneyEvent {
  return {
    id: `${journeyId}:${type}:${value}`,
    journeyId,
    occurredAt,
    type,
    value
  };
}
