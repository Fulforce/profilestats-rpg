# GitHub Profile Stats RPG

Turn public GitHub activity into a static RPG journey card for a profile README.

The engine collects public activity, awards explainable XP, advances a character through a themed route, unlocks journey achievements, and writes versioned history plus a profile-ready SVG. The default bundled theme is `middle-earth`.

The bundled Middle-earth theme is an unofficial fan work. It is not endorsed by, sponsored by, or affiliated with the Tolkien Estate, Middle-earth Enterprises, Embracer Group, Warner Bros., or any other rights holder.

## Install In An Existing Profile Repository

Add `.github/profile-stats-rpg.yml` to your profile repository using the configuration below, then add `.github/workflows/update-profile-rpg.yml`:

```yaml
name: Update Profile RPG

on:
  workflow_dispatch:
  # Enable only after a successful manual run.
  # schedule:
  #   - cron: "17 5 * * *"

permissions:
  contents: write

concurrency:
  group: profile-stats-rpg-${{ github.repository }}
  cancel-in-progress: false

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: Fulforce/profilestats-rpg@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          commit-changes: true
```

Run the workflow manually before enabling its schedule. The Action stores the generated SVG and journey JSON in your repository; this project operates no hosted database or service.

`commit-changes` defaults to `false`. The example opts in because a profile repository normally wants the generated files committed. With it disabled, `contents: read` is sufficient and the workflow can handle generated files itself. Protected branches should use generation-only mode and a separate pull-request workflow because the Action never bypasses branch protection.

For reproducible or security-sensitive installations, replace `@v1` with an immutable release tag or full commit SHA.

## Fork Setup

1. Fork this repository. Fork mode runs the same packaged Action and generation engine as existing-repository installations.
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

`middle-earth` is the default bundled theme. Its licensing, provenance, and fan-work notice are documented in [themes/middle-earth/LICENSE.md](themes/middle-earth/LICENSE.md).

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

## Action Contract

The JavaScript Action accepts `github-token`, `config-path`, `commit-changes`, and `allow-abandon`. Gameplay settings remain in `.github/profile-stats-rpg.yml`. It exposes `changed`, `svg-path`, `journey-status`, and `progress-percent` outputs.

The checked-in `dist/` bundle is the executable release artifact. Contributors rebuild it with `npm run build:action`; CI verifies that it matches the TypeScript Action source.

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

Select a bundled theme by setting `theme.id` in `.github/profile-stats-rpg.yml`. This works the same way in fork mode and reusable Action mode:

```yaml
theme:
  id: "middle-earth"
```

Version 1 supports bundled themes only. Remote Git themes, npm theme packages, registries, hosted previews, and network execution are not supported.

Theme contributors can start from the copyable template and checklist in [Theme Contributions](docs/theme-contributions.md).

See the [specification index](specs/README.md), [renderer guide](docs/renderer.md), [architecture](docs/architecture.md), and [contribution guide](CONTRIBUTING.md) for more detail.
