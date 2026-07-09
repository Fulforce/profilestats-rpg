import type { Achievement, Title } from "../domain/types.js";

export type ThemeManifest = {
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
  terrain?: string;
  description?: string;
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
  | "releasesPublished";

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
};

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
