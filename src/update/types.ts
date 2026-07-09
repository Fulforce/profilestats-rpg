import type { Activity, Event } from "../domain/types.js";
import type { AppConfig } from "../config/types.js";
import type { StorageSnapshot } from "../storage/types.js";

export type ActivityProvider = (options: {
  githubUser: string;
  startDate: string;
  token?: string;
}) => Promise<Activity>;

export type UpdateRunnerOptions = {
  configPath?: string;
  dataDir?: string;
  outputDir?: string;
  themesRoot?: string;
  token?: string;
  date?: Date;
  activityProvider?: ActivityProvider;
};

export type UpdateSummary = {
  config: AppConfig;
  snapshot: StorageSnapshot;
  generatedEvents: Event[];
};
