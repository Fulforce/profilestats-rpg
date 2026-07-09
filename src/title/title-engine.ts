import type { Event, Title, TitleResult } from "../domain/types.js";

export function calculateTitleResult(
  xp: number,
  titles: Title[],
  previouslyUnlockedTitles: string[] = [],
  eventDate = new Date()
): TitleResult {
  validateInputs(xp, titles);

  const orderedTitles = [...titles].sort((a, b) => a.requiredXP - b.requiredXP);
  const unlockedTitleDefinitions = orderedTitles.filter((title) => title.requiredXP <= xp);
  const unlockedTitles = unlockedTitleDefinitions.map((title) => title.id);
  const currentTitle = unlockedTitleDefinitions.at(-1) ?? orderedTitles[0];
  const newlyUnlockedTitle = findNewlyUnlockedTitle(unlockedTitles, previouslyUnlockedTitles);
  const event = newlyUnlockedTitle ? createTitleEvent(newlyUnlockedTitle, eventDate) : undefined;

  return {
    currentTitleId: currentTitle.id,
    currentTitleName: currentTitle.name,
    unlockedTitles,
    newlyUnlockedTitle,
    event
  };
}

function findNewlyUnlockedTitle(
  unlockedTitles: string[],
  previouslyUnlockedTitles: string[]
): string | undefined {
  const previous = new Set(previouslyUnlockedTitles);
  return unlockedTitles.find((titleId) => !previous.has(titleId));
}

function createTitleEvent(titleId: string, eventDate: Date): Event {
  return {
    date: eventDate.toISOString().slice(0, 10),
    type: "TITLE_UNLOCKED",
    value: titleId
  };
}

function validateInputs(xp: number, titles: Title[]): void {
  if (!Number.isFinite(xp) || xp < 0) {
    throw new Error("Title XP must be a non-negative number.");
  }

  if (titles.length === 0) {
    throw new Error("At least one title is required.");
  }
}
