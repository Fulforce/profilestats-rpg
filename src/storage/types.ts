import type {
  Activity,
  ActivityReport,
  Event,
  JourneyState,
  TitleResult,
  AchievementResult,
  XPResult
} from "../domain/types.js";
import type { AppConfig } from "../config/types.js";

export type StorageMetadata = {
  theme: string;
  githubUser: string;
  journeyStartDate: string;
  targetXP: number;
  xpMultiplier: number;
};

export type StoredState = {
  metadata: StorageMetadata;
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

export type DailyLogEntry = Omit<StoredState, "metadata" | "lastUpdated"> & {
  date: string;
};

export type StorageInput = {
  config: AppConfig;
  activity: ActivityReport;
  xp: XPResult;
  journey: JourneyState;
  title: TitleResult;
  achievements: AchievementResult;
  events?: Event[];
  date?: Date;
};

export type StorageSnapshot = {
  state: StoredState;
  dailyLog: DailyLogEntry[];
  events: Event[];
};

export type PreviousStorage = {
  state?: StoredState;
  dailyLog: DailyLogEntry[];
  events: Event[];
};
