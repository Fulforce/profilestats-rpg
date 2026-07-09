import type { Activity } from "../domain/types.js";

export type XPRules = {
  [K in keyof Activity]: number;
};

export const defaultXPRules: XPRules = {
  commits: 1,
  prsOpened: 20,
  prsMerged: 50,
  issuesOpened: 10,
  issuesClosed: 15,
  reviewsSubmitted: 25,
  repositoriesCreated: 100,
  releasesPublished: 150,
  streaks: 200
};
