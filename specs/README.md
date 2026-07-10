# Specification Index

These documents define the target future state of GitHub Profile Stats RPG. They are normative design contracts, not claims that every feature is implemented today.

## Product And Delivery

- [Product vision](vision.md): audience, principles, installation modes, success criteria, and non-goals.
- [Roadmap](roadmap.md): phased implementation from the unpublished MVP prototype to the first public release.
- [Contributor specification](contributor-spec.md): architecture boundaries, tests, themes, compatibility, and review expectations.

## Core Domain

- [Domain model](domain-model.md): canonical types and vocabulary.
- [Configuration](config-spec.md): first-public-release YAML contract and validation.
- [GitHub activity](github-api-spec.md): public data definitions, completeness, pagination, and failures.
- [XP engine](xp-engine-spec.md): versioned and explainable XP calculation.
- [Journey](journey-spec.md): campaign identity, progression, completion, and replacement.
- [Titles](title-spec.md): journey-scoped title thresholds and events.
- [Achievements](achievement-spec.md): journey-scoped milestone definitions and unlocks.

## Persistence And Presentation

- [Storage](storage-spec.md): generated JSON, archives, events, and atomic writes.
- [Themes](theme-spec.md): bundled theme structure, validation, assets, and licensing.
- [SVG rendering](svg-spec.md): standard and compact layouts, accessibility, safety, and visual tests.
- [GitHub Action](github-action-spec.md): fork automation, reusable installation, releases, and permissions.

## Precedence

The domain model owns shared vocabulary. A dedicated subsystem specification owns its validation and behavior. The product vision resolves scope questions. When documents appear to conflict, contributors should open an issue and update the specifications explicitly rather than infer a silent precedence rule.

Breaking target-state decisions require updates to every affected contract and the roadmap.
