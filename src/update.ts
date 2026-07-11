import { runUpdate } from "./update/update-runner.js";

const summary = await runUpdate({
  token: process.env.GITHUB_TOKEN,
  allowAbandon: process.env.ALLOW_ABANDON === "true"
});

console.log(
  JSON.stringify(
    {
      githubUser: summary.config.profile.githubUser,
      theme: summary.config.theme.id,
      journeyId: summary.snapshot.state.current.definition.id,
      status: summary.snapshot.state.current.progress.status,
      xp: summary.snapshot.state.current.progress.xp,
      title: summary.snapshot.state.current.titleName,
      currentLocation: summary.snapshot.state.current.progress.currentLocationId,
      progressPercent: summary.snapshot.state.current.progress.progressPercent,
      achievementCount: summary.snapshot.state.current.achievements.length,
      activityComplete: summary.snapshot.state.current.activity.complete,
      collectionWarnings: summary.snapshot.state.current.activity.warnings,
      eventCount: summary.snapshot.events.events.length,
      changed: summary.changedPaths.length > 0,
      changedPaths: summary.changedPaths
    },
    null,
    2
  )
);
