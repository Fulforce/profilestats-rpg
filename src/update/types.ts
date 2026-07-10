import type { ActivityReport, JourneyEvent } from "../domain/types.js";
import type { AppConfig } from "../config/types.js";
import type { StorageSnapshot } from "../storage/types.js";

export type ActivityProvider = (options: {
  githubUser: string;
  startDate: string;
  token?: string;
  date?: Date;
}) => Promise<ActivityReport>;

export type UpdateRunnerOptions = {
  configPath?: string;
  dataDir?: string;
  outputDir?: string;
  svgPath?: string;
  themesRoot?: string;
  token?: string;
  date?: Date;
  activityProvider?: ActivityProvider;
  allowAbandon?: boolean;
};

export type UpdateSummary = {
  config: AppConfig;
  snapshot: StorageSnapshot;
  generatedEvents: JourneyEvent[];
};
