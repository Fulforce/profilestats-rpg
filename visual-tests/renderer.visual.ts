import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import type { DisplayConfig } from "../src/config/types.js";
import type { StateDocument } from "../src/storage/types.js";
import { buildRenderViewModel } from "../src/svg/render-view-model.js";
import { renderJourneySvg } from "../src/svg/svg-renderer.js";
import { loadTheme } from "../src/theme/theme-loader.js";
import {
  buildBundledThemeActiveState,
  discoverBundledThemeIds
} from "../tests/helpers/bundled-themes.js";
import {
  activeRenderState,
  completedRenderState,
  longTextRenderState,
  partialRenderState,
  zeroRenderState
} from "../tests/fixtures/render-states.js";

const cases: Array<{
  name: string;
  state: () => StateDocument;
  layout: DisplayConfig["layout"];
}> = [
  { name: "standard-active", state: activeRenderState, layout: "standard" },
  { name: "compact-active", state: activeRenderState, layout: "compact" },
  { name: "standard-completed", state: completedRenderState, layout: "standard" },
  { name: "standard-zero", state: zeroRenderState, layout: "standard" },
  { name: "compact-partial", state: partialRenderState, layout: "compact" },
  { name: "compact-long-text", state: longTextRenderState, layout: "compact" }
];
const bundledThemeIds = discoverBundledThemeIds();

for (const fixture of cases) {
  test(`${fixture.name} is bounded, nonblank, and visually stable`, async ({ page }) => {
    await loadFixture(page, fixture.state(), fixture.layout);
    const svg = page.locator("body > svg");
    await expect(svg).toHaveScreenshot(`${fixture.name}.png`);
    await expectTextWithinBounds(page);
    await expectMapLabelsDoNotOverlap(page);
    expectNonblank(await svg.screenshot());
  });
}

for (const themeId of bundledThemeIds) {
  for (const layout of ["standard", "compact"] as const) {
    test(`${themeId} ${layout} active theme contract is bounded, nonblank, and visually stable`, async ({
      page
    }) => {
      const theme = await loadTheme(themeId);
      await loadFixture(page, buildBundledThemeActiveState(theme), layout, 1, themeId);
      const svg = page.locator("body > svg");
      await expect(svg).toHaveScreenshot(`${themeId}-${layout}-active-theme-contract.png`);
      await expectTextWithinBounds(page);
      await expectMapLabelsDoNotOverlap(page);
      expectNonblank(await svg.screenshot());
    });
  }
}

for (const layout of ["standard", "compact"] as const) {
  test(`${layout} remains stable when scaled`, async ({ page }) => {
    await loadFixture(page, activeRenderState(), layout, 0.65);
    const svg = page.locator("body > svg");
    await expect(svg).toHaveScreenshot(`${layout}-active-scaled.png`);
    await expectTextWithinBounds(page);
    expectNonblank(await svg.screenshot());
  });
}

async function loadFixture(
  page: Page,
  state: StateDocument,
  layout: DisplayConfig["layout"],
  scale = 1,
  themeId = "middle-earth"
): Promise<void> {
  const theme = await loadTheme(themeId);
  const view = buildRenderViewModel(state, theme, {
    layout,
    showStats: true,
    showTitle: true,
    showAchievements: true
  });
  const svg = renderJourneySvg({ view });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#202124}body>svg{display:block;width:${view.width * scale}px;height:${view.height * scale}px}</style>${svg}`
  );
}

async function expectTextWithinBounds(page: Page): Promise<void> {
  const svgBox = await page.locator("body > svg").boundingBox();
  expect(svgBox).not.toBeNull();
  const texts = page.locator("body > svg text");
  for (let index = 0; index < (await texts.count()); index += 1) {
    const box = await texts.nth(index).boundingBox();
    if (!box || !svgBox) continue;
    expect(box.x).toBeGreaterThanOrEqual(svgBox.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(svgBox.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(svgBox.x + svgBox.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(svgBox.y + svgBox.height + 1);
  }
}

async function expectMapLabelsDoNotOverlap(page: Page): Promise<void> {
  const labels = page.locator('[data-region="journey-map"] > text');
  const boxes = [];
  for (let index = 0; index < (await labels.count()); index += 1) {
    const box = await labels.nth(index).boundingBox();
    if (box) boxes.push(box);
  }
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left];
      const b = boxes[right];
      const overlaps =
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
      expect(overlaps).toBe(false);
    }
  }
}

function expectNonblank(buffer: Buffer): void {
  const png = PNG.sync.read(buffer);
  const colors = new Set<string>();
  for (let index = 0; index < png.data.length; index += 4) {
    if (png.data[index + 3] === 0) continue;
    colors.add(`${png.data[index]}:${png.data[index + 1]}:${png.data[index + 2]}`);
    if (colors.size > 8) break;
  }
  expect(colors.size).toBeGreaterThan(8);
}
