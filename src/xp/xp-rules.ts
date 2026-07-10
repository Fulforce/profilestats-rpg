import type { Activity } from "../domain/types.js";

export type XPRules = {
  [K in keyof Activity]: number;
};

export const XP_RULE_SET_VERSION = "1.0.0";

export const defaultXPRules: XPRules = {
  commits: 2,
  prsOpened: 20,
  prsMerged: 40,
  issuesOpened: 10,
  issuesClosed: 10,
  reviewsSubmitted: 15,
  repositoriesCreated: 100,
  releasesPublished: 150,
  streaks: 200
};
