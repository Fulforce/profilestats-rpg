import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeFilesTransaction, type FileArtifact } from "../io/transactional-files.js";
import type { Event } from "../domain/types.js";
import type {
  DailyLogEntry,
  PreviousStorage,
  StorageInput,
  StorageSnapshot,
  StoredState,
  StorageMetadata
} from "./types.js";
import { StorageError } from "./storage-error.js";

const STATE_FILE = "state.json";
const DAILY_LOG_FILE = "daily-log.json";
const EVENTS_FILE = "events.json";

export async function readStorage(dataDir = "data"): Promise<PreviousStorage> {
  const [state, dailyLog, events] = await Promise.all([
    readOptionalJson<StoredState>(join(dataDir, STATE_FILE), undefined, isStoredState),
    readOptionalJson<DailyLogEntry[]>(join(dataDir, DAILY_LOG_FILE), [], isDailyLog),
    readOptionalJson<Event[]>(join(dataDir, EVENTS_FILE), [], isEventLog)
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
  await writeFilesTransaction(buildStorageArtifacts(snapshot, dataDir));
}

export function buildStorageArtifacts(snapshot: StorageSnapshot, dataDir = "data"): FileArtifact[] {
  return [
    { path: join(dataDir, STATE_FILE), content: serializeJson(snapshot.state) },
    { path: join(dataDir, DAILY_LOG_FILE), content: serializeJson(snapshot.dailyLog) },
    { path: join(dataDir, EVENTS_FILE), content: serializeJson(snapshot.events) }
  ];
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
    stats: input.activity.counts,
    activityReport: input.activity,
    xpBreakdown: input.xp
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
    stats: state.stats,
    activityReport: state.activityReport,
    xpBreakdown: state.xpBreakdown
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

function upsertDailyLogEntry(entries: DailyLogEntry[], entry: DailyLogEntry): DailyLogEntry[] {
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

async function readOptionalJson<T>(
  path: string,
  fallback: T | undefined,
  validate: (value: unknown) => value is T
): Promise<T | undefined> {
  try {
    const value = JSON.parse(await readFile(path, "utf8")) as unknown;
    if (!validate(value)) {
      throw new StorageError("STORAGE_INVALID", `Generated data has an invalid shape: ${path}`);
    }
    return value;
  } catch (error) {
    if (isFileNotFound(error)) {
      return fallback;
    }

    if (error instanceof StorageError) {
      throw error;
    }

    throw new StorageError("STORAGE_INVALID", `Generated data file is invalid: ${path}`, {
      cause: error
    });
  }
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
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

function isStoredState(value: unknown): value is StoredState {
  return (
    isRecord(value) &&
    isRecord(value.metadata) &&
    typeof value.metadata.theme === "string" &&
    typeof value.metadata.githubUser === "string" &&
    typeof value.lastUpdated === "string" &&
    isNonNegativeNumber(value.xp) &&
    typeof value.title === "string" &&
    typeof value.currentLocation === "string" &&
    isActivity(value.stats) &&
    isActivityReport(value.activityReport) &&
    isXPResult(value.xpBreakdown)
  );
}

function isDailyLog(value: unknown): value is DailyLogEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.date === "string" &&
        isActivity(entry.stats) &&
        isActivityReport(entry.activityReport) &&
        isXPResult(entry.xpBreakdown)
    )
  );
}

function isEventLog(value: unknown): value is Event[] {
  const eventTypes = new Set(["LOCATION_UNLOCKED", "ACHIEVEMENT_UNLOCKED", "TITLE_UNLOCKED"]);
  return (
    Array.isArray(value) &&
    value.every(
      (event) =>
        isRecord(event) &&
        typeof event.date === "string" &&
        typeof event.type === "string" &&
        eventTypes.has(event.type) &&
        typeof event.value === "string"
    )
  );
}

function isActivityReport(value: unknown): boolean {
  return (
    isRecord(value) &&
    isActivity(value.counts) &&
    typeof value.githubUser === "string" &&
    isRecord(value.window) &&
    typeof value.window.from === "string" &&
    typeof value.window.to === "string" &&
    typeof value.collectedAt === "string" &&
    value.source === "github-public-api" &&
    typeof value.complete === "boolean" &&
    Array.isArray(value.warnings)
  );
}

function isXPResult(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.ruleSetVersion === "string" &&
    Array.isArray(value.sources) &&
    isNonNegativeNumber(value.rawXP) &&
    typeof value.multiplier === "number" &&
    Number.isFinite(value.multiplier) &&
    value.multiplier > 0 &&
    isNonNegativeNumber(value.calculatedXP) &&
    isNonNegativeNumber(value.awardedXP)
  );
}

function isActivity(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return [
    "commits",
    "prsOpened",
    "prsMerged",
    "issuesOpened",
    "issuesClosed",
    "reviewsSubmitted",
    "repositoriesCreated",
    "releasesPublished",
    "streaks"
  ].every((key) => isNonNegativeNumber(value[key]));
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
