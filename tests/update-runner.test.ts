import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Activity, ActivityReport } from "../src/domain/types.js";
import { runUpdate } from "../src/update/update-runner.js";

const activity: Activity = {
  commits: 500,
  prsOpened: 10,
  prsMerged: 8,
  issuesOpened: 20,
  issuesClosed: 15,
  reviewsSubmitted: 12,
  repositoriesCreated: 2,
  releasesPublished: 1,
  streaks: 3
};

const emptyActivity: Activity = Object.fromEntries(
  Object.keys(activity).map((key) => [key, 0])
) as unknown as Activity;

describe("runUpdate", () => {
  it("writes the versioned campaign state and deterministic events", async () => {
    const fixture = await createRunFixture();
    const summary = await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => makeReport(activity, "2026-07-09T12:00:00.000Z")
    });

    const state = JSON.parse(await readFile(join(fixture.dataDir, "state.json"), "utf8")) as {
      current: { progress: { xp: number }; definition: { id: string } };
    };
    const svg = await readFile(join(fixture.outputDir, "journey.svg"), "utf8");

    expect(summary.snapshot.state.current).toMatchObject({
      definition: { id: "road-to-mordor-2026", xpRuleSetVersion: "1.0.0" },
      progress: { status: "ACTIVE", xp: 3000 },
      titleName: "Wanderer"
    });
    expect(state.current.progress.xp).toBe(3000);
    expect(summary.snapshot.dailyLog.snapshots).toHaveLength(1);
    expect(summary.snapshot.events.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "road-to-mordor-2026:JOURNEY_STARTED:road-to-mordor-2026",
          type: "JOURNEY_STARTED"
        }),
        expect.objectContaining({
          id: "road-to-mordor-2026:LOCATION_UNLOCKED:SHIRE",
          type: "LOCATION_UNLOCKED"
        }),
        expect.objectContaining({
          id: "road-to-mordor-2026:TITLE_UNLOCKED:WANDERER",
          type: "TITLE_UNLOCKED"
        })
      ])
    );
    expect(svg).toContain("Middle-earth Journey");
    expect(summary.artifactPaths).toHaveLength(5);
    expect(summary.changedPaths).toHaveLength(5);
  });

  it("reports no changes when an identical run is repeated", async () => {
    const fixture = await createRunFixture();
    const first = await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => makeReport(activity, "2026-07-09T12:00:00.000Z")
    });
    const repeated = await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T18:00:00Z"),
      activityProvider: async () => makeReport(activity, "2026-07-09T18:00:00.000Z")
    });

    expect(repeated.changedPaths).toEqual([]);
    expect(repeated.generatedEvents).toEqual([]);
    expect(repeated.snapshot.dailyLog.snapshots).toHaveLength(1);
    expect(repeated.snapshot.state.current.lastUpdated).toBe(
      first.snapshot.state.current.lastUpdated
    );
    expect(repeated.snapshot.state.current.activity.collectedAt).toBe(
      first.snapshot.state.current.activity.collectedAt
    );
  });

  it("keeps awarded XP monotonic and events deduplicated", async () => {
    const fixture = await createRunFixture();
    await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => makeReport(activity, "2026-07-09T12:00:00.000Z")
    });
    const second = await runUpdate({
      ...fixture,
      date: new Date("2026-07-10T12:00:00Z"),
      activityProvider: async () =>
        makeReport({ ...activity, commits: 0 }, "2026-07-10T12:00:00.000Z")
    });

    expect(second.snapshot.state.current.xp.calculatedXP).toBe(2000);
    expect(second.snapshot.state.current.xp.awardedXP).toBe(3000);
    expect(second.snapshot.state.current.progress.xp).toBe(3000);
    const eventIds = second.snapshot.events.events.map((event) => event.id);
    expect(new Set(eventIds).size).toBe(eventIds.length);
  });

  it("freezes and archives a completed journey without recollecting it", async () => {
    const fixture = await createRunFixture();
    let collectionCount = 0;
    const provider = async (): Promise<ActivityReport> => {
      collectionCount += 1;
      return makeReport({ ...activity, commits: 30000 }, "2026-07-09T12:00:00.000Z");
    };
    const first = await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: provider
    });
    const second = await runUpdate({
      ...fixture,
      date: new Date("2026-07-10T12:00:00Z"),
      activityProvider: provider
    });

    expect(collectionCount).toBe(1);
    expect(first.snapshot.state.current.progress.status).toBe("COMPLETED");
    expect(second.snapshot.state.current.lastUpdated).toBe("2026-07-09T12:00:00.000Z");
    expect(second.snapshot.journeys.journeys).toHaveLength(1);
    expect(second.generatedEvents).toEqual([]);
  });

  it("retains a completed journey when a new configured journey starts", async () => {
    const fixture = await createRunFixture();
    await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () =>
        makeReport({ ...activity, commits: 30000 }, "2026-07-09T12:00:00.000Z")
    });
    await writeConfig(fixture.configPath, "return-to-the-shire-2026", "2026-07-10");

    const next = await runUpdate({
      ...fixture,
      date: new Date("2026-07-10T12:00:00Z"),
      activityProvider: async () => makeReport(emptyActivity, "2026-07-10T12:00:00.000Z")
    });

    expect(next.snapshot.state.current.definition.id).toBe("return-to-the-shire-2026");
    expect(next.snapshot.state.current.progress.startedAt).toBe("2026-07-10");
    expect(next.snapshot.journeys.journeys.map((record) => record.definition.id)).toEqual([
      "road-to-mordor-2026"
    ]);
    expect(next.snapshot.state.current.achievements).toEqual([]);
    expect(next.snapshot.journeys.journeys[0].achievements.length).toBeGreaterThan(0);
  });

  it("requires explicit abandonment and prevents archived journey id reuse", async () => {
    const fixture = await createRunFixture();
    await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => makeReport(activity, "2026-07-09T12:00:00.000Z")
    });
    await writeConfig(fixture.configPath, "second-journey", "2026-07-10");

    await expect(
      runUpdate({
        ...fixture,
        date: new Date("2026-07-10T12:00:00Z"),
        activityProvider: async () => makeReport(emptyActivity, "2026-07-10T12:00:00.000Z")
      })
    ).rejects.toMatchObject({ code: "JOURNEY_ACTIVE" });

    const abandoned = await runUpdate({
      ...fixture,
      allowAbandon: true,
      date: new Date("2026-07-10T12:00:00Z"),
      activityProvider: async () => makeReport(emptyActivity, "2026-07-10T12:00:00.000Z")
    });
    expect(abandoned.snapshot.journeys.journeys[0]).toMatchObject({
      archiveReason: "ABANDONED",
      definition: { id: "road-to-mordor-2026" }
    });

    await writeConfig(fixture.configPath, "road-to-mordor-2026", "2026-01-01");
    await expect(
      runUpdate({
        ...fixture,
        allowAbandon: true,
        date: new Date("2026-07-11T12:00:00Z"),
        activityProvider: async () => makeReport(emptyActivity, "2026-07-11T12:00:00.000Z")
      })
    ).rejects.toMatchObject({ code: "JOURNEY_ID_REUSED" });
  });

  it("rejects locked configuration changes within an active journey", async () => {
    const fixture = await createRunFixture();
    await runUpdate({
      ...fixture,
      date: new Date("2026-07-09T12:00:00Z"),
      activityProvider: async () => makeReport(activity, "2026-07-09T12:00:00.000Z")
    });
    await writeConfig(fixture.configPath, "road-to-mordor-2026", "2026-01-01", 60000);

    await expect(
      runUpdate({
        ...fixture,
        date: new Date("2026-07-10T12:00:00Z"),
        activityProvider: async () => makeReport(activity, "2026-07-10T12:00:00.000Z")
      })
    ).rejects.toMatchObject({
      code: "JOURNEY_CONFIG_CHANGED",
      message: expect.stringContaining("journey.targetXP")
    });
  });
});

async function createRunFixture(): Promise<{
  configPath: string;
  dataDir: string;
  outputDir: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "profilestats-rpg-update-"));
  const configPath = join(root, "profile-stats-rpg.yml");
  await writeConfig(configPath, "road-to-mordor-2026", "2026-01-01");
  return {
    configPath,
    dataDir: join(root, "data"),
    outputDir: join(root, "output")
  };
}

async function writeConfig(
  path: string,
  journeyId: string,
  startDate: string,
  targetXP = 50000
): Promise<void> {
  await writeFile(
    path,
    `schemaVersion: 1
profile:
  githubUser: "octocat"
theme:
  id: "middle-earth"
journey:
  id: "${journeyId}"
  startDate: "${startDate}"
  targetXP: ${targetXP}
  xpMultiplier: 1
display:
  layout: "standard"
output:
  svgPath: "output/journey.svg"
  dataDirectory: "data"
`
  );
}

function makeReport(counts: Activity, collectedAt: string): ActivityReport {
  return {
    counts,
    githubUser: "octocat",
    window: { from: "2026-01-01", to: collectedAt.slice(0, 10) },
    collectedAt,
    source: "github-public-api",
    complete: true,
    warnings: []
  };
}
