# Release Guide

This project releases a JavaScript GitHub Action. Consumers use either the moving major tag, such as `v1`, or an immutable version tag, such as `v1.0.0`.

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
9. Confirm the previous working prerelease remains available.

## Publishing `v1.0.0`

Create and push the immutable release tag from `main`:

```bash
git switch main
git pull --ff-only
npm run check:ci
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

Create the GitHub release from the same tag and use the `CHANGELOG.md` entry as the release notes.

Move the major tag only after `v1.0.0` exists and points at the verified commit:

```bash
git tag -fa v1 -m "v1"
git push origin v1 --force-with-lease
```

## Rollback

The previous working prerelease is `v1.0.0-beta.3`. If a stable release problem is found:

1. Tell users to pin `Fulforce/profilestats-rpg@v1.0.0-beta.3` or the exact known-good commit.
2. Move `v1` back to the last verified stable tag or leave it unchanged until a fixed release is published.
3. Publish a patch release, for example `v1.0.1`, once the fix passes release verification.

Immutable version tags must not be rewritten.
