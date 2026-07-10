import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { JourneyEvent, JourneyRecord } from "../domain/types.js";
import { SCHEMA_VERSION } from "../domain/types.js";
import { writeFilesTransaction, type FileArtifact } from "../io/transactional-files.js";
import { StorageError } from "./storage-error.js";
import type {
  ArchivedJourneyRecord,
  DailyLogDocument,
  DailyLogEntry,
  EventDocument,
  JourneyArchiveDocument,
  PreviousStorage,
  StateDocument,
  StorageSnapshot,
  StorageUpdateInput,
  StoredState
} from "./types.js";

const ENGINE_VERSION = "0.1.0";
const STATE_FILE = "state.json";
const JOURNEYS_FILE = "journeys.json";
const DAILY_LOG_FILE = "daily-log.json";
const EVENTS_FILE = "events.json";

export async function readStorage(dataDir = "data"): Promise<PreviousStorage> {
  const [state, journeys, dailyLog, events] = await Promise.all([
    readOptionalJson(join(dataDir, STATE_FILE), isStateDocument),
    readOptionalJson(join(dataDir, JOURNEYS_FILE), isJourneyArchiveDocument),
    readOptionalJson(join(dataDir, DAILY_LOG_FILE), isDailyLogDocument),
    readOptionalJson(join(dataDir, EVENTS_FILE), isEventDocument)
  ]);

  return {
    state,
    journeys: journeys ?? { schemaVersion: SCHEMA_VERSION, journeys: [] },
    dailyLog: dailyLog ?? { schemaVersion: SCHEMA_VERSION, snapshots: [] },
    events: events ?? { schemaVersion: SCHEMA_VERSION, events: [] }
  };
}

export function buildStorageSnapshot(
  input: StorageUpdateInput,
  previous: PreviousStorage
): StorageSnapshot {
  const state: StateDocument = {
    schemaVersion: SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    profile: { githubUser: input.githubUser },
    current: input.current
  };
  const archiveCandidates = [
    ...previous.journeys.journeys,
    ...(input.archivedJourneys ?? []),
    ...(input.current.progress.status === "COMPLETED"
      ? [toCompletedArchiveRecord(input.current)]
      : [])
  ];
  const journeys: JourneyArchiveDocument = {
    schemaVersion: SCHEMA_VERSION,
    journeys: mergeArchivedJourneys(archiveCandidates)
  };
  const dailyLog: DailyLogDocument = {
    schemaVersion: SCHEMA_VERSION,
    snapshots: upsertDailyLogEntry(previous.dailyLog.snapshots, buildDailyLogEntry(input.current))
  };
  const events: EventDocument = {
    schemaVersion: SCHEMA_VERSION,
    events: mergeEvents(previous.events.events, input.newEvents ?? [])
  };

  return { state, journeys, dailyLog, events };
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
    { path: join(dataDir, JOURNEYS_FILE), content: serializeJson(snapshot.journeys) },
    { path: join(dataDir, DAILY_LOG_FILE), content: serializeJson(snapshot.dailyLog) },
    { path: join(dataDir, EVENTS_FILE), content: serializeJson(snapshot.events) }
  ];
}

export function toRenderState(state: StateDocument): StoredState {
  const record = state.current;
  const currentLocation = record.route.find(
    (location) => location.id === record.progress.currentLocationId
  );
  const nextLocation = record.route.find(
    (location) => location.id === record.progress.nextLocationId
  );

  if (!currentLocation) {
    throw new StorageError(
      "STORAGE_INVALID",
      `Current journey location is missing: ${record.progress.currentLocationId}`
    );
  }

  return {
    metadata: {
      theme: record.definition.themeId,
      githubUser: state.profile.githubUser,
      journeyStartDate: record.definition.startDate,
      targetXP: record.definition.targetXP,
      xpMultiplier: record.definition.xpMultiplier
    },
    lastUpdated: record.lastUpdated.slice(0, 10),
    xp: record.progress.xp,
    title: record.titleName,
    currentLocation: currentLocation.name,
    nextLocation: nextLocation?.name,
    progressPercent: record.progress.progressPercent,
    characterX: record.progress.characterX,
    segmentProgressPercent: record.progress.segmentProgressPercent,
    achievementCount: record.achievements.length,
    achievements: record.achievements.map((achievement) => achievement.achievementId),
    stats: record.activity.counts,
    activityReport: record.activity,
    xpBreakdown: record.xp
  };
}

export function getSnapshotForDate(
  dailyLog: DailyLogDocument,
  journeyId: string,
  date: string
): DailyLogEntry | undefined {
  return dailyLog.snapshots.find((entry) => entry.journeyId === journeyId && entry.date === date);
}

function buildDailyLogEntry(record: JourneyRecord): DailyLogEntry {
  return {
    journeyId: record.definition.id,
    date: record.lastUpdated.slice(0, 10),
    awardedXP: record.xp.awardedXP,
    calculatedXP: record.xp.calculatedXP,
    progressPercent: record.progress.progressPercent,
    locationId: record.progress.currentLocationId,
    titleId: record.titleId,
    achievementIds: record.achievements.map((achievement) => achievement.achievementId),
    activityComplete: record.activity.complete
  };
}

