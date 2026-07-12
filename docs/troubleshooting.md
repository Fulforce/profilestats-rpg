# Troubleshooting

## Workflow Does Not Commit Files

Check that the workflow grants write permissions and enables commit behavior:

```yaml
permissions:
  contents: write

with:
  commit-changes: true
```

Protected branches may reject direct pushes. In that case, use `commit-changes: false` and create a separate pull-request workflow for generated files.

## Character Does Not Move

Progress is based on public GitHub activity from `journey.startDate`. If totals do not change, the generated files may remain byte-identical and no commit is made.

Also check:

- the workflow ran for the expected `profile.githubUser`;
- `journey.startDate` is not in the future;
- `journey.targetXP` is realistic for the profile;
- the current journey has not already completed.

## Configuration Is Rejected

The configuration file must be `.github/profile-stats-rpg.yml` unless `config-path` is set. Unknown keys are rejected to catch misspellings.

Common fixes:

- use `schemaVersion: 1`;
- keep `theme.id` and `journey.id` lowercase kebab-case;
- use a real UTC date for `journey.startDate`;
- keep `output` paths relative and inside the repository.

## Activity Data Is Incomplete

GitHub API limitations can make a public activity collection incomplete. The generated SVG discloses this instead of pretending the data is exact.

Rerun the workflow later if GitHub search or API responses were temporarily incomplete.

## Visual Checks Fail Locally

Install Chromium before running visual tests:

```bash
npx playwright install --with-deps chromium
npm run test:visual
```

Only update snapshots with `npm run test:visual:update` when the visual change is intentional.

## Action Version Choice

Use `Fulforce/profilestats-rpg@v1` for normal compatible updates. For reproducible installations, pin an immutable tag such as `v1.0.0` or a full commit SHA.
