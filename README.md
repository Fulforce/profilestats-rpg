# GitHub Profile Stats RPG

Turn GitHub contribution activity into a static RPG journey card for your profile README.

The engine reads your public GitHub activity, converts it into XP, moves your character through a theme route, unlocks titles and achievements, then writes:

```text
data/state.json
data/daily-log.json
data/events.json
output/journey.svg
```

The default MVP theme is `middle-earth`, a journey from The Shire to Mount Doom.

## Example Embed

After the workflow has generated `output/journey.svg`, add this to your GitHub profile README:

```md
![GitHub RPG Journey](https://raw.githubusercontent.com/YOUR_USERNAME/github-profilestats-rpg/main/output/journey.svg)
```

Replace `YOUR_USERNAME` and the branch name if needed.

## Setup

1. Fork this repository.
2. Edit [config.yml](config.yml):

```yaml
githubUser: "YOUR_GITHUB_USERNAME"
theme: "middle-earth"

journey:
  startDate: "2026-01-01"
  targetXP: 50000
  xpMultiplier: 1.0

display:
  showStats: true
  showTitle: true
  showAchievements: true
```

3. Commit and push your config change.
4. Open the repository on GitHub.
5. Go to **Actions**.
6. Enable workflows if GitHub asks.
7. Run **Update Journey** manually.
8. Commit output will be generated automatically by the workflow.

## Scheduled Updates

The default repository keeps scheduled updates disabled so forks do not accidentally run before they are configured.

To enable daily updates in your fork, edit [.github/workflows/update-journey.yml](.github/workflows/update-journey.yml) and uncomment:

```yaml
schedule:
  - cron: "17 5 * * *"
```

Commit and push that change after setting `githubUser` in [config.yml](config.yml).

## Fork Behavior

Repository settings such as branch protection rules are not part of the files copied into a fork.

When you fork this project, you get the code, themes, specs, and GitHub Actions workflow files. Your fork has its own repository settings, branch rules, secrets, and Actions permissions.

The workflow itself is copied, but scheduled runs are disabled by default until you uncomment the `schedule` block.

## Configuration

`githubUser` is the public GitHub account to analyze.

`theme` selects a folder inside `themes/`. The MVP currently ships with:

```text
themes/middle-earth
```

`journey.startDate` controls the earliest activity date counted.

`journey.targetXP` controls how much XP completes the journey.

`journey.xpMultiplier` changes progression speed without changing activity totals.

## Local Development

Install dependencies:

```bash
npm ci
```

Run checks:

```bash
npm run check
```

Smoke-test config, theme, XP, journey, title, and achievement calculation without writing generated files:

```bash
npm start
```

Run the full update pipeline:

```bash
GITHUB_TOKEN=YOUR_TOKEN npm run update
```

`npm run update` calls GitHub, writes `data/*.json`, and writes `output/journey.svg`.

## How It Works

```text
GitHub activity
↓
XP
↓
Journey progress
↓
Title and achievements
↓
Storage files
↓
SVG profile card
```

The generated SVG is static and does not require JavaScript, external assets, custom fonts, or a browser runtime.

## Generated Files

`data/state.json` contains the latest computed state.

`data/daily-log.json` stores one snapshot per calendar day.

`data/events.json` stores milestone events such as unlocked titles, locations, and achievements.

`output/journey.svg` is the profile-ready card.

## Themes

Themes live in `themes/` and define:

```text
theme.json
map.json
titles.json
achievements.json
palette.json
assets/
```

The engine is theme-agnostic. New routes, titles, achievements, colors, and assets should be added as theme data rather than hardcoded into the core engine.
