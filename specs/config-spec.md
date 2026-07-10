# Configuration Specification

## Purpose

Configuration is the user-facing contract for selecting a profile, theme, journey, renderer, and output paths without changing application code.

## Location And Discovery

The preferred file is:

```text
.github/profile-stats-rpg.yml
```

The CLI and Action accept a `config-path` override. Without an override, this is the only path discovered automatically.

## Version 1 Example

```yaml
schemaVersion: 1

profile:
  githubUser: "octocat"

theme:
  id: "middle-earth"

journey:
  id: "road-to-mordor-2026"
  startDate: "2026-01-01"
  targetXP: 50000
  xpMultiplier: 1.0

display:
  layout: "standard"
  showStats: true
  showTitle: true
  showAchievements: true

output:
  svgPath: "output/journey.svg"
  dataDirectory: "data"
```

## Contract

```ts
type AppConfig = {
  schemaVersion: 1;
  profile: {
    githubUser: string;
  };
  theme: {
    id: string;
  };
  journey: {
    id: string;
    startDate: string;
    targetXP: number;
    xpMultiplier: number;
  };
  display?: {
    layout?: "standard" | "compact";
    showStats?: boolean;
    showTitle?: boolean;
    showAchievements?: boolean;
  };
  output?: {
    svgPath?: string;
    dataDirectory?: string;
  };
};
```

Defaults are applied before the validated configuration reaches the engine:

```yaml
display:
  layout: "standard"
  showStats: true
  showTitle: true
  showAchievements: true
output:
  svgPath: "output/journey.svg"
  dataDirectory: "data"
```

## Validation

- `schemaVersion` must be the integer `1`.
- `profile.githubUser` must match GitHub username syntax and be at most 39 characters.
- `theme.id` and `journey.id` must match `^[a-z0-9][a-z0-9-]{0,63}$`.
- `journey.startDate` must be a real UTC calendar date and must not be in the future.
- `journey.targetXP` must be an integer from 1 through 1,000,000,000.
- `journey.xpMultiplier` must be a finite number greater than 0 and at most 100.
- booleans must not be coerced from strings.
- output paths must be relative, remain inside the repository, and may not traverse with `..`.
- unknown keys are validation errors, preventing misspellings from being ignored.
- all validation issues are returned together with their YAML paths.

Secrets, tokens, and private contribution settings are forbidden in configuration.

## Journey Immutability

After a successful run persists a journey, these fields are locked for that `journey.id`:

- `profile.githubUser`;
- `theme.id`;
- `journey.startDate`;
- `journey.targetXP`;
- `journey.xpMultiplier`.

Changing a locked value while retaining the same ID fails with instructions to restore the value or choose a new journey ID. Display and output settings remain editable.

When the current journey is complete, leaving the same journey ID continues to render the frozen result. A different, previously unused journey ID archives the completed journey and starts a fresh calculation from the new start date.

An incomplete journey cannot be replaced implicitly. Starting a new journey while one is active requires an explicit CLI or Action option, `allow-abandon: true`; abandonment behavior is defined in the journey specification.

## Action Inputs

Action inputs control execution, not gameplay:

```text
config-path       optional, default .github/profile-stats-rpg.yml
github-token      required for GitHub collection
commit-changes    optional boolean, default false
allow-abandon     optional boolean, default false
```

Journey settings must not be duplicated as Action inputs. This preserves one version-controlled source of truth.

## Acceptance Criteria

- fork and Action installations load the same schema;
- defaults are explicit and tested;
- invalid and unknown fields produce actionable errors;
- persisted campaigns cannot be mutated accidentally;
- paths cannot escape the working repository;
- configuration contains no credentials.
