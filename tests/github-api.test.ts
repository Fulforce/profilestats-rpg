import { describe, expect, it } from "vitest";
import { GitHubClient } from "../src/github/github-api.js";

describe("GitHubClient", () => {
  it("aggregates REST pagination using next links", async () => {
    const seenUrls: string[] = [];
    const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
      const url = String(input);
      seenUrls.push(url);

      if (url.endsWith("/items")) {
        return jsonResponse([{ id: 1 }], 200, {
          link: '<https://api.github.test/items?page=2>; rel="next"'
        });
      }

      return jsonResponse([{ id: 2 }]);
    };

    const client = new GitHubClient({
      fetchImpl,
      restEndpoint: "https://api.github.test"
    });

    await expect(client.restPaginated<{ id: number }>("/items")).resolves.toEqual([
      { id: 1 },
      { id: 2 }
    ]);
    expect(seenUrls).toEqual([
      "https://api.github.test/items",
      "https://api.github.test/items?page=2"
    ]);
  });

  it("adds bearer auth when a token is provided", async () => {
    let authorization: string | null = null;
    const fetchImpl = async (
      _input: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      authorization = new Headers(init?.headers).get("authorization");

      return jsonResponse({
        data: {
          ok: true
        }
      });
    };

    const client = new GitHubClient({
      token: "secret-token",
      fetchImpl
    });

    await client.graphql<{ ok: boolean }>("query Test { ok }", {});

    expect(authorization).toBe("Bearer secret-token");
  });

  it("retries transient failures with bounded delays", async () => {
    let attempts = 0;
    const delays: number[] = [];
    const client = new GitHubClient({
      fetchImpl: async () => {
        attempts += 1;
        return attempts < 3
          ? jsonResponse({ message: "temporary" }, 503)
          : jsonResponse({ data: { ok: true } });
      },
      retryBaseDelayMs: 10,
      sleepImpl: async (milliseconds) => {
        delays.push(milliseconds);
      }
    });

    await expect(client.graphql<{ ok: boolean }>("query Test { ok }", {})).resolves.toEqual({
      ok: true
    });
    expect(attempts).toBe(3);
    expect(delays).toEqual([10, 20]);
  });

  it("refuses pagination links that could leak authorization to another origin", async () => {
    const client = new GitHubClient({
      token: "secret-token",
      restEndpoint: "https://api.github.test",
      fetchImpl: async () =>
        jsonResponse([{ id: 1 }], 200, {
          link: '<https://attacker.invalid/items?page=2>; rel="next"'
        })
    });

    await expect(client.restPaginated<{ id: number }>("/items")).rejects.toMatchObject({
      code: "GITHUB_INVALID_RESPONSE"
    });
  });

  it("does not expose GraphQL error details", async () => {
    const client = new GitHubClient({
      fetchImpl: async () =>
        jsonResponse({ errors: [{ message: "token secret-token was rejected" }] })
    });

    await expect(client.graphql("query Test { ok }", {})).rejects.toMatchObject({
      code: "GITHUB_COLLECTION_FAILED",
      message: "GitHub GraphQL could not complete the request."
    });
  });

  it("aborts requests that exceed the configured timeout", async () => {
    const client = new GitHubClient({
      timeoutMs: 1,
      maxRetries: 0,
      fetchImpl: async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        })
    });

    await expect(client.graphql("query Test { ok }", {})).rejects.toMatchObject({
      code: "GITHUB_NETWORK_FAILED",
      message: "GitHub API request timed out.",
      retryable: true
    });
  });
});

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers
    }
  });
}
