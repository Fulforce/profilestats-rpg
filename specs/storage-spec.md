# Storage Specification

## Purpose

Storage preserves active progression, completed journeys, daily history, and milestone events as version-controlled JSON. The user's repository is the database; no hosted persistence exists.

## Files

The default data directory contains:

```text
data/
├── state.json
├── journeys.json
├── daily-log.json
└── events.json
```

- `state.json` is the active or most recently completed journey used for rendering.
- `journeys.json` is the immutable archive of completed or explicitly abandoned journeys.
- `daily-log.json` contains one active-journey snapshot per UTC date.
- `events.json` contains deduplicated lifecycle and unlock events across journeys.

All files are generated artifacts and include `schemaVersion: 1` at their root.

## State Envelope

```ts
type StateDocument = {
  schemaVersion: 1;
  engineVersion: string;
  profile: { githubUser: string };
  current: ActiveJourneyRecord | CompletedJourneyRecord;
};
```

The current record also stores the theme ID and version, XP rule-set version, effective location thresholds, and display strings needed to render it if a historical theme definition later changes.

## Journey Archive

```ts
type JourneyArchiveDocument = {
  schemaVersion: 1;
  journeys: Array<
    | (CompletedJourneyRecord & { archiveReason: "COMPLETED" })
    | (ActiveJourneyRecord & {
        archiveReason: "ABANDONED";
        archivedAt: ISODateTime;
      })
  >;
};
```

Records are ordered by start time, then journey ID. A completed record is archived in the same transaction that persists completion and is immutable afterward. Explicitly replacing an active journey archives it once as abandoned. Starting a new journey never duplicates an existing archive entry.

## Daily Log

```ts
type DailyLogDocument = {
  schemaVersion: 1;
  snapshots: Array<{
    journeyId: string;
    date: ISODate;
    awardedXP: number;
    calculatedXP: number;
    progressPercent: number;
    locationId: string;
    titleId: string;
    achievementIds: string[];
    activityComplete: boolean;
  }>;
};
```

The compound key is `journeyId + date`. Re-running on the same UTC date replaces that entry while the journey is active. Completed journey snapshots are not changed. Entries are sorted by date and ID.

The first public release retains all daily snapshots. A future retention option may compact them, but it must not remove completed journey summaries or unlock events.

## Event Log

```ts
type EventDocument = {
  schemaVersion: 1;
  events: JourneyEvent[];
};
```

Event IDs are deterministic and unique. Writes merge by ID and sort by timestamp, event precedence, then ID. Existing events are never recreated with a different timestamp.

## Transactional Update

An update follows this order:

1. load and validate every existing document;
2. collect and calculate the complete next snapshot;
3. render and validate all requested SVG outputs in memory or temporary files;
4. serialize JSON with stable key and array ordering;
5. write temporary files in the destination directories;
6. atomically rename all validated outputs into place as far as the platform permits;
7. remove temporary files.

Collection, calculation, rendering, or validation failure must leave prior generated artifacts unchanged. JSON uses two-space indentation and one trailing newline.

## First Run And Recovery

- missing generated files initialize empty version-1 documents;
- an empty repository has no implied prior journey;
- malformed JSON or unsupported schema versions fail safely with a named file and recovery guidance;
- missing one file does not silently discard history from the others;
- `--rebuild-derived` may recreate state and SVG from valid canonical documents where possible;
- automatic reconstruction of lost GitHub history is not promised.

## Data Safety

Storage must never contain tokens, authorization headers, raw API payloads, repository source, email addresses obtained from commits, or private activity. User-controlled strings are validated on input and escaped again on output.

## Acceptance Criteria

- repeated runs are idempotent;
- a failed run preserves the prior file set;
- completed journeys and achievements survive new campaigns;
- events cannot duplicate;
- same-day active snapshots replace rather than append;
- serialization is stable across equivalent runs;
- no credentials or raw GitHub responses are persisted.
