import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Event } from "../domain/types.js";
import type {
  DailyLogEntry,
  PreviousStorage,
  StorageInput,
  StorageSnapshot,
  StoredState,
  StorageMetadata
} from "./types.js";

const STATE_FILE = "state.json";
const DAILY_LOG_FILE = "daily-log.json";
const EVENTS_FILE = "events.json";

export async function readStorage(dataDir = "data"): Promise<PreviousStorage> {
  const [state, dailyLog, events] = await Promise.all([
    readOptionalJson<StoredState>(join(dataDir, STATE_FILE)),
    readOptionalJson<DailyLogEntry[]>(join(dataDir, DAILY_LOG_FILE), []),
    readOptionalJson<Event[]>(join(dataDir, EVENTS_FILE), [])
  ]);

  return {
    state,
    dailyLog: dailyLog ?? [],
    events: events ?? []
  };
}

export async function writeStorageSnapshot(
  snapshot: StorageSnapshot,
  dataDir = "data"
): Promise<void> {
  await mkdir(dataDir, { recursive: true });

  await Promise.all([
    writeJson(join(dataDir, STATE_FILE), snapshot.state),
    writeJson(join(dataDir, DAILY_LOG_FILE), snapshot.dailyLog),
    writeJson(join(dataDir, EVENTS_FILE), snapshot.events)
  ]);
}

export async function persistStorageUpdate(
  input: StorageInput,
  dataDir = "data"
): Promise<StorageSnapshot> {
  const previous = await readStorage(dataDir);
  const snapshot = buildStorageSnapshot(input, previous);
  await writeStorageSnapshot(snapshot, dataDir);
  return snapshot;
}

export function buildStorageSnapshot(
  input: StorageInput,
  previous: PreviousStorage = { dailyLog: [], events: [] }
): StorageSnapshot {
  const date = toDateString(input.date ?? new Date());
  const state = buildStoredState(input, date);
  const dailyEntry = buildDailyLogEntry(state, date);
  const dailyLog = upsertDailyLogEntry(previous.dailyLog, dailyEntry);
  const events = mergeEvents(previous.events, [
    ...(input.title.event ? [input.title.event] : []),
    ...input.achievements.events,
    ...(input.events ?? [])
  ]);

  return {
    state,
    dailyLog,
    events
  };
}

export function getSnapshotForDate(
  dailyLog: DailyLogEntry[],
  date: string
): DailyLogEntry | undefined {
  return dailyLog.find((entry) => entry.date === date);
}

function buildStoredState(input: StorageInput, lastUpdated: string): StoredState {
  return {
    metadata: buildMetadata(input),
    lastUpdated,
    xp: input.journey.xp,
    title: input.title.currentTitleName,
    currentLocation: input.journey.currentLocationName,
    nextLocation: input.journey.nextLocationName,
    progressPercent: input.journey.progressPercent,
    characterX: input.journey.characterX,
    segmentProgressPercent: input.journey.segmentProgressPercent,
    achievementCount: input.achievements.achievementCount,
    achievements: input.achievements.achievements,
    stats: input.activity
  };
}

function buildDailyLogEntry(state: StoredState, date: string): DailyLogEntry {
  return {
    date,
    xp: state.xp,
    title: state.title,
    currentLocation: state.currentLocation,
    nextLocation: state.nextLocation,
    progressPercent: state.progressPercent,
    characterX: state.characterX,
    segmentProgressPercent: state.segmentProgressPercent,
    achievementCount: state.achievementCount,
    achievements: state.achievements,
    stats: state.stats
  };
}

function buildMetadata(input: StorageInput): StorageMetadata {
  return {
    theme: input.config.theme,
    githubUser: input.config.githubUser,
    journeyStartDate: input.config.journey.startDate,
    targetXP: input.config.journey.targetXP,
    xpMultiplier: input.config.journey.xpMultiplier
  };
}

function upsertDailyLogEntry(
  entries: DailyLogEntry[],
  entry: DailyLogEntry
): DailyLogEntry[] {
  const index = entries.findIndex((candidate) => candidate.date === entry.date);

  if (index === -1) {
    return [...entries, entry].sort((a, b) => a.date.localeCompare(b.date));
  }

  return entries.map((candidate, candidateIndex) => (candidateIndex === index ? entry : candidate));
}

function mergeEvents(existingEvents: Event[], newEvents: Event[]): Event[] {
  const events = [...existingEvents];
  const seen = new Set(existingEvents.map(eventKey));

  for (const event of newEvents) {
    const key = eventKey(event);
    if (!seen.has(key)) {
      events.push(event);
      seen.add(key);
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function eventKey(event: Event): string {
  return `${event.type}:${event.value}`;
}

async function readOptionalJson<T>(path: string, fallback?: T): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if (isFileNotFound(error)) {
      return fallback;
    }

    throw error;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ENOENT"
  );
}
