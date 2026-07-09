import type { AchievementResult, Activity, Event, JourneyState } from "../domain/types.js";
import type { AchievementCondition, AchievementDefinition } from "../theme/types.js";

export function calculateAchievementResult(
  definitions: AchievementDefinition[],
  context: {
    xp: number;
    activity: Activity;
    journey: JourneyState;
  },
  previouslyUnlockedAchievements: string[] = [],
  eventDate = new Date()
): AchievementResult {
  validateInputs(definitions, context.xp);

  const previous = new Set(previouslyUnlockedAchievements);
  const satisfied = definitions
    .filter((achievement) => isConditionSatisfied(achievement.condition, context))
    .map((achievement) => achievement.id);
  const achievements = mergeInDefinitionOrder(definitions, previous, satisfied);
  const unlockedThisRun = achievements.filter((achievementId) => !previous.has(achievementId));
  const events = unlockedThisRun.map((achievementId) =>
    createAchievementEvent(achievementId, eventDate)
  );

  return {
    achievements,
    unlockedThisRun,
    achievementCount: achievements.length,
    events
  };
}

function isConditionSatisfied(
  condition: AchievementCondition,
  context: {
    xp: number;
    activity: Activity;
    journey: JourneyState;
  }
): boolean {
  switch (condition.type) {
    case "xp":
      return context.xp >= Number(condition.value);
    case "location":
      return context.journey.currentLocationId === condition.value;
    case "commits":
    case "prsOpened":
    case "prsMerged":
    case "issuesOpened":
    case "issuesClosed":
    case "reviewsSubmitted":
    case "repositoriesCreated":
    case "releasesPublished":
      return context.activity[condition.type] >= Number(condition.value);
  }
}

function mergeInDefinitionOrder(
  definitions: AchievementDefinition[],
  previous: Set<string>,
  satisfied: string[]
): string[] {
  const unlocked = new Set([...previous, ...satisfied]);
  const orderedKnownAchievements = definitions
    .map((achievement) => achievement.id)
    .filter((achievementId) => unlocked.has(achievementId));
  const unknownPreviousAchievements = [...previous].filter(
    (achievementId) => !definitions.some((definition) => definition.id === achievementId)
  );

  return [...orderedKnownAchievements, ...unknownPreviousAchievements];
}

function createAchievementEvent(achievementId: string, eventDate: Date): Event {
  return {
    date: eventDate.toISOString().slice(0, 10),
    type: "ACHIEVEMENT_UNLOCKED",
    value: achievementId
  };
}

function validateInputs(definitions: AchievementDefinition[], xp: number): void {
  if (!Number.isFinite(xp) || xp < 0) {
    throw new Error("Achievement XP must be a non-negative number.");
  }

  const ids = new Set<string>();
  for (const definition of definitions) {
    if (ids.has(definition.id)) {
      throw new Error(`Achievement "${definition.id}" is defined more than once.`);
    }
    ids.add(definition.id);
  }
}
