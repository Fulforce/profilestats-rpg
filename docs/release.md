# Release Guide

This project releases a JavaScript GitHub Action. Consumers use either the moving major tag, such as `v1`, or an immutable version tag, such as `v1.0.1`.

## Stable Release Checklist

Before publishing a stable release:

1. Sync `main` and verify the release commit is the intended commit.
2. Run `npm ci`.
3. Run `npm run check:ci`.
4. Confirm `git status --short` is clean.
5. Confirm `dist/` matches a clean `npm run build:action`.
6. Confirm the README setup examples use the intended release tag.
7. Confirm generated personal data is not committed under `data/` or `output/`.
8. Confirm `.github/profile-stats-rpg.yml` contains the safe `octocat` example profile.
9. Confirm GitHub Dependency graph is enabled so the Dependency Review workflow can run.
10. Identify the last known-good immutable release for rollback.

## Publishing A Stable Release

Choose the next semantic version, update `CHANGELOG.md`, then create and push the immutable tag from the verified `main` commit. Replace the example version below before running it:

```bash
VERSION=v1.0.2
git switch main
git pull --ff-only
npm run check:ci
git tag -a "$VERSION" -m "$VERSION"
git push origin "$VERSION"
```

Create the GitHub release from the same tag and use the `CHANGELOG.md` entry as the release notes.

Move the compatible major tag only after the immutable release exists and its release checks pass:

```bash
git tag -fa v1 -m "v1"
git push origin v1 --force-with-lease
```

## Rollback

If a stable release problem is found:

1. Tell users to pin the last known-good immutable stable tag or exact commit.
2. Move `v1` back to that verified commit, or leave it unchanged if the faulty release was not promoted.
3. Publish a new patch release once the fix passes the full release checklist.

Immutable version tags must not be rewritten.
