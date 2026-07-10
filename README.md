# GitHub Profile Stats RPG

Turn public GitHub activity into a static RPG journey card for a profile README.

The engine collects public activity, awards explainable XP, advances a character through a themed route, unlocks journey achievements, and writes versioned history plus a profile-ready SVG. The default bundled theme is `middle-earth`.

## Setup

1. Fork this repository.
2. Edit [.github/profile-stats-rpg.yml](.github/profile-stats-rpg.yml):

```yaml
schemaVersion: 1

profile:
  githubUser: "YOUR_GITHUB_USERNAME"

theme:
  id: "middle-earth"

journey:
  id: "road-to-mordor-2026"
  startDate: "2026-01-01"
  targetXP: 50000
  xpMultiplier: 1.0

display:
  layout: "standard"
  showStats: true
  showTitle: true
  showAchievements: true

output:
  svgPath: "output/journey.svg"
  dataDirectory: "data"
```

3. Commit and push the configuration.
4. Open **Actions** on GitHub and enable workflows if prompted.
5. Run **Update Journey** manually.
6. Confirm that `output/journey.svg` and the versioned `data/` documents were committed.

Embed the result in a profile README:

```md
![GitHub RPG Journey](https://raw.githubusercontent.com/YOUR_USERNAME/github-profilestats-rpg/main/output/journey.svg)
```

## Scheduled Updates

Schedules are disabled in the host repository so a new fork cannot run against the example profile. After a successful manual run, uncomment the schedule in [.github/workflows/update-journey.yml](.github/workflows/update-journey.yml):

```yaml
schedule:
  - cron: "17 5 * * *"
```

Repository settings, branch protection, secrets, and Actions permissions do not copy from the host repository into a fork.

## Journey Lifecycle

`journey.id` permanently identifies one campaign. Its profile, theme, start date, target XP, and multiplier become locked after the first successful run.

Progress never moves backwards when public GitHub totals decrease. Once XP reaches the target, the journey is frozen at 100%, added to `data/journeys.json`, and rendered without recollecting activity.

To begin another journey after completion, choose a new, unused ID and start date. The new journey recounts activity from that date and starts with no inherited XP or achievements. Completed journey history remains unchanged.

Changing the ID while a journey is still active is rejected by default. To intentionally archive it as abandoned, configure the new journey, run **Update Journey** manually, and select `allow-abandon`. Locally, use:

```bash
ALLOW_ABANDON=true GITHUB_TOKEN=YOUR_TOKEN npm run update
```

Archived journey IDs cannot be reused.

## Configuration

- `profile.githubUser` selects the public GitHub account.
- `theme.id` selects a bundled directory under `themes/`.
- `journey.id` identifies this campaign permanently.
- `journey.startDate` is the earliest activity date counted.
- `journey.targetXP` controls journey length.
- `journey.xpMultiplier` controls progression speed.
- `display` selects rendering options.
- `output` selects repository-relative generated paths.

Unknown configuration keys and paths outside the repository are rejected.

The `standard` layout produces a 1200 by 420 journey card with a full route map. The `compact` layout produces a 495 by 195 profile card without the full map. Display switches control the XP source summary, current title, and achievement count in either layout.

## Generated Files

```text
data/state.json       current active or completed journey
data/journeys.json    completed and abandoned journey archive
data/daily-log.json   one snapshot per journey and UTC date
data/events.json      deduplicated journey lifecycle events
output/journey.svg    profile-ready static image
```

The JSON and SVG files are written as one transaction. A failed collection, calculation, validation, or render leaves the previous artifact set intact.

## Local Development

```bash
npm ci
npx playwright install --with-deps chromium
npm run check
npm start
```

`npm run check` covers typechecking, linting, and unit tests. Visual snapshot checks stay separate and are run with `npm run test:visual` in contributor CI.

Run the complete update pipeline with:

```bash
GITHUB_TOKEN=YOUR_TOKEN npm run update
```

The generated SVG contains no JavaScript, remote assets, custom fonts, or browser runtime dependency. Bundled character artwork is parsed, sanitized, namespaced, and inlined into the static output.

## Themes

Bundled themes live under `themes/` and contain route, title, achievement, palette, and asset data. The engine remains theme-agnostic; new theme content should not be hardcoded into core modules.

See the [specification index](specs/README.md), [renderer guide](docs/renderer.md), [architecture](docs/architecture.md), and [contribution guide](CONTRIBUTING.md) for more detail.
