import { describe, expect, it } from "vitest";
import { calculateSevenDayStreaks, collectActivity } from "../src/github/activity-collector.js";
import contributionsFixture from "./fixtures/github/contributions.json" with { type: "json" };
import repositoriesFixture from "./fixtures/github/repositories.json" with { type: "json" };

describe("collectActivity", () => {
  it("collects normalized activity from mocked GitHub responses", async () => {
    const fetchImpl = async (
      input: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      const url = String(input);

      if (url === "https://api.github.com/graphql") {
        const body = JSON.parse(String(init?.body)) as {
          variables: { login?: string; query?: string };
        };

        if (body.variables.login === "octocat") {
          return jsonResponse(contributionsFixture);
        }

        const query = body.variables.query ?? "";
        const count = query.includes("is:pr created")
          ? 5
          : query.includes("is:pr is:merged")
            ? 3
            : query.includes("is:issue created")
              ? 8
              : query.includes("is:issue closed")
                ? 4
                : 0;

        return jsonResponse({
          data: {
            search: {
              issueCount: count
            }
          }
        });
      }

      if (url.includes("/users/octocat/repos")) {
        return jsonResponse(repositoriesFixture);
      }

      return jsonResponse({ message: "not found" }, 404);
    };

    await expect(
      collectActivity({
        githubUser: "octocat",
        startDate: "2026-01-01",
        date: new Date("2026-07-09T12:00:00.000Z"),
        fetchImpl
      })
    ).resolves.toEqual({
      counts: {
        commits: 42,
        prsOpened: 5,
        prsMerged: 3,
        issuesOpened: 8,
        issuesClosed: 4,
        reviewsSubmitted: 6,
        repositoriesCreated: 2,
        releasesPublished: 0,
        streaks: 1
      },
      githubUser: "octocat",
      window: { from: "2026-01-01", to: "2026-07-09" },
      collectedAt: "2026-07-09T12:00:00.000Z",
      source: "github-public-api",
      complete: false,
      warnings: [
        {
          code: "RELEASE_ATTRIBUTION_UNAVAILABLE",
          metric: "releasesPublished",
          message: "GitHub does not expose complete public release-author totals for a user."
        }
      ]
    });
  });

  it("rejects malformed contribution responses with a stable safe error", async () => {
    const fetchImpl = async (): Promise<Response> => jsonResponse({ data: { user: {} } });

    await expect(
      collectActivity({
        githubUser: "octocat",
        startDate: "2026-01-01",
        date: new Date("2026-07-09T12:00:00.000Z"),
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "GITHUB_INVALID_RESPONSE",
      message: "GitHub contribution collection was malformed."
    });
  });

  it("marks search-limit results as incomplete", async () => {
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      if (String(input).includes("/users/octocat/repos")) {
        return jsonResponse([]);
      }

      const body = JSON.parse(String(init?.body)) as {
        variables: { login?: string };
      };
      return body.variables.login
        ? jsonResponse(contributionsFixture)
        : jsonResponse({ data: { search: { issueCount: 1000 } } });
    };

    const report = await collectActivity({
      githubUser: "octocat",
      startDate: "2026-01-01",
      date: new Date("2026-07-09T12:00:00.000Z"),
      fetchImpl
    });

    expect(report.complete).toBe(false);
    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SEARCH_RESULT_LIMIT_REACHED",
          metric: "prsOpened"
        })
      ])
    );
  });
});

describe("calculateSevenDayStreaks", () => {
  it("counts full seven-day runs from the longest consecutive contribution streak", () => {
    expect(
      calculateSevenDayStreaks([
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        "2026-01-05",
        "2026-01-06",
        "2026-01-07",
        "2026-01-08",
        "2026-01-09",
        "2026-01-10",
        "2026-01-11",
        "2026-01-12",
        "2026-01-13",
        "2026-01-14",
        "2026-01-16"
      ])
    ).toBe(2);
  });

  it("resets the run when contribution days are not consecutive", () => {
    expect(
      calculateSevenDayStreaks([
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-10",
        "2026-01-11",
        "2026-01-12"
      ])
    ).toBe(0);
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
