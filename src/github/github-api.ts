import { GitHubApiError, type GitHubErrorCode } from "./github-error.js";
import type { GitHubClientOptions, GraphQLResponse } from "./types.js";

const DEFAULT_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const DEFAULT_REST_ENDPOINT = "https://api.github.com";
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_PAGES = 100;

export class GitHubClient {
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly graphqlEndpoint: string;
  private readonly restEndpoint: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly sleepImpl: (milliseconds: number) => Promise<void>;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.graphqlEndpoint = options.graphqlEndpoint ?? DEFAULT_GRAPHQL_ENDPOINT;
    this.restEndpoint = options.restEndpoint ?? DEFAULT_REST_ENDPOINT;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 250;
    this.sleepImpl = options.sleepImpl ?? sleep;
  }

  async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await this.request(this.graphqlEndpoint, {
      method: "POST",
      headers: this.headers({ "content-type": "application/json" }),
      body: JSON.stringify({ query, variables })
    });
    const payload = await parseJson<GraphQLResponse<T>>(response);

    if (!isRecord(payload)) {
      throw invalidResponse("GitHub GraphQL returned an invalid response.");
    }

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      const rateLimited = payload.errors.some(
        (error) => isRecord(error) && String(error.message).toLowerCase().includes("rate limit")
      );
      throw new GitHubApiError(
        rateLimited ? "GITHUB_RATE_LIMITED" : "GITHUB_COLLECTION_FAILED",
        rateLimited
          ? "GitHub API rate limit was exceeded. Retry after the limit resets."
          : "GitHub GraphQL could not complete the request.",
        { retryable: rateLimited }
      );
    }

    if (!("data" in payload) || payload.data === undefined || payload.data === null) {
      throw invalidResponse("GitHub GraphQL response did not contain data.");
    }

    return payload.data;
  }

  async restPaginated<T>(path: string, isItem?: (value: unknown) => value is T): Promise<T[]> {
    const items: T[] = [];
    const restOrigin = new URL(this.restEndpoint).origin;
    let nextUrl: string | undefined = new URL(path, `${this.restEndpoint}/`).toString();
    let pageCount = 0;

    while (nextUrl) {
      pageCount += 1;
      if (pageCount > MAX_PAGES) {
        throw new GitHubApiError(
          "GITHUB_COLLECTION_FAILED",
          `GitHub REST pagination exceeded the ${MAX_PAGES}-page safety limit.`
        );
      }

      if (new URL(nextUrl).origin !== restOrigin) {
        throw invalidResponse("GitHub REST pagination attempted to leave the API origin.");
      }

      const response = await this.request(nextUrl, {
        headers: this.headers({ accept: "application/vnd.github+json" })
      });
      const payload = await parseJson<unknown>(response);

      if (!Array.isArray(payload) || (isItem && !payload.every(isItem))) {
        throw invalidResponse("GitHub REST returned an invalid paginated response.");
      }

      items.push(...(payload as T[]));
      nextUrl = parseNextLink(response.headers.get("link"));
    }

    return items;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchImpl(url, {
          ...init,
          signal: controller.signal,
          redirect: "error"
        });

        if (response.ok) {
          return response;
        }

        if (RETRYABLE_STATUSES.has(response.status) && attempt < this.maxRetries) {
          await this.waitBeforeRetry(attempt, response.headers.get("retry-after"));
          continue;
        }

        throw errorForStatus(response.status, response.headers);
      } catch (error) {
        if (error instanceof GitHubApiError) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.waitBeforeRetry(attempt);
          continue;
        }

        const timedOut = isAbortError(error);
        throw new GitHubApiError(
          "GITHUB_NETWORK_FAILED",
          timedOut ? "GitHub API request timed out." : "GitHub API request failed.",
          { cause: error, retryable: true }
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new GitHubApiError("GITHUB_NETWORK_FAILED", "GitHub API request failed.", {
      retryable: true
    });
  }

  private async waitBeforeRetry(attempt: number, retryAfter: string | null = null): Promise<void> {
    const retryAfterMs = parseRetryAfter(retryAfter);
    const exponentialMs = this.retryBaseDelayMs * 2 ** attempt;
    await this.sleepImpl(Math.min(retryAfterMs ?? exponentialMs, 5_000));
  }

  private headers(extra: Record<string, string>): Record<string, string> {
    return {
      ...extra,
      "x-github-api-version": "2022-11-28",
      ...(this.token ? { authorization: `Bearer ${this.token}` } : {})
    };
  }
}

function parseNextLink(linkHeader: string | null): string | undefined {
  if (!linkHeader) {
    return undefined;
  }

  const nextLink = linkHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.endsWith('rel="next"'));

  return nextLink?.match(/<([^>]+)>/)?.[1];
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new GitHubApiError("GITHUB_INVALID_RESPONSE", "GitHub API returned invalid JSON.", {
      cause: error
    });
  }
}

function errorForStatus(status: number, headers: Headers): GitHubApiError {
  let code: GitHubErrorCode = "GITHUB_COLLECTION_FAILED";
  let message = `GitHub API request failed with status ${status}.`;

  if (status === 401) {
    code = "GITHUB_AUTHENTICATION_FAILED";
    message = "GitHub authentication failed.";
  } else if (status === 403 && headers.get("x-ratelimit-remaining") === "0") {
    code = "GITHUB_RATE_LIMITED";
    message = "GitHub API rate limit was exceeded. Retry after the limit resets.";
  } else if (status === 403) {
    code = "GITHUB_AUTHENTICATION_FAILED";
    message = "GitHub denied access to the requested public activity.";
  }

  return new GitHubApiError(code, message, {
    retryable: RETRYABLE_STATUSES.has(status) || code === "GITHUB_RATE_LIMITED"
  });
}

function invalidResponse(message: string): GitHubApiError {
  return new GitHubApiError("GITHUB_INVALID_RESPONSE", message);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1_000 : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
