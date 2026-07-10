import type {
  Activity,
  ActivityMetric,
  ActivityReport,
  CollectionWarning
} from "../domain/types.js";
import { GitHubApiError } from "./github-error.js";
import { GitHubClient } from "./github-api.js";
import type {
  CollectActivityOptions,
  ContributionCalendarResponse,
  SearchCountResponse
} from "./types.js";

const SEARCH_RESULT_SAFETY_LIMIT = 1_000;

const CONTRIBUTIONS_QUERY = `
  query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestReviewContributions
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
  fork: boolean;
};

type ContributionResult = {
  commits: number;
  reviewsSubmitted: number;
  contributionDays: string[];
};

type SearchResult = {
  counts: Pick<Activity, "prsOpened" | "prsMerged" | "issuesOpened" | "issuesClosed">;
  warnings: CollectionWarning[];
};

export async function collectActivity(options: CollectActivityOptions): Promise<ActivityReport> {
  const collectedAt = options.date ?? new Date();
  validateCollectionOptions(options, collectedAt);

  const token = options.token ?? process.env.GITHUB_TOKEN;
  const client = new GitHubClient({ token, fetchImpl: options.fetchImpl });
  const fromDateTime = `${options.startDate}T00:00:00.000Z`;
  const toDateTime = collectedAt.toISOString();
  const toDate = toDateTime.slice(0, 10);

  try {
    const [contributions, search, repositoriesCreated] = await Promise.all([
      collectContributionCalendar(client, options.githubUser, fromDateTime, toDateTime),
      collectSearchCounts(client, options.githubUser, options.startDate, toDate),
      collectRepositoriesCreated(client, options.githubUser, options.startDate, toDateTime)
    ]);
    const warnings: CollectionWarning[] = [
      ...search.warnings,
      {
        code: "RELEASE_ATTRIBUTION_UNAVAILABLE",
        metric: "releasesPublished",
        message: "GitHub does not expose complete public release-author totals for a user."
      }
    ];

    return {
      counts: {
        commits: contributions.commits,
        prsOpened: search.counts.prsOpened,
        prsMerged: search.counts.prsMerged,
        issuesOpened: search.counts.issuesOpened,
        issuesClosed: search.counts.issuesClosed,
        reviewsSubmitted: contributions.reviewsSubmitted,
        repositoriesCreated,
        releasesPublished: 0,
        streaks: calculateSevenDayStreaks(contributions.contributionDays)
      },
      githubUser: options.githubUser,
      window: { from: options.startDate, to: toDate },
      collectedAt: toDateTime,
      source: "github-public-api",
      complete: warnings.length === 0,
      warnings
    };
  } catch (error) {
    if (error instanceof GitHubApiError) {
      throw error;
    }

    throw new GitHubApiError(
      "GITHUB_COLLECTION_FAILED",
      "Unable to collect public GitHub activity.",
      { cause: error }
    );
  }
}

async function collectContributionCalendar(
  client: GitHubClient,
  githubUser: string,
  fromDateTime: string,
  toDateTime: string
): Promise<ContributionResult> {
  const data = await client.graphql<ContributionCalendarResponse>(CONTRIBUTIONS_QUERY, {
    login: githubUser,
    from: fromDateTime,
    to: toDateTime
  });

  if (!isRecord(data) || !("user" in data)) {
    throw invalidResponse("GitHub contribution response was malformed.");
  }

  if (data.user === null) {
    throw new GitHubApiError("GITHUB_USER_NOT_FOUND", `GitHub user "${githubUser}" was not found.`);
  }

  if (!isContributionCollection(data.user.contributionsCollection)) {
    throw invalidResponse("GitHub contribution collection was malformed.");
  }

  const collection = data.user.contributionsCollection;
  const contributionDays = collection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .filter((day) => day.contributionCount > 0)
    .map((day) => day.date)
    .sort();

  return {
    commits: collection.totalCommitContributions,
    reviewsSubmitted: collection.totalPullRequestReviewContributions,
    contributionDays
  };
}

async function collectSearchCounts(
  client: GitHubClient,
  githubUser: string,
  startDate: string,
  endDate: string
): Promise<SearchResult> {
  const dateRange = `${startDate}..${endDate}`;
  const queries: Record<keyof SearchResult["counts"], string> = {
    prsOpened: `author:${githubUser} is:pr created:${dateRange}`,
    prsMerged: `author:${githubUser} is:pr is:merged merged:${dateRange}`,
    issuesOpened: `author:${githubUser} is:issue created:${dateRange}`,
    issuesClosed: `author:${githubUser} is:issue closed:${dateRange}`
  };
  const entries = await Promise.all(
    Object.entries(queries).map(async ([metric, query]) => {
      const typedMetric = metric as keyof SearchResult["counts"];
      return [typedMetric, await collectSearchCount(client, query, typedMetric)] as const;
    })
  );
  const warnings = entries.flatMap(([metric, count]) =>
    count >= SEARCH_RESULT_SAFETY_LIMIT
      ? [
          {
            code: "SEARCH_RESULT_LIMIT_REACHED",
            metric,
            message: `GitHub search reached its safety limit for ${metric}.`
          } satisfies CollectionWarning
        ]
      : []
  );

  return {
    counts: Object.fromEntries(entries) as SearchResult["counts"],
    warnings
  };
}

async function collectSearchCount(
  client: GitHubClient,
  query: string,
  metric: ActivityMetric
): Promise<number> {
  const data = await client.graphql<SearchCountResponse>(SEARCH_COUNT_QUERY, { query });

  if (!isRecord(data) || !isRecord(data.search) || !isNonNegativeInteger(data.search.issueCount)) {
    throw new GitHubApiError(
      "GITHUB_INVALID_RESPONSE",
      `GitHub returned an invalid count for ${metric}.`,
      { metric }
    );
  }

  return data.search.issueCount;
}

async function collectRepositoriesCreated(
  client: GitHubClient,
  githubUser: string,
  startDate: string,
  toDateTime: string
): Promise<number> {
  const encodedUser = encodeURIComponent(githubUser);
  const repositories = await client.restPaginated<RepositoryResponse>(
    `/users/${encodedUser}/repos?per_page=100&sort=created&direction=desc&type=owner`,
    isRepositoryResponse
  );
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(toDateTime).getTime();

  return repositories.filter((repository) => {
    const createdAt = new Date(repository.created_at).getTime();
    return !repository.fork && createdAt >= start && createdAt <= end;
  }).length;
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

function validateCollectionOptions(options: CollectActivityOptions, collectedAt: Date): void {
  if (!options.githubUser.trim()) {
    throw new GitHubApiError("GITHUB_COLLECTION_FAILED", "GitHub username is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.startDate)) {
    throw new GitHubApiError(
      "GITHUB_COLLECTION_FAILED",
      "Journey start date must use YYYY-MM-DD format."
    );
  }

  const start = new Date(`${options.startDate}T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 10) !== options.startDate ||
    Number.isNaN(collectedAt.getTime()) ||
    start.getTime() > collectedAt.getTime()
  ) {
    throw new GitHubApiError("GITHUB_COLLECTION_FAILED", "Journey collection window is invalid.");
  }
}

function isContributionCollection(
  value: unknown
): value is ContributionCalendarResponse["user"] extends null
  ? never
  : NonNullable<ContributionCalendarResponse["user"]>["contributionsCollection"] {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value.totalCommitContributions) ||
    !isNonNegativeInteger(value.totalPullRequestReviewContributions) ||
    !isRecord(value.contributionCalendar) ||
    !Array.isArray(value.contributionCalendar.weeks)
  ) {
    return false;
  }

  return value.contributionCalendar.weeks.every(
    (week) =>
      isRecord(week) &&
      Array.isArray(week.contributionDays) &&
      week.contributionDays.every(
        (day) =>
          isRecord(day) &&
          typeof day.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
          isNonNegativeInteger(day.contributionCount)
      )
  );
}

function isRepositoryResponse(value: unknown): value is RepositoryResponse {
  return (
    isRecord(value) &&
    typeof value.created_at === "string" &&
    !Number.isNaN(new Date(value.created_at).getTime()) &&
    typeof value.fork === "boolean"
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(message: string): GitHubApiError {
  return new GitHubApiError("GITHUB_INVALID_RESPONSE", message);
}
