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
});
