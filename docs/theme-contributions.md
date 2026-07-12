# Theme Contributions

Bundled themes live in this repository under `themes/<theme-id>/`. Version 1 supports bundled themes only: remote Git repositories, npm theme packages, registries, hosted theme previews, and network execution are not supported.

The engine is theme-agnostic. A theme pull request should add or update theme data, assets, docs, and tests without changing core engine behavior.

## Start From The Template

Copy `docs/theme-template/example-theme` to `themes/<your-theme-id>`, then rename the manifest ID to match the directory name.

```bash
cp -R docs/theme-template/example-theme themes/my-theme
```

Theme IDs use lowercase kebab-case, for example `my-theme`.

Required structure:

```text
themes/<theme-id>/
├── theme.json
├── map.json
├── titles.json
├── achievements.json
├── palette.json
├── LICENSE.md
└── assets/
    └── character.svg
```

Only `assets/character.svg` is required for version 1. Optional asset folders are allowed, but every asset file must be a safe static SVG.

## Selection

Fork users and reusable Action users select bundled themes in `.github/profile-stats-rpg.yml`:

```yaml
theme:
  id: "my-theme"
```

Fork mode and reusable Action mode use the same packaged engine and bundled theme data. The consumer repository owns generated state and SVG output; this repository supplies the released theme files.

## Theme Versioning

`theme.json.version` follows semantic versioning.

- Patch: spelling fixes, metadata clarification, or non-material documentation updates.
- Minor: additive compatible content, such as optional descriptions or additional non-breaking achievements.
- Major: changed IDs, removed IDs, changed route thresholds, changed title thresholds, or material visual changes.

Completed journey records keep the theme version that created them. Avoid changing IDs or thresholds unless the change is intentional and documented.

## Review Checklist

- Directory name and `theme.json.id` match.
- All IDs are lowercase kebab-case and stable.
- `theme.json.schemaVersion` is `1`.
- `theme.json.startingTitleId` references a title with `requiredXP: 0`.
- `theme.json.defaultTargetXP`, `map.json.targetXP`, and the final route location threshold match.
- Route locations start at `requiredXP: 0`, strictly increase, and stay inside normalized `x: 0..1200`, `y: 0..360`.
- Titles start at `requiredXP: 0`, strictly increase, and do not exceed the map target.
- Achievement conditions use supported metrics and operators.
- Location achievements reference existing route locations.
- Palette contains all required keys and passes contrast checks.
- Text is plain display text, not markup.
- SVG assets contain no script, event handlers, animation, `foreignObject`, external URLs, raster data URLs, XML entities, or colliding IDs.
- Each asset is under 100 KB and combined theme assets are under 500 KB.
- `LICENSE.md` explains text and asset provenance clearly.
- Fan themes state that they are unofficial, non-endorsed, and unaffiliated with relevant rights holders.
- The PR contains no generated user journey data under `data/` or `output/`.

## Local Checks

Run the project checks before opening a PR:

```bash
npm run check
npm run test:visual
```

If your theme intentionally changes visual output, update screenshots and include before/after context in the PR:

```bash
npm run test:visual:update
npm run test:visual
```

CI also rebuilds the Action bundle with `npm run check:action`. Theme-only changes should not require editing `dist/`.

## Pull Request Scope

Keep a theme submission focused on one theme. Include:

- the complete theme directory;
- updated README or docs if the theme should be listed for users;
- standard and compact visual screenshots from the shared visual tests;
- licensing/provenance notes for every visual asset.

Do not include generated profile data, unrelated engine refactors, new runtime dependencies, or remote theme loading support.
