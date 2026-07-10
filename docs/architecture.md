# Architecture

The engine is a deterministic pipeline executed in the user's repository.

```text
Versioned configuration
  -> bundled theme
  -> campaign transition plan
  -> public GitHub activity report
  -> versioned XP breakdown
  -> scaled route and title thresholds
  -> journey achievements and lifecycle events
  -> versioned state and history documents
  -> shared render view model
  -> static SVG
  -> transactional artifact write
```

Completed journeys skip activity collection and render their frozen persisted record.

## Core Contracts

- `AppConfig` is the validated `schemaVersion: 1` user configuration.
- `ActivityReport` contains normalized counts, collection boundaries, and completeness warnings.
- `XPResult` contains rule-set provenance, source rows, calculated XP, and monotonic awarded XP.
- `JourneyRecord` contains the immutable campaign definition and current or frozen progression.
- `StateDocument` contains the current journey.
- `JourneyArchiveDocument` retains completed and explicitly abandoned journeys.
- `DailyLogDocument` keys snapshots by journey ID and UTC date.
- `EventDocument` retains deterministic lifecycle and unlock events.
- `RenderViewModel` is the renderer-owned projection of persisted campaign facts, display switches, and sanitized theme visuals used by both layouts.

## Campaign Boundary

A journey ID creates the boundary for XP, titles, achievements, snapshots, and events. Locked campaign fields cannot change under the same ID. A new campaign recounts activity from its own start date and does not inherit progression.

Awarded XP is monotonic within an active campaign. Completion freezes the record and archives it in the same update. Active replacement requires an explicit abandonment option.

## Theme Boundary

Themes own route locations, titles, achievements, palette, story text, and visual assets. The engine owns validation, scaling, calculations, lifecycle rules, storage, and rendering mechanics.

Theme-specific names and behavior must not be hardcoded in engine modules.

Bundled character SVGs are loaded before collection, constrained by size, parsed and sanitized, and assigned deterministic namespaced IDs. The renderer receives only sanitized asset content.

## Renderer Boundary

The standard and compact renderers share one view model and formatting primitives. Their dimensions are fixed by layout rather than caller-controlled geometry. The view model owns completion and partial-data semantics; layout functions only decide placement and visual emphasis.

Generated SVG is parsed and safety-checked in memory before it joins the artifact transaction. Chromium regression tests measure text and map bounds, compare native and scaled screenshots, and ensure each fixture produces nonblank pixels.

## Artifact Transaction

The update runner constructs all candidate JSON documents and the SVG before changing generated files. It stages every artifact, replaces the prior set, and rolls back committed replacements if a later write fails.

The default output is:

```text
data/state.json
data/journeys.json
data/daily-log.json
data/events.json
output/journey.svg
```

These artifacts are ignored in the host repository and force-added by the fork workflow after a successful update.
