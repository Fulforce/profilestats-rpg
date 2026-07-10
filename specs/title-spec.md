# Title Specification

## Purpose

Titles provide a theme-specific name for the user's current XP tier. They are journey-scoped and deterministic.

## Definition

```ts
type TitleDefinition = {
  id: string;
  name: string;
  requiredXP: number;
};
```

Each theme supplies at least one title. IDs are unique kebab-case identifiers. Names are plain display text. Thresholds are non-negative integers, strictly increasing, and listed in ascending order. The first threshold must be 0. Duplicate thresholds are invalid.

Theme thresholds are authored against the theme's default target XP and scale using the same proportional rule as journey locations. The final title need not equal the journey target, but no effective threshold may exceed it.

## Evaluation

The current title is the highest title whose effective threshold is less than or equal to awarded XP.

When one run crosses several title thresholds, every newly reached title emits a `TITLE_UNLOCKED` event in ascending threshold order. Previously emitted events are not duplicated. A title never relocks if current calculated XP later decreases.

## Lifecycle

Titles belong to their journey. At completion, the current title and all title events are frozen in the completed journey record. A new journey starts from its theme's first title and does not inherit prior titles.

## Validation And Safety

- IDs match `^[a-z0-9][a-z0-9-]{0,63}$`.
- names are 1 through 64 Unicode characters after trimming;
- control characters and markup are rejected;
- thresholds must be representable safe integers;
- references use IDs, never display names;
- renderer output escapes all display text.

## Acceptance Criteria

- zero XP always resolves to a title;
- exact thresholds unlock the corresponding title;
- multiple crossed thresholds each produce one event;
- effective thresholds scale deterministically;
- title progress never regresses;
- completed journeys preserve their titles independently.
