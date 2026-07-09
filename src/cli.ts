import { loadConfig } from "./config/config-loader.js";
import { loadTheme } from "./theme/theme-loader.js";
import { calculateXP } from "./xp/xp-engine.js";
import type { Activity } from "./domain/types.js";

const emptyActivity: Activity = {
  commits: 0,
  prsOpened: 0,
  prsMerged: 0,
  issuesOpened: 0,
  issuesClosed: 0,
  reviewsSubmitted: 0,
  repositoriesCreated: 0,
  releasesPublished: 0,
  streaks: 0
};

const config = await loadConfig();
const theme = await loadTheme(config.theme);
const xp = calculateXP(emptyActivity, config.journey.xpMultiplier);

console.log(
  JSON.stringify(
    {
      githubUser: config.githubUser,
      theme: theme.manifest.name,
      journey: config.journey,
      routeLocations: theme.map.locations.length,
      xp
    },
    null,
    2
  )
);
