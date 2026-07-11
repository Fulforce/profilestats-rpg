import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

describe("reusable Action contract", () => {
  it("declares the documented JavaScript inputs and outputs", async () => {
    const metadata = parse(await readFile("action.yml", "utf8")) as {
      runs: { using: string; main: string };
      inputs: Record<string, { required?: boolean; default?: string }>;
      outputs: Record<string, { description: string }>;
    };

    expect(metadata.runs).toEqual({ using: "node24", main: "dist/index.js" });
    expect(metadata.inputs["github-token"].required).toBe(true);
    expect(metadata.inputs["config-path"].default).toBe(".github/profile-stats-rpg.yml");
    expect(metadata.inputs["commit-changes"].default).toBe("false");
    expect(metadata.inputs["allow-abandon"].default).toBe("false");
    expect(Object.keys(metadata.outputs)).toEqual([
      "changed",
      "svg-path",
      "journey-status",
      "progress-percent"
    ]);
  });

  it("ships the consumer fixture with safe concurrency and explicit commits", async () => {
    const workflow = await readFile(
      "tests/fixtures/consumer-repo/.github/workflows/update-profile-rpg.yml",
      "utf8"
    );
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).toContain("commit-changes: true");
    expect(workflow).toContain("uses: Fulforce/profilestats-rpg@v1.0.0-beta.1");
  });
});
