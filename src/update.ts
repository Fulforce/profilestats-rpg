import { runUpdate } from "./update/update-runner.js";

const summary = await runUpdate({
  token: process.env.GITHUB_TOKEN
});

console.log(
  JSON.stringify(
    {
      githubUser: summary.config.githubUser,
      theme: summary.config.theme,
      xp: summary.snapshot.state.xp,
      title: summary.snapshot.state.title,
      currentLocation: summary.snapshot.state.currentLocation,
      progressPercent: summary.snapshot.state.progressPercent,
      achievementCount: summary.snapshot.state.achievementCount,
      activityComplete: summary.snapshot.state.activityReport.complete,
      collectionWarnings: summary.snapshot.state.activityReport.warnings,
      eventCount: summary.snapshot.events.length
    },
    null,
    2
  )
);
