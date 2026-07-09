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

export type XPResult = {
  rawXP: number;
  multiplier: number;
  finalXP: number;
};

export type JourneyState = {
  progressPercent: number;
  currentLocationId: string;
  currentLocationName: string;
  nextLocationId?: string;
  nextLocationName?: string;
};

export type Title = {
  id: string;
  name: string;
  requiredXP: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
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
