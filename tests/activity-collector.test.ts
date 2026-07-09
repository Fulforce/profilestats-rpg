import { describe, expect, it } from "vitest";
import { calculateSevenDayStreaks, collectActivity } from "../src/github/activity-collector.js";

describe("collectActivity", () => {
  it("collects normalized activity from mocked GitHub responses", async () => {
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = String(input);

      if (url === "https://api.github.com/graphql") {
        const body = JSON.parse(String(init?.body)) as {
          variables: { login?: string; query?: string };
        };

        if (body.variables.login === "octocat") {
          return jsonResponse({
            data: {
              user: {
                contributionsCollection: {
                  totalCommitContributions: 42,
                  contributionCalendar: {
                    weeks: [
                      {
                        contributionDays: [
                          { date: "2026-01-01", contributionCount: 1 },
                          { date: "2026-01-02", contributionCount: 1 },
                          { date: "2026-01-03", contributionCount: 1 },
                          { date: "2026-01-04", contributionCount: 1 },
                          { date: "2026-01-05", contributionCount: 1 },
                          { date: "2026-01-06", contributionCount: 1 },
                          { date: "2026-01-07", contributionCount: 1 }
                        ]
                      }
                    ]
                  }
                }
              }
            }
          });
        }

        const query = body.variables.query ?? "";
        const count = query.includes("type:pr created")
          ? 5
          : query.includes("type:pr merged")
            ? 3
            : query.includes("type:issue created")
              ? 8
              : query.includes("type:issue closed")
                ? 4
                : query.includes("reviewed-by:octocat")
                  ? 6
                  : query.includes("type:release")
                    ? 2
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
        return jsonResponse([
          { created_at: "2026-02-01T00:00:00Z" },
          { created_at: "2025-12-31T23:59:59Z" },
          { created_at: "2026-03-01T00:00:00Z" }
        ]);
      }

      return jsonResponse({ message: "not found" }, 404);
    };

    await expect(
      collectActivity({
        githubUser: "octocat",
        startDate: "2026-01-01",
        fetchImpl
      })
    ).resolves.toEqual({
      commits: 42,
      prsOpened: 5,
      prsMerged: 3,
      issuesOpened: 8,
      issuesClosed: 4,
      reviewsSubmitted: 6,
      repositoriesCreated: 2,
      releasesPublished: 2,
      streaks: 1
    });
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
