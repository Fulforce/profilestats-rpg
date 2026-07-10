import { mkdtemp, readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import type { DisplayConfig } from "../src/config/types.js";
import { buildRenderViewModel } from "../src/svg/render-view-model.js";
import { renderJourneySvg } from "../src/svg/svg-renderer.js";
import { validateGeneratedSvg } from "../src/svg/svg-validator.js";
import { writeJourneySvg } from "../src/svg/svg-writer.js";
import { loadTheme } from "../src/theme/theme-loader.js";
import {
  activeRenderState,
  completedRenderState,
  longTextRenderState,
  partialRenderState,
  zeroRenderState
} from "./fixtures/render-states.js";

const standard: DisplayConfig = {
  layout: "standard",
  showStats: true,
  showTitle: true,
  showAchievements: true
};

describe("renderJourneySvg", () => {
  it("renders the standard information hierarchy from the shared view model", async () => {
    const theme = await loadTheme("middle-earth");
    const view = buildRenderViewModel(activeRenderState(), theme, standard);
    const svg = renderJourneySvg({ view });

    expect(svg).toContain('width="1200" height="420" viewBox="0 0 1200 420"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('font-family="DejaVu Sans, sans-serif"');
    expect(svg).toContain("octocat");
    expect(svg).toContain("Adventurer");
    expect(svg).toContain("16,500 / 50,000 XP");
    expect(svg).toContain("33%");
    expect(svg).toContain("Lothlorien");
    expect(svg).toContain("Amon Hen");
    expect(svg).toContain("PRs merged");
    expect(svg).toContain("42");
    expect(svg).toContain("+2,520 XP");
    expect(svg).toContain("psrpg-middle-earth-character-cloak");
    expect(svg).not.toContain('id="cloak"');
    expect(Buffer.byteLength(svg, "utf8")).toBeLessThan(250 * 1024);
    expect(() => validateGeneratedSvg(svg)).not.toThrow();
  });

  it("renders the fixed compact layout without the full route map", async () => {
    const theme = await loadTheme("middle-earth");
    const view = buildRenderViewModel(activeRenderState(), theme, {
      ...standard,
      layout: "compact"
    });
    const svg = renderJourneySvg({ view });

    expect(svg).toContain('width="495" height="195" viewBox="0 0 495 195"');
    expect(svg).not.toContain('data-region="journey-map"');
    expect(svg).toContain("33%");
    expect(svg).toContain("16.5k/50k XP");
    expect(svg).toContain("Lothlorien");
    expect(svg).toContain("Amon Hen");
  });

  it("renders zero, completed, partial, and long-text states", async () => {
    const theme = await loadTheme("middle-earth");
    const zero = renderJourneySvg({
      view: buildRenderViewModel(zeroRenderState(), theme, standard)
    });
    const completed = renderJourneySvg({
      view: buildRenderViewModel(completedRenderState(), theme, standard)
    });
    const partial = renderJourneySvg({
      view: buildRenderViewModel(partialRenderState(), theme, standard)
    });
    const long = renderJourneySvg({
      view: buildRenderViewModel(longTextRenderState(), theme, {
        ...standard,
        layout: "compact"
      })
    });

    expect(zero).toContain("No counted activity yet");
    expect(completed).toContain("Journey complete");
    expect(completed).toContain("Completed 2026-07-09");
    expect(completed).not.toContain('stroke-dasharray="8 7"');
    expect(completed).toMatch(/y="357"[^>]*>Mount Doom<\/text>/);
    expect(partial).toContain("Activity data incomplete");
    expect(partial).toContain("Commit totals may be lower than the public total.");
    expect(long).toContain("…");
    expect(long).toContain("octocat-with-a-very-long-but-valid-profile-name");
  });

  it("honors display switches and produces byte-identical output", async () => {
    const theme = await loadTheme("middle-earth");
    const view = buildRenderViewModel(activeRenderState(), theme, {
      layout: "standard",
      showStats: false,
      showTitle: false,
      showAchievements: false
    });
    const first = renderJourneySvg({ view });
    const second = renderJourneySvg({ view });

    expect(first).toBe(second);
    expect(first).not.toContain("TOP XP SOURCES");
    expect(first).not.toContain("Adventurer");
    expect(first).not.toContain("achievements</text>");
  });

  it("escapes hostile display strings", async () => {
    const theme = await loadTheme("middle-earth");
    const state = activeRenderState();
    state.profile.githubUser = 'octo<cat>&"';
    const svg = renderJourneySvg({ view: buildRenderViewModel(state, theme, standard) });

    expect(svg).toContain("octo&lt;cat&gt;&amp;&quot;");
    expect(svg).not.toContain("octo<cat>");
    expect(() => validateGeneratedSvg(svg)).not.toThrow();
  });
});

describe("writeJourneySvg", () => {
  it("validates and writes output/journey.svg", async () => {
    const theme = await loadTheme("middle-earth");
    const view = buildRenderViewModel(activeRenderState(), theme, standard);
    const outputDir = await mkdtemp(join(tmpdir(), "profilestats-rpg-svg-"));
    const outputPath = await writeJourneySvg(view, join(outputDir, "journey.svg"));

    expect(outputPath.endsWith("journey.svg")).toBe(true);
    await expect(readFile(outputPath, "utf8")).resolves.toContain("Middle-earth Journey");
  });
});
