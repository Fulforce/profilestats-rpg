# GitHub Action And Automation Specification

## Purpose

Automation runs the engine in the user's repository, writes generated artifacts, and optionally commits them. It must require no service operated or paid for by the project maintainer.

## Supported Installation Modes

### Fork mode

The repository includes `.github/workflows/update-journey.yml`. A fork owner configures their profile, enables Actions, manually validates the first run, and then enables the commented schedule.

### Reusable Action mode

A user with an existing profile repository creates the configuration file and a consumer workflow file. The workflow filename is chosen by the consumer; the documented example uses:

```text
.github/profile-stats-rpg.yml
.github/workflows/update-profile-rpg.yml
```

Example consumer workflow:

```yaml
name: Update Profile RPG

on:
  workflow_dispatch:
  schedule:
    - cron: "17 5 * * *"

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: Fulforce/profilestats-rpg@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          commit-changes: true
```

The Action reads journey settings from the checked-out consumer repository. The referenced release contains the executable engine and bundled themes. GitHub supplies the runner; the maintainer hosts no runtime infrastructure.

The final owner/repository spelling is release metadata and may differ from this example.

## Action Packaging

The repository exposes `action.yml` as a JavaScript Action with a checked-in, reproducible `dist/` bundle. Consumers do not run `npm install` for this project and do not depend on the repository's development files.

Decision record for Phase 4:

- the Action is authored in TypeScript and bundled as JavaScript with `@vercel/ncc`;
- `dist/` is committed and CI must reject a bundle that differs from a clean rebuild;
- both the supplied fork workflow and reusable installations invoke `action.yml` and therefore the same `runUpdate` engine;
- the consumer checkout owns configuration, generated state, history, and SVG output, while bundled themes load from the installed Action release;
- the JavaScript entrypoint locates bundled themes from its installed module path and does not depend on composite-Action-only environment variables;
- `commit-changes` remains safely opt-in, although the recommended profile workflow enables it explicitly;
- implementation review precedes publication; immutable prerelease validation is tracked as a separate release task.

Release tags follow semantic versioning:

- immutable tags such as `v1.2.3` identify exact releases;
- a maintained major tag such as `v1` moves only to compatible releases;
- security guidance may recommend pinning a full commit SHA;
- breaking input, output, schema, or runtime changes require a new major Action version.

## Inputs And Outputs

Inputs:

| Input            | Required | Default                         | Meaning                                                    |
| ---------------- | -------- | ------------------------------- | ---------------------------------------------------------- |
| `github-token`   | yes      | none                            | Token used for public GitHub collection and optional push. |
| `config-path`    | no       | `.github/profile-stats-rpg.yml` | Configuration in the consumer checkout.                    |
| `commit-changes` | no       | `false`                         | Commit and push generated files when changed.              |
| `allow-abandon`  | no       | `false`                         | Explicitly allow replacing an active journey.              |

Outputs:

| Output             | Meaning                             |
| ------------------ | ----------------------------------- |
| `changed`          | `true` when generated files differ. |
| `svg-path`         | Validated generated SVG path.       |
| `journey-status`   | `ACTIVE` or `COMPLETED`.            |
| `progress-percent` | Numeric current progress.           |

Secrets are masked and never echoed. Gameplay configuration is not duplicated as inputs.

## Workflow Lifecycle

1. verify checkout and repository boundary;
2. load and validate configuration;
3. load and validate the selected bundled theme;
4. load and validate persisted data;
5. return the frozen record immediately when the same journey is complete;
6. collect public GitHub activity for an active or new journey;
7. calculate XP, route, title, achievements, and events;
8. construct all JSON and SVG outputs;
9. validate output safety and consistency;
10. atomically replace generated files;
11. expose Action outputs;
12. commit and push only when requested and files changed.

No generated file is changed before the complete candidate update validates.

## Triggers

The project-supplied fork workflow supports `workflow_dispatch`. Its schedule remains commented out in the host repository so newly created forks do not run against the example configuration.

Users enable scheduling only after configuration and a successful manual run. Scheduled workflow behavior belongs to the consumer repository and does not affect the maintainer's account.

Push triggers are not enabled by default because generated commits can cause loops. If a consumer adds one, generated commits must be excluded or tagged to prevent recursion.

## Commit Behavior

When `commit-changes` is true:

- configure the documented GitHub Actions bot identity;
- stage only configured generated JSON and SVG paths;
- refuse paths outside the repository;
- commit only when staged content differs;
- use `chore: update profile RPG journey`;
- push to the checked-out branch without force;
- surface branch-protection rejection with guidance;
- never stage configuration, source, logs, temporary files, or unrelated changes.

The Action must not attempt to bypass branch protection. Consumers with protected profile branches may set `commit-changes: false` and implement a pull-request workflow.

## Permissions And Security

The recommended consumer workflow declares `contents: write` only when committing. Generation-only use requires `contents: read`.

The Action:

- uses no `pull_request_target` workflow;
- does not execute theme or configuration content;
- validates and confines all paths;
- does not run arbitrary shell values from user data;
- pins build dependencies through the lockfile;
- receives automated dependency and code scanning;
- publishes provenance and release checksums where practical;
- never persists or prints tokens;
- treats pull requests from forks as untrusted and without write credentials.

## Concurrency And Reliability

Consumer workflows should define one concurrency group per repository with `cancel-in-progress: false`. Concurrent runs must not race generated state.

The normal target runtime is below 60 seconds and the hard target is below 2 minutes for typical profiles. Network requests have timeouts. Transient retries are bounded. A failed run leaves previous output intact and exits non-zero with a safe, actionable message.

## Idempotency

Two runs against unchanged activity on the same UTC day produce no second snapshot, event, or commit. A completed journey with unchanged display settings skips collection and produces no commit.

Collection timestamps are not meaningful state changes. When a same-day collection produces an otherwise identical journey record, the engine preserves the existing `collectedAt` and `lastUpdated` values while still rerendering from current display configuration.

## Release Verification

Publishing is deliberately separated from implementation. After the implementation has passed review, an immutable prerelease is published and exercised from a separate consumer repository. Stable or moving tags are not created as part of the implementation review.

Phase 4 release verification completed against immutable `v1.0.0-beta.3` in `Fulforce/profilestats-rpg-action-test`. Generation-only permissions, restricted generated-file commits, same-day idempotency, concurrency configuration, and protected-branch rejection were exercised successfully. Earlier beta tags remain immutable records of defects found and corrected during validation. No stable or moving Action tag was created by this validation step.

CI for a release must:

- build the Action bundle from a clean checkout;
- verify the checked-in bundle matches the build;
- run unit, integration, theme, and SVG tests;
- smoke-test both fork and consumer fixtures;
- verify Action metadata and outputs;
- scan the bundle and dependencies;
- test the supported Node runtime declared by the Action.

## Acceptance Criteria

- fork and reusable Action modes are behaviorally equivalent;
- consumers configure journeys through their own YAML file;
- no maintainer-hosted runtime is required;
- schedules are opt-in for forks;
- commits contain only generated artifacts;
- reruns are idempotent and concurrency-safe;
- failures preserve valid existing output;
- releases are versioned and reproducible.
