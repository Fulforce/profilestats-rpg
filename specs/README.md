# Specification Index

These documents define the normative version-1 contracts for GitHub Profile Stats RPG. Some also preserve the decisions and delivery history behind the initial stable release.

## Product And Delivery

- [Product vision](vision.md): audience, principles, installation modes, success criteria, and non-goals.
- [Initial release record](roadmap.md): completed phases that took the prototype to the first stable release, plus deferred ideas.
- [Contributor specification](contributor-spec.md): architecture boundaries, tests, themes, compatibility, and review expectations.

## Core Domain

- [Domain model](domain-model.md): canonical types and vocabulary.
- [Configuration](config-spec.md): version-1 YAML contract and validation.
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

Breaking contract decisions require updates to every affected specification, implementation, test, and migration guide. The historical release record changes only when its history or deferred scope needs clarification.
