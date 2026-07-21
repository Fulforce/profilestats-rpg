# SVG Renderer

The renderer turns a persisted journey record, validated display configuration, and validated bundled theme into one static SVG. It does not read the clock, collect GitHub data, or recalculate progression.

## Layouts

Configure exactly one layout in `.github/profile-stats-rpg.yml`:

```yaml
display:
  layout: "standard"
  showStats: true
  showTitle: true
  showAchievements: true
```

- `standard` is a fixed 1200 by 420 card with the full information hierarchy and journey map.
- `compact` is a fixed 495 by 195 card with up to five XP rows, a textual progress indicator, and a location footer. It intentionally omits the full map.

The `showStats`, `showTitle`, and `showAchievements` switches apply to either layout. Long display strings are shortened visually with an ellipsis while the complete journey summary remains in the SVG `<desc>`.

## States

Active journeys show the current location, next destination, awarded and target XP, progress, start date, and last successful update. Completed journeys show exactly 100 percent, the final location and completion date, the frozen XP breakdown and achievement count, and no future-route treatment.

When collection is incomplete, the standard layout shows a neutral warning and both layouts disclose the warning in their accessible description. A partial collection is not presented as a failed journey update.

## Theme Assets

The renderer currently inlines the bundled theme's required `assets/character.svg`. Theme asset files are limited to 100 KB, parsed before rendering, restricted to static SVG elements and attributes, and rejected if they contain scripts, event handlers, animation, external references, entities, embedded data, or unsupported markup. IDs and local `url(#id)` references are namespaced before the asset enters the generated card.

The version-1 theme contract also covers licensing metadata, palette contrast, referential integrity, and contribution requirements. Theme data and assets are validated before rendering; contributor review covers provenance and visual quality.

## Output Validation

Before an SVG joins the transactional artifact write, it must be well-formed XML, contain no active or external content, and remain below 1 MB. Normal renderer output is targeted below 250 KB.

Serialization, element order, numeric precision, IDs, whitespace, and dates are deterministic. Equivalent persisted inputs, display configuration, theme, and renderer version produce byte-identical output.

## Visual Regression

Unit fixtures cover active, zero-activity, completed, partial-data, long-text, and hostile-string inputs. Playwright renders representative standard and compact cards in Chromium at native and scaled sizes, checks every text box against SVG bounds, checks journey-map labels for overlap, verifies nonblank pixels, and compares committed PNG baselines.

Install the browser once for local development and run the suite:

```bash
npx playwright install --with-deps chromium
npm run test:visual
```

Intentionally update baselines with `npm run test:visual:update`, then inspect every changed image before committing it.
