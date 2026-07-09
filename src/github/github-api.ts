import { GitHubApiError } from "./github-error.js";
import type { GitHubClientOptions, GraphQLResponse } from "./types.js";

const DEFAULT_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const DEFAULT_REST_ENDPOINT = "https://api.github.com";

export class GitHubClient {
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly graphqlEndpoint: string;
  private readonly restEndpoint: string;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.graphqlEndpoint = options.graphqlEndpoint ?? DEFAULT_GRAPHQL_ENDPOINT;
    this.restEndpoint = options.restEndpoint ?? DEFAULT_REST_ENDPOINT;
  }

  async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImpl(this.graphqlEndpoint, {
      method: "POST",
      headers: this.headers({
        "content-type": "application/json"
      }),
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new GitHubApiError(`GitHub GraphQL request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as GraphQLResponse<T>;

    if (payload.errors?.length) {
      throw new GitHubApiError(
        `GitHub GraphQL request failed: ${payload.errors.map((error) => error.message).join("; ")}`
      );
    }

    if (!payload.data) {
      throw new GitHubApiError("GitHub GraphQL response did not contain data.");
    }

    return payload.data;
  }

  async restPaginated<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    let nextUrl: string | undefined = `${this.restEndpoint}${path}`;

    while (nextUrl) {
      const response = await this.fetchImpl(nextUrl, {
        headers: this.headers({
          accept: "application/vnd.github+json"
        })
      });

      if (!response.ok) {
        throw new GitHubApiError(`GitHub REST request failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as T[];
      items.push(...payload);
      nextUrl = parseNextLink(response.headers.get("link"));
    }

    return items;
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
