# Contributing

Thanks for helping improve GitHub Profile Stats RPG.

## Development Setup

```bash
npm ci
npm run check
```

Use `npm start` for a local smoke test that does not write generated files.

Use `npm run update` only when you want to call GitHub and write generated output.

## Branches

Recommended branch names:

```text
feature/short-description
fix/short-description
theme/theme-name
docs/short-description
test/my-profile-run
```

Keep `main` generic and fork-friendly. Do not commit personal generated journey data to `main`.

## Generated Files

The following files are generated and ignored by default:

```text
data/state.json
data/journeys.json
data/daily-log.json
data/events.json
output/journey.svg
```

The update workflow uses `git add -f` so user forks can still commit generated files intentionally.

## Pull Requests

Before opening a PR:

```bash
npm run check
```

If you change SVG rendering, inspect a generated SVG before requesting review.

## Adding Themes

Themes live in `themes/` and should define:

```text
theme.json
map.json
titles.json
achievements.json
palette.json
assets/
```

Prefer theme data over engine changes whenever possible.
