import type { JourneyEvent, JourneyRecord, SchemaVersion } from "../domain/types.js";

export type StateDocument = {
  schemaVersion: SchemaVersion;
  engineVersion: string;
  profile: {
    githubUser: string;
  };
  current: JourneyRecord;
};

export type ArchivedJourneyRecord = JourneyRecord & {
  archiveReason: "COMPLETED" | "ABANDONED";
  archivedAt: string;
};

export type JourneyArchiveDocument = {
  schemaVersion: SchemaVersion;
  journeys: ArchivedJourneyRecord[];
};

export type DailyLogEntry = {
  journeyId: string;
  date: string;
  awardedXP: number;
  calculatedXP: number;
  progressPercent: number;
  locationId: string;
  titleId: string;
  achievementIds: string[];
  activityComplete: boolean;
};

export type DailyLogDocument = {
  schemaVersion: SchemaVersion;
  snapshots: DailyLogEntry[];
};

export type EventDocument = {
  schemaVersion: SchemaVersion;
  events: JourneyEvent[];
};

export type StorageSnapshot = {
  state: StateDocument;
  journeys: JourneyArchiveDocument;
  dailyLog: DailyLogDocument;
  events: EventDocument;
};

export type PreviousStorage = {
  state?: StateDocument;
  journeys: JourneyArchiveDocument;
  dailyLog: DailyLogDocument;
  events: EventDocument;
};

export type StorageUpdateInput = {
  githubUser: string;
  current: JourneyRecord;
  archivedJourneys?: ArchivedJourneyRecord[];
  newEvents?: JourneyEvent[];
};