function upsertDailyLogEntry(entries: DailyLogEntry[], entry: DailyLogEntry): DailyLogEntry[] {
  const withoutCurrent = entries.filter(
    (candidate) => !(candidate.journeyId === entry.journeyId && candidate.date === entry.date)
  );
  return [...withoutCurrent, entry].sort(
    (a, b) => a.date.localeCompare(b.date) || a.journeyId.localeCompare(b.journeyId)
  );
}

function toCompletedArchiveRecord(record: JourneyRecord): ArchivedJourneyRecord {
  return {
    ...record,
    archiveReason: "COMPLETED",
    archivedAt: record.progress.completedAt ?? record.lastUpdated
  };
}

function mergeArchivedJourneys(records: ArchivedJourneyRecord[]): ArchivedJourneyRecord[] {
  const byId = new Map<string, ArchivedJourneyRecord>();
  for (const record of records) {
    if (!byId.has(record.definition.id)) {
      byId.set(record.definition.id, record);
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.progress.startedAt.localeCompare(b.progress.startedAt) ||
      a.definition.id.localeCompare(b.definition.id)
  );
}

function mergeEvents(existing: JourneyEvent[], additions: JourneyEvent[]): JourneyEvent[] {
  const byId = new Map(existing.map((event) => [event.id, event]));
  for (const event of additions) {
    if (!byId.has(event.id)) {
      byId.set(event.id, event);
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      a.occurredAt.localeCompare(b.occurredAt) ||
      eventOrder(a) - eventOrder(b) ||
      a.id.localeCompare(b.id)
  );
}

function eventOrder(event: JourneyEvent): number {
  return [
    "JOURNEY_STARTED",
    "LOCATION_UNLOCKED",
    "TITLE_UNLOCKED",
    "ACHIEVEMENT_UNLOCKED",
    "JOURNEY_COMPLETED"
  ].indexOf(event.type);
}

async function readOptionalJson<T>(
  path: string,
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
      return undefined;
    }
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError("STORAGE_INVALID", `Generated data file is invalid: ${path}`, {
      cause: error
    });
  }
}

function isStateDocument(value: unknown): value is StateDocument {
  return (
    isRecord(value) &&
    value.schemaVersion === SCHEMA_VERSION &&
    typeof value.engineVersion === "string" &&
    isRecord(value.profile) &&
    typeof value.profile.githubUser === "string" &&
    isJourneyRecord(value.current)
  );
}

function isJourneyArchiveDocument(value: unknown): value is JourneyArchiveDocument {
  return (
    isRecord(value) &&
    value.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(value.journeys) &&
    value.journeys.every(isArchivedJourneyRecord)
  );
}

function isArchivedJourneyRecord(value: unknown): value is ArchivedJourneyRecord {
  if (!isJourneyRecord(value)) {
    return false;
  }

  const archive = value as unknown as Record<string, unknown>;
  return (
    (archive.archiveReason === "COMPLETED" || archive.archiveReason === "ABANDONED") &&
    typeof archive.archivedAt === "string"
  );
}

function isDailyLogDocument(value: unknown): value is DailyLogDocument {
  return (
    isRecord(value) &&
    value.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(value.snapshots) &&
    value.snapshots.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.journeyId === "string" &&
        typeof entry.date === "string" &&
        isNonNegativeNumber(entry.awardedXP) &&
        isNonNegativeNumber(entry.calculatedXP) &&
        typeof entry.locationId === "string" &&
        typeof entry.titleId === "string" &&
        Array.isArray(entry.achievementIds) &&
        typeof entry.activityComplete === "boolean"
    )
  );
}

function isEventDocument(value: unknown): value is EventDocument {
  const types = new Set([
    "JOURNEY_STARTED",
    "LOCATION_UNLOCKED",
    "TITLE_UNLOCKED",
    "ACHIEVEMENT_UNLOCKED",
    "JOURNEY_COMPLETED"
  ]);
  return (
    isRecord(value) &&
    value.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(value.events) &&
    value.events.every(
      (event) =>
        isRecord(event) &&
        typeof event.id === "string" &&
        typeof event.journeyId === "string" &&
        typeof event.occurredAt === "string" &&
        typeof event.type === "string" &&
        types.has(event.type) &&
        typeof event.value === "string"
    )
  );
}

function isJourneyRecord(value: unknown): value is JourneyRecord {
  return (
    isRecord(value) &&
    isRecord(value.definition) &&
    typeof value.definition.id === "string" &&
    typeof value.definition.startDate === "string" &&
    isNonNegativeNumber(value.definition.targetXP) &&
    isRecord(value.progress) &&
    typeof value.progress.journeyId === "string" &&
    (value.progress.status === "ACTIVE" || value.progress.status === "COMPLETED") &&
    isNonNegativeNumber(value.progress.xp) &&
    typeof value.progress.currentLocationId === "string" &&
    isActivityReport(value.activity) &&
    isXPResult(value.xp) &&
    typeof value.titleId === "string" &&
    typeof value.titleName === "string" &&
    Array.isArray(value.achievements) &&
    Array.isArray(value.route) &&
    typeof value.themeName === "string" &&
    typeof value.lastUpdated === "string"
  );
}

function isActivityReport(value: unknown): boolean {
  return (
    isRecord(value) &&
    isRecord(value.counts) &&
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
    isNonNegativeNumber(value.calculatedXP) &&
    isNonNegativeNumber(value.awardedXP)
  );
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ENOENT"
  );
}
