# MVP To Target-State Roadmap

## Purpose

This roadmap sequences the unpublished MVP prototype into the first public release described by the specifications. It is guidance, not a promise of dates. The prototype has no external consumers, so its configuration and generated data formats may be replaced directly without compatibility work.

## Phase 0: Specification Baseline

Status: complete.

- adopt the future-state specifications as the target contract;
- add a specification index and link implementation issues to acceptance criteria;
- record known MVP deviations rather than treating target behavior as already implemented;
- establish version 1 for the engine, Action, configuration, storage, themes, and XP rules.

Exit criteria: maintainers can distinguish unpublished prototype behavior from the first public contract without ambiguity.

## Phase 1: Correctness And Safety Foundation

Status: complete.

- introduce version-1 runtime types and validation;
- make storage updates transactional;
- add stable error codes and secret-safe messages;
- define exact GitHub metric semantics;
- fix inaccurate metric proxies and expose collection completeness warnings;
- add pagination, bounded retries, timeouts, and sanitized API fixtures;
- make XP source breakdown and rule-set version explicit;
- add hostile-input and path-boundary tests.

Exit criteria: a failed or partial collection cannot corrupt previous artifacts or silently claim exact data.

## Phase 2: Campaign Lifecycle And History

Status: complete.

- implement configuration schema version 1 and preferred config discovery;
- replace prototype configuration and storage with the public contracts;
- add stable journey IDs and immutable campaign definitions;
- make awarded XP monotonic;
- implement frozen completion and completed journey archive;
- add explicit active-journey abandonment;
- deduplicate deterministic lifecycle events;
- preserve completed journey achievements and display values.

Exit criteria: a user can complete one journey, configure another start date and ID, and retain the first journey unchanged.

## Phase 3: Renderer Product Pass

Status: complete.

- refactor rendering around a shared view model;
- finish the standard information hierarchy and collision-aware map labels;
- implement the compact layout;
- disclose incomplete activity accessibly;
- sanitize and namespace all inlined theme assets;
- add XML safety, bounds, size, screenshot, and nonblank pixel tests;
- produce representative fixtures for zero, active, completed, partial, and long-text states.

Exit criteria: both layouts are readable, deterministic, safe, and visually regression-tested.

## Phase 4: Reusable Action

Status: complete. The reusable Action was implemented through one shared engine path and immutable `v1.0.0-beta.3` passed separate consumer-repository validation.

- create `action.yml` and a reproducible JavaScript bundle;
- separate generation from optional commit behavior;
- implement documented inputs and outputs;
- add a consumer profile-repository fixture;
- keep the fork workflow using the same released engine path;
- document manual first run, opt-in schedules, permissions, and branch-protection alternatives;
- publish an immutable prerelease and test it in a separate repository as an explicit post-review validation step.

Exit criteria: a user can install the Action in an existing profile repository without forking or relying on maintainer-hosted infrastructure.

## Phase 5: Theme Contract And Community Release

Status: complete.

- upgrade bundled themes to schema version 1;
- add licensing and provenance files;
- enforce palette contrast, referential integrity, and asset safety;
- ensure Middle-earth has clear unofficial fan-work attribution;
- build shared theme contract and render tests;
- add a contributor theme template and review checklist;
- document that remote theme installation remains deferred.

Exit criteria: a contributor can add a bundled theme through one focused pull request without engine modifications.

## Phase 6: Initial Stable Release

- remove prototype-only configuration and generated personal data;
- verify fork and Action onboarding from empty repositories;
- update README, architecture, configuration, troubleshooting, and release docs;
- enable dependency updates, code scanning, and release artifact verification;
- publish immutable `v1.0.0` and moving `v1` tags;
- retain the previous working release and document rollback.

Exit criteria: documented setup works, all target acceptance tests pass, and no known issue risks data loss or secret exposure.

## Deferred Ideas

These require a separate future decision and are not prerequisites for productionizing the fun community project:

- independently hosted Git-based themes;
- generating standard and compact outputs simultaneously;
- an achievement gallery;
- additional activity providers;
- private contribution totals;
- organization profiles;
- hosted configuration or preview UI;
- theme registry, telemetry, accounts, or databases.

## Recommended Issue Order

Create milestones matching phases 1 through 6. Within each milestone, implement contracts before visual enhancements. Label issues with `engine`, `api`, `storage`, `renderer`, `action`, `theme`, `docs`, and `breaking-change` so scope remains visible.
