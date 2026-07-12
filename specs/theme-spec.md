# Theme Specification

## Purpose

A theme supplies the story and visual identity applied by the generic engine. Middle-earth remains the default bundled theme. New bundled themes are added under `themes/` through pull requests.

The engine must not contain theme-specific location names, character names, titles, achievement wording, colors, or route logic.

## Distribution Scope

The first public release supports bundled themes only:

```text
themes/<theme-id>/
```

“Bundled” means the directory is part of a released version of this repository and is selected using `theme.id`. Fork users and reusable-Action users receive the same released themes.

Installing themes directly from another Git repository is a possible future extension. The first public release does not implement remote theme loading, npm theme packages, a registry, or network execution of theme code.

## Directory Contract

```text
themes/<theme-id>/
├── theme.json
├── map.json
├── titles.json
├── achievements.json
├── palette.json
├── LICENSE.md
└── assets/
    ├── character.svg
    ├── markers/
    └── backgrounds/
```

Only `character.svg` is a required visual asset in the first public release. Other asset folders are optional. Asset references must stay inside the theme directory.

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "middle-earth",
  "name": "Middle-earth",
  "version": "1.0.0",
  "author": "Project contributors",
  "description": "A journey from the Shire to Mount Doom.",
  "defaultTargetXP": 50000,
  "startingTitleId": "shire-dweller"
}
```

- directory name and manifest ID must match;
- theme version follows semantic versioning;
- manifest and data schema versions are separate concepts;
- changing route thresholds, titles, achievements, or material visuals requires an appropriate theme version change;
- completed journey records retain the theme version used to create them.

## Map

```json
{
  "targetXP": 50000,
  "locations": [
    {
      "id": "the-shire",
      "name": "The Shire",
      "requiredXP": 0,
      "x": 80,
      "y": 210,
      "description": "The journey begins."
    }
  ]
}
```

Routes contain at least two locations. IDs are unique, thresholds strictly increase from 0 to `targetXP`, and coordinates lie inside the theme's normalized 1200 by 360 map space. Names and descriptions are display text, not markup.

The renderer scales normalized coordinates into each layout. Themes do not provide renderer code.

## Titles And Achievements

`titles.json` and `achievements.json` contain arrays matching their dedicated specifications. All location references must resolve within the same theme. The manifest's starting title must exist and require 0 XP.

## Palette

```json
{
  "background": "#121212",
  "surface": "#1d1d1d",
  "primary": "#65e68a",
  "secondary": "#d2d5d8",
  "accent": "#e7c66b",
  "text": "#f5f5f5",
  "mutedText": "#a7a7a7",
  "route": "#7d8388",
  "routeComplete": "#65e68a"
}
```

Colors must use six-digit hexadecimal form. Required foreground/background combinations must meet WCAG AA contrast for normal text. The validator reports the failing pair.

## SVG Asset Safety

Theme assets may use static SVG elements and paths. They must not contain:

- scripts, event handlers, or `foreignObject`;
- external URLs, remote fonts, or network references;
- embedded raster data URLs;
- animation elements;
- unsafe XML declarations or entities;
- IDs that can collide when inlined without namespacing.

The loader parses and sanitizes assets before rendering. Files have a documented size limit; the first public release defaults to 100 KB per asset and 500 KB per theme.

## Licensing And Attribution

Every theme includes `LICENSE.md` identifying the license and provenance of its text and assets. Contributors must have the right to submit all included material.

The default Middle-earth theme must clearly state that it is an unofficial fan work and is not endorsed by the relevant rights holders. The project must not imply official affiliation. Maintainers may remove disputed assets or wording.

## Loading And Validation

Theme loading is local, deterministic, and side-effect free after file reads. Validation accumulates all issues and reports file paths and fields. It verifies required files, schema versions, referential integrity, ordering, thresholds, contrast, asset safety, licensing presence, and supported sizes.

All bundled themes must use schema version 1. There is no legacy pre-v1 theme compatibility path in the public contract.

## Compatibility

- additive optional fields require a minor theme version;
- changed meaning, removed IDs, or altered thresholds require a major theme version;
- a release must run contract tests against every bundled theme;
- a historical journey renders from persisted display values when its exact old theme is no longer bundled.

## Acceptance Criteria

- adding a valid bundled theme requires no core engine change;
- invalid references and unsafe assets fail before collection begins;
- fork and Action modes resolve identical theme versions;
- theme text is escaped by renderers;
- completed journeys remain renderable after theme evolution;
- every bundled theme declares licensing and passes validation.
