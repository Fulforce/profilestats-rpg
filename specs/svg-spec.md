# SVG Rendering Specification

## Purpose

The renderer turns validated stored state and a validated theme into static, profile-ready SVG. It performs no GitHub calls or progression calculations.

## Outputs

Version 1 supports two layouts:

| Layout     | Default size | Purpose                                                                                      |
| ---------- | -----------: | -------------------------------------------------------------------------------------------- |
| `standard` |   1200 x 420 | Full journey map, XP sources, progression, title, and achievement summary.                   |
| `compact`  |    495 x 195 | Dense profile stat card with current location and progress; detailed map labels are omitted. |

The configured layout writes to `output.svgPath`. Generating both layouts in one run remains deferred; version 1 requires exactly one selected layout.

The root SVG includes `viewBox`, explicit width and height, `role="img"`, a unique `<title>`, and a concise `<desc>`.

## Shared Information Hierarchy

Both layouts show:

- GitHub username;
- current title when enabled;
- awarded XP and target XP;
- progress percentage;
- current location;
- completed state or next destination;
- journey start date;
- last successful update date;
- achievement count when enabled.

Information appears once. Journey start, completion, location, and achievement count must not be duplicated in decorative badges or footer text.

## Standard Layout

The standard layout contains four regions:

1. **Header:** product/theme identity, username, title, and journey status.
2. **XP summary:** a compact ranked list of the highest contributing XP sources, including count and earned XP.
3. **Progress strip:** awarded XP, percentage, current location, next destination, and achievements.
4. **Journey map:** completed and remaining route, current character, and selected location labels.

The route must clearly distinguish reached, current, and future segments without relying on color alone. The current character is visually prominent. Labels use collision-aware placement and priority:

1. current location;
2. next destination;
3. start and final destinations;
4. theme-designated landmark labels that fit;
5. other labels omitted when they would overlap.

Empty map space should support useful statistics rather than duplicate quest prose.

## Compact Layout

The compact layout favors scanability:

- username and title at top left;
- up to five non-zero activity or XP source rows;
- circular or linear progress indicator at right;
- current location and next destination in the footer;
- no full route map or long descriptions.

The progress indicator has a textual percentage so meaning does not depend on the graphic. Long usernames, titles, and locations truncate with an ellipsis after preserving accessible full text in `<desc>`.

## Completion State

For a completed journey:

- progress is exactly 100%;
- the final location replaces next-destination messaging;
- the completion date is shown;
- future route styling is absent;
- the final frozen XP breakdown and achievements are rendered;
- subsequent runs produce byte-identical SVG when no display configuration or renderer version changes.

## Partial Data State

When `activity.complete` is false, the standard layout includes a small neutral data-warning indicator and accessible description. It must not imply failure or dominate the card. Compact layout includes the warning in `<desc>` and may use a small icon if space permits.

## Security And Compatibility

Generated SVG must:

- contain no script, event handler, animation, `foreignObject`, external URL, or remote font;
- inline only sanitized bundled theme assets;
- escape all profile, theme, title, location, and achievement text;
- namespace definitions and asset IDs;
- use system font stacks;
- remain readable on GitHub without CSS from the embedding page;
- stay below 1 MB, with a target below 250 KB;
- avoid unsupported SVG features where a broadly compatible alternative exists.

## Visual Quality

- text contrast meets WCAG AA where practical for static SVG;
- no text overlaps at supported dimensions;
- font sizes do not drop below 11 px in standard or 10 px in compact;
- controls are not relevant because SVG output is non-interactive;
- color is not the sole indicator of route state;
- layout geometry is deterministic and independent of host viewport width;
- output remains legible against both light and dark README backgrounds through its own background and border.

## Deterministic Serialization

Element order, attribute order, numeric precision, IDs, whitespace, and date formatting are stable. The renderer receives the render timestamp from stored state and never reads the clock. Equivalent inputs and renderer versions produce byte-identical output.

## Validation And Tests

Tests include:

- XML parsing and prohibited-element checks;
- snapshots for standard, compact, completed, zero-activity, long-text, and partial-data fixtures;
- assertions that required text is present exactly once;
- bounds checks for all text and map labels;
- visual regression screenshots at native and scaled sizes;
- canvas or pixel checks that each output is nonblank;
- file size checks;
- escaping tests for hostile display strings;
- GitHub-compatible rendering checks in Chromium.

## Acceptance Criteria

- standard and compact outputs are readable and non-overlapping;
- every required fact is visible or accessibly described;
- completed output is stable;
- partial data is disclosed;
- themes cannot inject active content;
- rendering is deterministic and below size limits;
- visual regression fixtures run in CI.
