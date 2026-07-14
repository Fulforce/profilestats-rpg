# XP Engine Specification

## Purpose

The XP engine converts a normalized activity report into an explainable XP breakdown. It is pure, deterministic, theme-independent, and unaware of storage or rendering.

## Versioned Rule Set

XP values belong to a named semantic version. The version-1 rule set is:

```ts
const XP_RULE_SET = {
  version: "1.0.0",
  commits: 2,
  prsOpened: 20,
  prsMerged: 40,
  issuesOpened: 10,
  issuesClosed: 10,
  reviewsSubmitted: 15,
  repositoriesCreated: 100,
  releasesPublished: 150,
  streaks: 200
} as const;
```

Changing any released value requires a new rule-set version. Existing journeys retain the version stored when they began.

## Calculation

For each metric:

```text
earned XP = activity count * unit XP
raw XP = sum of all earned XP
calculated XP = floor(raw XP * configured multiplier)
awarded XP = max(previous awarded XP for this journey, calculated XP)
```

On a journey's first run, previous awarded XP is zero. All arithmetic uses safe non-negative integers. Non-finite values, negative counts, unsafe integer overflow, or invalid multipliers fail validation.

The result includes one source row per supported metric, including zero values, in stable rule-set order. Renderers may hide zero rows.

## Incomplete Activity

The XP engine calculates from the counts it receives and copies no warnings itself. The caller preserves the associated activity report. An incomplete report is not an XP error because usable public data may still produce a meaningful journey.

## Immutability

The rule-set version and multiplier are persisted with a journey. They are immutable after the first successful run. Existing active or completed journeys are never silently recalculated using a newer rule set.

An engine release must retain implementations needed to read and render supported historical records. A new journey uses the current default rule set unless configuration later supports an explicit compatible selection.

## Explainability

The XP result must be sufficient to reproduce the calculation without another GitHub call:

```json
{
  "ruleSetVersion": "1.0.0",
  "sources": [
    {
      "metric": "prsMerged",
      "count": 4,
      "unitXP": 40,
      "earnedXP": 160
    }
  ],
  "rawXP": 160,
  "multiplier": 1,
  "calculatedXP": 160,
  "awardedXP": 160
}
```

## Test Requirements

- table-driven tests cover every metric;
- zero activity yields zero XP;
- fractional multipliers use floor rounding once, after summation;
- source rows sum to raw XP;
- awarded XP cannot regress;
- malformed counts and overflow are rejected;
- fixture calculations are pinned per rule-set version;
- theme selection does not affect XP.

## Acceptance Criteria

- calculations are deterministic and explainable;
- progression is monotonic within a journey;
- rule changes are explicitly versioned;
- historical journeys retain their original calculation contract;
- no GitHub, filesystem, clock, or rendering dependency exists in the XP engine.
