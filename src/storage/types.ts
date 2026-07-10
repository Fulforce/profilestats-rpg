import type {
  Activity,
  ActivityReport,
  JourneyEvent,
  JourneyRecord,
  SchemaVersion,
  XPResult
} from "../domain/types.js";

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

// Phase 3 replaces this renderer adapter with a dedicated shared view model.
export type StoredState = {
  metadata: {
    theme: string;
    githubUser: string;
    journeyStartDate: string;
    targetXP: number;
    xpMultiplier: number;
  };
  lastUpdated: string;
  xp: number;
  title: string;
  currentLocation: string;
  nextLocation?: string;
  progressPercent: number;
  characterX: number;
  segmentProgressPercent: number;
  achievementCount: number;
  achievements: string[];
  stats: Activity;
  activityReport: ActivityReport;
  xpBreakdown: XPResult;
};
