# Achievement Specification

## Purpose

Achievements recognize milestones reached during one journey. Definitions belong to themes; evaluation belongs to the engine.

Account-wide achievements, cross-journey unlock rules, random achievements, and external plugins are outside the version-1 scope.

## Definition

```ts
type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  category: "JOURNEY" | "XP" | "CONTRIBUTION" | "MILESTONE";
  condition: {
    metric:
      | "xp"
      | "location"
      | "commits"
      | "prsOpened"
      | "prsMerged"
      | "issuesOpened"
      | "issuesClosed"
      | "reviewsSubmitted"
      | "repositoriesCreated"
      | "releasesPublished"
      | "streaks";
    operator: "gte" | "reached";
    value: number | string;
  };
};
```

`gte` applies to numeric metrics and XP. `reached` applies only to a location ID. Unsupported combinations fail theme validation.

## Evaluation

Achievements are evaluated in theme file order against awarded XP, the current normalized activity counts, and all locations reached in the journey.

An achievement unlocks once. Unlocks are monotonic even if public activity later becomes unavailable. Each new unlock creates a deterministic `ACHIEVEMENT_UNLOCKED` event and stores its UTC timestamp.

When an incomplete activity report affects the metric used by an achievement, the available count may still unlock it. Not unlocking from incomplete data is not treated as evidence that the user has not met the real-world condition.

## Journey Scope

- every new journey starts with no unlocked achievements;
- achievements use activity counted from that journey's start date;
- completion freezes achievement state;
- completed and abandoned journey archives retain their unlocked achievements;
- changing a later theme definition never mutates a completed record.

## Definition Validation

- IDs are unique within a theme and use kebab case;
- names are 1 through 64 characters;
- descriptions are 1 through 160 characters;
- numeric targets are positive safe integers;
- location values reference existing theme location IDs;
- markup and control characters are rejected;
- definitions contain no executable expressions or code.

## Event Behavior

If one run unlocks several achievements, events follow theme file order. Event identity is based on journey ID, type, and achievement ID, making evaluation idempotent.

## Acceptance Criteria

- every supported condition has positive, boundary, and negative tests;
- malformed operator and metric combinations fail validation;
- achievements unlock exactly once per journey;
- unlocks never regress;
- new journeys do not inherit unlocks;
- completed records retain names, descriptions, and timestamps needed for historical rendering.
