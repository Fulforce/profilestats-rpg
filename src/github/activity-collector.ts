import type { Activity } from "../domain/types.js";
import { GitHubApiError } from "./github-error.js";
import { GitHubClient } from "./github-api.js";
import type {
  CollectActivityOptions,
  ContributionCalendarResponse,
  SearchCountResponse
} from "./types.js";

const CONTRIBUTIONS_QUERY = `
  query Contributions($login: String!, $from: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from) {
        totalCommitContributions
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

const SEARCH_COUNT_QUERY = `
  query SearchCount($query: String!) {
    search(query: $query, type: ISSUE, first: 1) {
      issueCount
    }
  }
`;

type RepositoryResponse = {
  created_at: string;
};

export async function collectActivity(options: CollectActivityOptions): Promise<Activity> {
  validateCollectionOptions(options);

  const token = options.token ?? process.env.GITHUB_TOKEN;
  const client = new GitHubClient({ token, fetchImpl: options.fetchImpl });
  const startDateTime = `${options.startDate}T00:00:00Z`;

  try {
    const [contributions, searchCounts, repositoriesCreated] = await Promise.all([
      collectContributionCalendar(client, options.githubUser, startDateTime),
      collectSearchCounts(client, options.githubUser, options.startDate),
      collectRepositoriesCreated(client, options.githubUser, options.startDate)
    ]);

    return {
      commits: contributions.commits,
      prsOpened: searchCounts.prsOpened,
      prsMerged: searchCounts.prsMerged,
      issuesOpened: searchCounts.issuesOpened,
      issuesClosed: searchCounts.issuesClosed,
      reviewsSubmitted: searchCounts.reviewsSubmitted,
      repositoriesCreated,
      releasesPublished: searchCounts.releasesPublished,
      streaks: calculateSevenDayStreaks(contributions.contributionDays)
    };
  } catch (error) {
    if (error instanceof GitHubApiError) {
      throw error;
    }

    throw new GitHubApiError("Unable to collect GitHub activity.", error);
  }
}

async function collectContributionCalendar(
  client: GitHubClient,
  githubUser: string,
  startDateTime: string
): Promise<{ commits: number; contributionDays: string[] }> {
  const data = await client.graphql<ContributionCalendarResponse>(CONTRIBUTIONS_QUERY, {
    login: githubUser,
    from: startDateTime
  });

  if (!data.user) {
    throw new GitHubApiError(`GitHub user "${githubUser}" was not found.`);
  }

  const collection = data.user.contributionsCollection;
  const contributionDays = collection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .filter((day) => day.contributionCount > 0)
    .map((day) => day.date)
    .sort();

  return {
    commits: collection.totalCommitContributions,
    contributionDays
  };
}

async function collectSearchCounts(
  client: GitHubClient,
  githubUser: string,
  startDate: string
): Promise<Omit<Activity, "commits" | "repositoriesCreated" | "streaks">> {
  const queries = {
    prsOpened: `author:${githubUser} type:pr created:>=${startDate}`,
    prsMerged: `author:${githubUser} type:pr merged:>=${startDate}`,
    issuesOpened: `author:${githubUser} type:issue created:>=${startDate}`,
    issuesClosed: `author:${githubUser} type:issue closed:>=${startDate}`,
    reviewsSubmitted: `reviewed-by:${githubUser} type:pr updated:>=${startDate}`,
    releasesPublished: `author:${githubUser} type:release created:>=${startDate}`
  };

  const entries = await Promise.all(
    Object.entries(queries).map(async ([key, query]) => [
      key,
      await collectSearchCount(client, query)
    ])
  );

  return Object.fromEntries(entries) as Omit<Activity, "commits" | "repositoriesCreated" | "streaks">;
}

async function collectSearchCount(client: GitHubClient, query: string): Promise<number> {
  const data = await client.graphql<SearchCountResponse>(SEARCH_COUNT_QUERY, { query });
  return data.search.issueCount;
}

async function collectRepositoriesCreated(
  client: GitHubClient,
  githubUser: string,
  startDate: string
): Promise<number> {
  const encodedUser = encodeURIComponent(githubUser);
  const repositories = await client.restPaginated<RepositoryResponse>(
    `/users/${encodedUser}/repos?per_page=100&sort=created&direction=desc&type=owner`
  );
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();

  return repositories.filter((repository) => new Date(repository.created_at).getTime() >= start)
    .length;
}

export function calculateSevenDayStreaks(contributionDays: string[]): number {
  const uniqueDays = [...new Set(contributionDays)].sort();
  let longestRun = 0;
  let currentRun = 0;
  let previousTime: number | undefined;

  for (const day of uniqueDays) {
    const currentTime = new Date(`${day}T00:00:00.000Z`).getTime();

    if (previousTime === undefined || currentTime - previousTime === 86_400_000) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }

    longestRun = Math.max(longestRun, currentRun);
    previousTime = currentTime;
  }

  return Math.floor(longestRun / 7);
}

function validateCollectionOptions(options: CollectActivityOptions): void {
  if (!options.githubUser.trim()) {
    throw new GitHubApiError("GitHub username is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.startDate)) {
    throw new GitHubApiError("Journey start date must use YYYY-MM-DD format.");
  }
}
