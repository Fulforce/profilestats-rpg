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
    const fetchImpl = async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
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
