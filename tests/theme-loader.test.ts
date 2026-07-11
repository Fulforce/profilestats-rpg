import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadTheme } from "../src/theme/theme-loader.js";

describe("loadTheme", () => {
  it("loads and normalizes the Middle-earth theme", async () => {
    const theme = await loadTheme("middle-earth");

    expect(theme.manifest.id).toBe("middle-earth");
    expect(theme.manifest.startingTitle).toBe("HOBBIT");
    expect(theme.map.locations).toHaveLength(14);
    expect(theme.map.locations[0]).toMatchObject({
      id: "SHIRE",
      requiredXP: 0
    });
    expect(theme.map.locations.at(-1)).toMatchObject({
      id: "MOUNT_DOOM",
      requiredXP: 50000
    });
    expect(theme.titles.map((title) => title.id)).toContain("LEGEND_OF_MIDDLE_EARTH");
    expect(theme.achievements.map((achievement) => achievement.id)).toContain("FIRST_PR_MERGED");
    expect(theme.palette.background).toBe("#F7F0D8");
    expect(theme.assets.character.viewBox).toBe("0 0 80 100");
    expect(theme.assets.character.content).toContain("psrpg-middle-earth-character-cloak");
  });

  it("rejects theme paths outside the configured root", async () => {
    await expect(loadTheme("../middle-earth")).rejects.toMatchObject({
      code: "THEME_INVALID"
    });
  });

  it("loads a valid v1 theme with licensed, safe local assets", async () => {
    const root = await createV1ThemeFixture();
    const theme = await loadTheme("test-theme", root);

    expect(theme.manifest).toMatchObject({
      schemaVersion: 1,
      id: "test-theme",
      startingTitle: "newcomer"
    });
    expect(theme.achievements[0].condition).toEqual({ type: "location", value: "finish" });
    expect(theme.palette.secondary).toBe("#595959");
    expect(theme.map.locations[0].y).toBe(180);
  });

  it("accumulates missing license, hostile asset, and unsupported asset issues", async () => {
    const root = await createV1ThemeFixture({ license: false });
    const themePath = join(root, "test-theme");
    await writeFile(join(themePath, "assets", "character.svg"), "<svg><script/></svg>");
    await writeFile(join(themePath, "assets", "photo.png"), "not an svg");

    await expect(loadTheme("test-theme", root)).rejects.toMatchObject({
      code: "THEME_INVALID",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "LICENSE.md" }),
        expect.objectContaining({ path: "assets/character.svg" }),
        expect.objectContaining({ path: "assets/photo.png" })
      ])
    });
  });

  it("enforces per-asset and combined theme asset size limits", async () => {
    const root = await createV1ThemeFixture();
    const assets = join(root, "test-theme", "assets");
    await writeFile(join(assets, "character.svg"), `<svg>${" ".repeat(103000)}</svg>`);
    for (let index = 0; index < 5; index += 1) {
      await writeFile(join(assets, `extra-${index}.svg`), `<svg>${" ".repeat(90000)}</svg>`);
    }

    await expect(loadTheme("test-theme", root)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "assets/character.svg" }),
        expect.objectContaining({ path: "assets" })
      ])
    });
  });

  it("accumulates missing required files before failing", async () => {
    const root = await mkdtemp(join(tmpdir(), "profilestats-rpg-theme-missing-"));
    const theme = join(root, "test-theme");
    await mkdir(theme, { recursive: true });
    await writeJson(join(theme, "theme.json"), {
      schemaVersion: 1,
      id: "test-theme"
    });

    await expect(loadTheme("test-theme", root)).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: "map.json" }),
        expect.objectContaining({ path: "titles.json" }),
        expect.objectContaining({ path: "achievements.json" }),
        expect.objectContaining({ path: "palette.json" }),
        expect.objectContaining({ path: "LICENSE.md" }),
        expect.objectContaining({ path: "assets" })
      ])
    });
  });
});

async function createV1ThemeFixture(options: { license?: boolean } = {}): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "profilestats-rpg-theme-v1-"));
  const theme = join(root, "test-theme");
  await mkdir(join(theme, "assets"), { recursive: true });
  await Promise.all([
    writeJson(join(theme, "theme.json"), {
      schemaVersion: 1,
      id: "test-theme",
      name: "Test Theme",
      version: "1.0.0",
      author: "Theme Author",
      description: "A loader fixture.",
      defaultTargetXP: 1000,
      startingTitleId: "newcomer"
    }),
    writeJson(join(theme, "map.json"), {
      targetXP: 1000,
      locations: [
        { id: "start", name: "Start", requiredXP: 0, x: 0, y: 180 },
        { id: "finish", name: "Finish", requiredXP: 1000, x: 1200, y: 180 }
      ]
    }),
    writeJson(join(theme, "titles.json"), [
      { id: "newcomer", name: "Newcomer", requiredXP: 0 },
      { id: "finisher", name: "Finisher", requiredXP: 1000 }
    ]),
    writeJson(join(theme, "achievements.json"), [
      {
        id: "reach-finish",
        name: "Reached the Finish",
        description: "Complete the route.",
        category: "JOURNEY",
        condition: { metric: "location", operator: "reached", value: "finish" }
      }
    ]),
    writeJson(join(theme, "palette.json"), {
      background: "#FFFFFF",
      surface: "#F5F5F5",
      primary: "#006400",
      secondary: "#5A3A20",
      accent: "#8B4513",
      text: "#111111",
      mutedText: "#595959",
      route: "#666666",
      routeComplete: "#006400"
    }),
    writeFile(
      join(theme, "assets", "character.svg"),
      '<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/></svg>'
    )
  ]);
  if (options.license !== false) {
    await writeFile(join(theme, "LICENSE.md"), "Fixture assets are available under MIT.\n");
  }
  return root;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
