import type { Activity } from "../domain/types.js";

export type GitHubFetch = typeof fetch;

export type GitHubClientOptions = {
  token?: string;
  fetchImpl?: GitHubFetch;
  graphqlEndpoint?: string;
  restEndpoint?: string;
};

export type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type SearchCountResponse = {
  search: {
    issueCount: number;
  };
};

export type ContributionCalendarResponse = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{
            date: string;
            contributionCount: number;
          }>;
        }>;
      };
    };
  } | null;
};

export type CollectActivityOptions = {
  githubUser: string;
  startDate: string;
  token?: string;
  fetchImpl?: GitHubFetch;
};

export type ActivityCollector = {
  collectActivity(options: CollectActivityOptions): Promise<Activity>;
};
