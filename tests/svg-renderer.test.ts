import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { renderJourneySvg } from "../src/svg/svg-renderer.js";
import { writeJourneySvg } from "../src/svg/svg-writer.js";
import { loadTheme } from "../src/theme/theme-loader.js";
import type { StoredState } from "../src/storage/types.js";

const state: StoredState = {
  metadata: {
    theme: "middle-earth",
    githubUser: "octocat",
    journeyStartDate: "2026-01-01",
    targetXP: 50000,
    xpMultiplier: 1
  },
  lastUpdated: "2026-07-09",
  xp: 12450,
  title: "Adventurer",
  currentLocation: "Lothlorien",
  nextLocation: "Amon Hen",
  progressPercent: 52.4,
  characterX: 475,
  segmentProgressPercent: 48,
  achievementCount: 8,
  achievements: ["LEFT_SHIRE", "FIRST_PR_MERGED"],
  stats: {
    commits: 1204,
    prsOpened: 75,
    prsMerged: 42,
    issuesOpened: 28,
    issuesClosed: 41,
    reviewsSubmitted: 67,
    repositoriesCreated: 3,
    releasesPublished: 5,
    streaks: 12
  },
  activityReport: {
    counts: {
      commits: 1204,
      prsOpened: 75,
      prsMerged: 42,
      issuesOpened: 28,
      issuesClosed: 41,
      reviewsSubmitted: 67,
      repositoriesCreated: 3,
      releasesPublished: 5,
      streaks: 12
    },
    githubUser: "octocat",
    window: { from: "2026-01-01", to: "2026-07-09" },
    collectedAt: "2026-07-09T12:00:00.000Z",
    source: "github-public-api",
    complete: true,
    warnings: []
  },
  xpBreakdown: {
    ruleSetVersion: "1.0.0",
    sources: [],
    rawXP: 12450,
    multiplier: 1,
    calculatedXP: 12450,
    awardedXP: 12450
  }
};

describe("renderJourneySvg", () => {
  it("renders the primary journey information into a static SVG", async () => {
    const theme = await loadTheme("middle-earth");
    const svg = renderJourneySvg({ state, theme });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("Middle-earth Journey");
    expect(svg).toContain("octocat the Adventurer");
    expect(svg).toContain("12,450");
    expect(svg).toContain("52.4%");
    expect(svg).toContain("Lothlorien");
    expect(svg).toContain("Amon Hen");
    expect(svg).toContain("Achievements");
    expect(svg).toContain("Journey Started");
    expect(svg).toContain("XP Sources");
    expect(svg).toContain("Pull requests");
    expect(svg).toContain("+3,180 XP");
    expect(svg).toContain("Commits");
    expect(svg).toContain("+2,408 XP");
    expect(svg).toContain("Streaks");
    expect(svg).toContain("+2,400 XP");
    expect(svg).toContain("Rivendell");
    expect(svg).toContain("Dead Marshes");
    expect(svg).toContain("Shelob");
    expect(svg).toContain("Current character position");
    expect(svg).toContain('stroke-width="7"');
    expect(svg).not.toContain("<script");
  });

  it("escapes user-controlled text", async () => {
    const theme = await loadTheme("middle-earth");
    const svg = renderJourneySvg({
      state: {
        ...state,
        metadata: {
          ...state.metadata,
          githubUser: "octo<cat>&"
        }
      },
      theme
    });

    expect(svg).toContain("octo&lt;cat&gt;&amp;");
    expect(svg).not.toContain("octo<cat>&");
  });
});

describe("writeJourneySvg", () => {
  it("writes output/journey.svg", async () => {
    const theme = await loadTheme("middle-earth");
    const outputDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-svg-"));
    const outputPath = await writeJourneySvg(state, theme, join(outputDir, "journey.svg"));

    expect(outputPath.endsWith("journey.svg")).toBe(true);
    await expect(readFile(outputPath, "utf8")).resolves.toContain("Middle-earth Journey");
  });
});
