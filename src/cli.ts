import { calculateAchievementResult } from "./achievement/achievement-engine.js";
import { loadConfig } from "./config/config-loader.js";
import { calculateJourneyState } from "./journey/journey-engine.js";
import { scaleTitles } from "./journey/journey-lifecycle.js";
import { loadTheme } from "./theme/theme-loader.js";
import { calculateTitleResult } from "./title/title-engine.js";
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
const theme = await loadTheme(config.theme.id);
const xp = calculateXP(emptyActivity, config.journey.xpMultiplier);
const journey = calculateJourneyState(xp.awardedXP, theme.map, config.journey.targetXP);
const title = calculateTitleResult(
  xp.awardedXP,
  scaleTitles(theme.titles, theme.map.targetXP, config.journey.targetXP)
);
const achievements = calculateAchievementResult(theme.achievements, {
  xp: xp.awardedXP,
  activity: emptyActivity,
  journey
});

console.log(
  JSON.stringify(
    {
      githubUser: config.profile.githubUser,
      theme: theme.manifest.name,
      journey: config.journey,
      routeLocations: theme.map.locations.length,
      xp,
      title,
      achievements,
      state: journey
    },
    null,
    2
  )
);
