import type { Achievement, Title } from "../domain/types.js";

export type ThemeManifest = {
  schemaVersion?: 1;
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  defaultTargetXP: number;
  startingTitle: string;
};

export type ThemeMapLocation = {
  id: string;
  name: string;
  requiredXP: number;
  x: number;
  y?: number;
  terrain?: string;
  description?: string;
  landmark?: boolean;
};

export type ThemeMap = {
  targetXP: number;
  locations: ThemeMapLocation[];
};

export type ThemePalette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
};

export type ThemeSvgAsset = {
  content: string;
  viewBox: string;
};

export type AchievementCategory = "JOURNEY" | "XP" | "CONTRIBUTION" | "MILESTONE";

export type AchievementConditionType =
  | "xp"
  | "location"
  | "commits"
  | "prsOpened"
  | "prsMerged"
  | "issuesOpened"
  | "issuesClosed"
  | "reviewsSubmitted"
  | "repositoriesCreated"
  | "releasesPublished"
  | "streaks";

export type AchievementCondition = {
  type: AchievementConditionType;
  value: string | number;
};

export type AchievementDefinition = Omit<Achievement, "unlockedAt"> & {
  category: AchievementCategory;
  condition: AchievementCondition;
};

export type Theme = {
  manifest: ThemeManifest;
  map: ThemeMap;
  titles: Title[];
  achievements: AchievementDefinition[];
  palette: ThemePalette;
  assets: {
    character: ThemeSvgAsset;
  };
};

export type ThemeData = Omit<Theme, "assets">;

export type ThemeValidationIssue = {
  path: string;
  message: string;
};

export type RawThemeFiles = {
  manifest: unknown;
  map: unknown;
  titles: unknown;
  achievements: unknown;
  palette: unknown;
};
