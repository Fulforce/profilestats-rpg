# Contributing

Thanks for helping improve GitHub Profile Stats RPG. Keep changes focused, update the relevant specification or docs when behavior changes, and run the documented checks before opening a pull request.

## Development Setup

```bash
npm ci
npm run check
```

Use `npm start` for a local smoke test that does not write generated files.

Use `npm run update` only when you want to call GitHub and write generated output.

## Workflow

1. Use or create an issue for material behavior changes.
2. Branch from `main`.
3. Keep the pull request focused on one concern.
4. Update implementation, tests, docs, and specs together when the contract changes.
5. Run `npm run check`.
6. Run visual checks when rendering or theme output changes.
7. Open a pull request using the repository template.

Small documentation and typo fixes do not require a prior issue.

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

The update workflow uses `git add -f` so user forks can still commit generated files intentionally. Do not include generated personal data in pull requests to this repository.

## Pull Requests

Before opening a PR:

```bash
npm run check
```

If you change SVG rendering or theme output, run:

```bash
npm run test:visual
```

Use `npm run test:visual:update` only when the visual change is intentional, then rerun `npm run test:visual`. Include screenshots or generated SVG context in the PR when visuals change.

## Theme Contributions

Themes own route content, titles, achievements, palette, metadata, and licensed visual assets. They should not require engine changes.

For a complete copyable template, review checklist, versioning guidance, selection examples, and local commands, see [Theme Contributions](docs/theme-contributions.md).

Version 1 supports bundled themes only. Remote Git themes, npm theme packages, registries, hosted previews, and network execution are deferred and unsupported.
