# Journey Specification

## Purpose

The journey engine maps awarded XP onto an ordered theme route and owns the lifecycle of one campaign.

## Identity And Lifecycle

Every journey has a user-chosen, repository-unique `journey.id` and one of these states:

```text
NEW -> ACTIVE -> COMPLETED
          |
          -> ABANDONED (explicit only)
```

`ABANDONED` is an archival reason, not a renderable active status. A journey becomes active after its first successful persisted run. It completes the first time awarded XP reaches `targetXP`.

Completion behavior:

- progress is clamped to 100%;
- XP is clamped to the target for map positioning but the final calculated XP remains in the XP breakdown;
- the final title, achievements, activity report, timestamps, and engine/theme versions are frozen;
- a `JOURNEY_COMPLETED` event is written once;
- the completed record is added to the archive in the same update;
- later scheduled runs render the frozen record without recollecting activity;
- only a new journey ID starts another campaign.

A new campaign recalculates public activity from its own `startDate`. XP, titles, and achievements do not carry forward. Completed records remain in the archive.

## Active Replacement

Changing to a new journey ID while the existing journey is active fails by default. With the explicit `allow-abandon` option, the current record is archived with reason `ABANDONED`, and the new campaign starts. This protects users from accidental ID edits.

Journey IDs may never be reused within one repository, including IDs in the completed or abandoned archive.

## Route Contract

A theme route contains at least two locations ordered by increasing `requiredXP`. The first location requires 0 XP and the final location corresponds to the theme target.

The configured target XP scales theme thresholds proportionally:

```text
effective location XP =
  round(theme location XP / theme target XP * configured target XP)
```

The first threshold remains 0 and the final threshold is forced to the configured target to avoid rounding drift.

## Progress Calculation

```text
progressPercent = clamp(awardedXP / targetXP * 100, 0, 100)
```

The current location is the highest location whose effective threshold is less than or equal to awarded XP. The next location is the following route entry and is absent at completion.

Segment progress is:

```text
(awardedXP - current threshold)
/
(next threshold - current threshold)
```

It is clamped to 0 through 1. Character position is interpolated between current and next map coordinates. At completion it equals the final location coordinates.

## Monotonic Progress

GitHub totals can decrease when public content is deleted or visibility changes. Within an active journey:

```text
awardedXP = max(previous awardedXP, current calculatedXP)
```

This prevents a character, title, or achievement from moving backwards. The current activity report and calculated XP are still stored so the difference remains explainable.

## Event Ordering

When one run crosses multiple thresholds, events are emitted in this order:

1. `JOURNEY_STARTED`, when applicable;
2. locations by ascending route threshold;
3. titles by ascending XP threshold;
4. achievements in theme file order;
5. `JOURNEY_COMPLETED`.

Events use the run timestamp and deterministic IDs. Re-runs must not duplicate events.

## Date Semantics

- configuration dates are UTC dates;
- collection includes activity from `startDateT00:00:00Z` through the run time;
- persisted timestamps are ISO 8601 UTC;
- daily snapshots are keyed by UTC date and journey ID;
- a future start date is invalid.

## Acceptance Criteria

- progress and route interpolation are deterministic;
- progress never decreases within a campaign;
- completion is frozen and idempotent;
- a completed journey remains visible until a new one is configured;
- new journeys recount from their own start date;
- accidental active-journey replacement is rejected;
- completed and abandoned IDs cannot be reused;
- crossing several thresholds emits every event exactly once.
