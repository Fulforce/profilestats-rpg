import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveActionRoot } from "../src/action/action-root.js";
import { buildRenderViewModel } from "../src/svg/render-view-model.js";
import { renderJourneySvg } from "../src/svg/svg-renderer.js";
import { validateGeneratedSvg } from "../src/svg/svg-validator.js";
import { loadTheme } from "../src/theme/theme-loader.js";
import {
  buildBundledThemeActiveState,
  discoverBundledThemeIds
} from "./helpers/bundled-themes.js";

const themeIds = discoverBundledThemeIds();

describe("bundled theme contract", () => {
  it("discovers bundled themes from the themes directory", () => {
    expect(themeIds).toContain("middle-earth");
  });

  it.each(themeIds)("%s loads with a complete schema-version-1 contract", async (themeId) => {
    const theme = await loadTheme(themeId);
    const license = await readFile(join("themes", themeId, "LICENSE.md"), "utf8");

    expect(theme.manifest).toMatchObject({
      schemaVersion: 1,
      id: themeId
    });
    expect(theme.manifest.startingTitle).toBe(theme.titles[0].id);
    expect(theme.titles[0].requiredXP).toBe(0);
    expect(theme.map.locations[0].requiredXP).toBe(0);
    expect(theme.map.locations.at(-1)?.requiredXP).toBe(theme.map.targetXP);
    expect(license.trim()).not.toBe("");
    const svg = await renderStandard(themeId);
    expect(() => validateGeneratedSvg(svg)).not.toThrow();
  });

  it.each(themeIds)("%s renders representative standard and compact layouts", async (themeId) => {
    const theme = await loadTheme(themeId);
    const state = buildBundledThemeActiveState(theme);

    for (const layout of ["standard", "compact"] as const) {
      const view = buildRenderViewModel(state, theme, {
        layout,
        showStats: true,
        showTitle: true,
        showAchievements: true
      });
      const svg = renderJourneySvg({ view });

      expect(svg).toContain(`width="${view.width}" height="${view.height}"`);
      expect(svg).toContain('role="img"');
      expect(svg).toContain(theme.manifest.name);
      expect(Buffer.byteLength(svg, "utf8")).toBeLessThan(250 * 1024);
      expect(() => validateGeneratedSvg(svg)).not.toThrow();
    }
  });

  it.each(themeIds)(
    "%s resolves identically through the local fork path and packaged Action path",
    async (themeId) => {
      const localTheme = await loadTheme(themeId);
      const actionRoot = resolveActionRoot(pathToFileURL(resolve("dist/index.js")).href);
      const actionTheme = await loadTheme(themeId, join(actionRoot, "themes"));

      expect(actionTheme.manifest).toEqual(localTheme.manifest);
      expect(actionTheme.map).toEqual(localTheme.map);
      expect(actionTheme.titles).toEqual(localTheme.titles);
      expect(actionTheme.achievements).toEqual(localTheme.achievements);
      expect(actionTheme.palette).toEqual(localTheme.palette);
      expect(actionTheme.assets.character.viewBox).toBe(localTheme.assets.character.viewBox);
      expect(actionTheme.assets.character.content).toBe(localTheme.assets.character.content);
    }
  );
});

async function renderStandard(themeId: string): Promise<string> {
  const theme = await loadTheme(themeId);
  const state = buildBundledThemeActiveState(theme);
  const view = buildRenderViewModel(state, theme, {
    layout: "standard",
    showStats: true,
    showTitle: true,
    showAchievements: true
  });
  return renderJourneySvg({ view });
}
