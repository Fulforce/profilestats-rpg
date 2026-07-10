import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./visual-tests",
  testMatch: "**/*.visual.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Chromium screenshots can exhibit GPU surface corruption when this suite runs in parallel.
  workers: 1,
  reporter: "line",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.001
    }
  },
  use: {
    browserName: "chromium",
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    launchOptions: {
      args: ["--disable-gpu"]
    }
  }
});
