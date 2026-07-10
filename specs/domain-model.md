# Domain Model

This document is the canonical vocabulary for the engine. Other specifications may add validation rules but must not redefine these concepts.

## Version Types

```ts
type SchemaVersion = 1;
type ISODate = string; // YYYY-MM-DD in UTC
type ISODateTime = string; // ISO 8601 UTC timestamp
type JourneyStatus = "ACTIVE" | "COMPLETED";
type SvgLayout = "standard" | "compact";
```

Persisted documents include `schemaVersion`. Calculations also record the engine, theme, and XP rule-set versions that produced them.

## Activity

```ts
type ActivityCounts = {
  commits: number;
  prsOpened: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number;
  reviewsSubmitted: number;
  repositoriesCreated: number;
  releasesPublished: number;
  streaks: number;
};

type CollectionWarning = {
  code: string;
  metric?: keyof ActivityCounts;
  message: string;
};

type ActivityReport = {
  counts: ActivityCounts;
  githubUser: string;
  window: { from: ISODate; to: ISODate };
  collectedAt: ISODateTime;
  source: "github-public-api";
  complete: boolean;
  warnings: CollectionWarning[];
};
```

Counts are non-negative integers. `complete` is false whenever a known API cap, inaccessible source, or partial request affects the result.

## XP

```ts
type XPSource = {
  metric: keyof ActivityCounts;
  count: number;
  unitXP: number;
  earnedXP: number;
};

type XPResult = {
  ruleSetVersion: string;
  sources: XPSource[];
  rawXP: number;
  multiplier: number;
  calculatedXP: number;
  awardedXP: number;
};
```

`calculatedXP` is the current calculation. `awardedXP` is monotonic within one journey and is the value used for progression.

## Journey

```ts
type JourneyDefinition = {
  id: string;
  startDate: ISODate;
  targetXP: number;
  xpMultiplier: number;
  themeId: string;
};

type JourneyProgress = {
  journeyId: string;
  status: JourneyStatus;
  xp: number;
  targetXP: number;
  progressPercent: number;
  currentLocationId: string;
  nextLocationId?: string;
  segmentProgressPercent: number;
  startedAt: ISODate;
  completedAt?: ISODateTime;
};
```

The persisted journey definition becomes immutable after its first successful run. A new `journey.id` creates a new campaign.

## Titles And Achievements

```ts
type TitleDefinition = {
  id: string;
  name: string;
  requiredXP: number;
};

type AchievementCondition = {
  metric: keyof ActivityCounts | "xp" | "location";
  operator: "gte" | "reached";
  value: number | string;
};

type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  category: "JOURNEY" | "XP" | "CONTRIBUTION" | "MILESTONE";
  condition: AchievementCondition;
};

type AchievementUnlock = {
  achievementId: string;
  unlockedAt: ISODateTime;
};
```

Titles and achievements are scoped to one journey. Completed journey records retain their unlocks.

## Events

```ts
type JourneyEvent = {
  id: string;
  journeyId: string;
  occurredAt: ISODateTime;
  type:
    | "JOURNEY_STARTED"
    | "LOCATION_UNLOCKED"
    | "TITLE_UNLOCKED"
    | "ACHIEVEMENT_UNLOCKED"
    | "JOURNEY_COMPLETED";
  value: string;
};
```

An event ID is deterministic from `journeyId`, `type`, and `value`. Re-running the engine must not duplicate it.

## Current And Completed Records

```ts
type ActiveJourneyRecord = {
  definition: JourneyDefinition;
  progress: JourneyProgress;
  activity: ActivityReport;
  xp: XPResult;
  titleId: string;
  achievements: AchievementUnlock[];
  lastUpdated: ISODateTime;
};

type CompletedJourneyRecord = ActiveJourneyRecord & {
  progress: JourneyProgress & {
    status: "COMPLETED";
    completedAt: ISODateTime;
  };
};
```

Completed records are frozen and archived when completion is first persisted. Starting another journey creates a new active record; it does not carry XP or achievements forward.
