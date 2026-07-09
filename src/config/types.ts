export type JourneyConfig = {
  startDate: string;
  targetXP: number;
  xpMultiplier: number;
};

export type DisplayConfig = {
  showStats: boolean;
  showTitle: boolean;
  showAchievements: boolean;
};

export type AppConfig = {
  githubUser: string;
  theme: string;
  journey: JourneyConfig;
  display: DisplayConfig;
};

export type ConfigValidationIssue = {
  path: string;
  message: string;
};
