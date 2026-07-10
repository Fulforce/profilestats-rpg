export const SCHEMA_VERSION = 1 as const;

export type SchemaVersion = typeof SCHEMA_VERSION;

export type Activity = {
  commits: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviewsSubmitted: number;
  repositoriesCreated: number;
  releasesPublished: number;
  streaks: number;
};

export type ActivityMetric = keyof Activity;

export type CollectionWarning = {
  code: string;
  metric?: ActivityMetric;
  message: string;
};

export type ActivityReport = {
  counts: Activity;
  githubUser: string;
  window: {
    from: string;
    to: string;
  };
  collectedAt: string;
  source: "github-public-api";
  complete: boolean;
  warnings: CollectionWarning[];
};

export type XPSource = {
  metric: ActivityMetric;
  count: number;
  unitXP: number;
  earnedXP: number;
};

export type XPResult = {
  ruleSetVersion: string;
  sources: XPSource[];
  rawXP: number;
  multiplier: number;
  calculatedXP: number;
  awardedXP: number;
};

export type JourneyState = {
  xp: number;
  targetXP: number;
  progressPercent: number;
  currentLocationId: string;
  currentLocationName: string;
  nextLocationId?: string;
  nextLocationName?: string;
  characterX: number;
  segmentProgressPercent: number;
};

export type Title = {
  id: string;
  name: string;
  requiredXP: number;
};

export type TitleResult = {
  currentTitleId: string;
  currentTitleName: string;
  unlockedTitles: string[];
  newlyUnlockedTitle?: string;
  event?: Event;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
};

export type AchievementResult = {
  achievements: string[];
  unlockedThisRun: string[];
  achievementCount: number;
  events: Event[];
};

export type State = {
  xp: number;
  title: string;
  location: string;
  progressPercent: number;
  achievements: string[];
  lastUpdated: string;
};

export type DailySnapshot = {
  date: string;
  xp: number;
  title: string;
  location: string;
  progressPercent: number;
  achievements: string[];
};

export type Event = {
  date: string;
  type: "LOCATION_UNLOCKED" | "ACHIEVEMENT_UNLOCKED" | "TITLE_UNLOCKED";
  value: string;
};
