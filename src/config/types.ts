export type JourneyConfig = {
  id: string;
  startDate: string;
  targetXP: number;
  xpMultiplier: number;
};

export type DisplayConfig = {
  layout: "standard" | "compact";
  showStats: boolean;
  showTitle: boolean;
  showAchievements: boolean;
};

export type OutputConfig = {
  svgPath: string;
  dataDirectory: string;
};

export type AppConfig = {
  schemaVersion: 1;
  profile: {
    githubUser: string;
  };
  theme: {
    id: string;
  };
  journey: JourneyConfig;
  display: DisplayConfig;
  output: OutputConfig;
};

export type ConfigValidationIssue = {
  path: string;
  message: string;
};
