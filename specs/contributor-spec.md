# Contributor Specification

## Purpose

This document defines the contract for contributing to a small, welcoming, maintainable open-source project. The project accepts engine, theme, renderer, documentation, testing, and accessibility improvements.

## Architectural Boundary

The engine owns:

- configuration and schema validation;
- public GitHub collection;
- XP and journey calculations;
- title and achievement evaluation mechanics;
- storage and event semantics;
- SVG layout mechanics;
- validation and Action packaging.

Themes own:

- setting, route, and location content;
- titles and achievements;
- palette and licensed visual assets;
- theme metadata and attribution.

Theme-specific names or behavior must not be hardcoded in engine modules. A new valid bundled theme should require no engine change.

## Repository Areas

```text
src/                 engine source
tests/               automated tests and fixtures
themes/              bundled themes
specs/               normative versioned behavior
docs/                explanatory guides and architecture
.github/              CI, automation, and contribution templates
action.yml            public Action contract
dist/                 generated release bundle
```

Generated user journey data is not accepted into the host repository.

## Contribution Workflow

1. create or assign an issue for material behavior changes;
2. branch from the current default branch;
3. keep the change focused;
4. update implementation, tests, and relevant specifications together;
5. run `npm run check` and any documented visual checks;
6. submit a pull request using the template;
7. resolve review conversations and maintain branch compatibility.

Small documentation and typo fixes do not require a prior issue.

## Specification Policy

Specifications are normative. If implementation and specification disagree, the mismatch must be resolved explicitly; neither silently overrides the other.

Behavioral pull requests identify:

- the affected contract;
- compatibility impact when persisted data changes;
- compatibility impact for existing configuration and Action consumers;
- user-visible output changes;
- tests demonstrating acceptance criteria.

Breaking changes target the next major release and require a clear failure path and upgrade documentation.

## Theme Contributions

A theme pull request includes:

- the complete required theme directory;
- valid schema-versioned data;
- route, title, and achievement tests;
- standard and compact render fixtures;
- `LICENSE.md` with asset and text provenance;
- no executable content or remote resources;
- documentation showing how to select the theme.

Theme authors must have the right to contribute all material. Fan themes must avoid claims of endorsement and may be declined or removed when licensing or trademark risk is unclear.

The project does not promise acceptance, permanent inclusion, or indefinite compatibility for every proposed theme.

## Code Quality

- TypeScript strict mode remains enabled;
- pure domain functions are preferred;
- I/O stays behind explicit boundaries;
- public contracts use named types and stable errors;
- dependencies require a concrete maintenance or correctness benefit;
- comments explain non-obvious constraints, not syntax;
- user-controlled text and paths are validated at boundaries;
- deterministic output avoids ambient clocks, randomness, and locale defaults.

## Testing Expectations

Changes add tests proportional to risk:

- domain logic uses table-driven unit tests;
- filesystem behavior uses isolated temporary directories;
- API behavior uses sanitized fixtures and fake transports;
- schema changes include representative validation fixtures;
- themes run shared contract tests;
- SVG changes include structure, bounds, accessibility, and visual regression checks;
- Action changes include a consumer-repository fixture;
- bug fixes include a regression test when practical.

Live GitHub credentials are not required for pull-request CI.

## Documentation And Accessibility

User-facing changes update README or guides. Theme and renderer changes account for contrast, long text, non-color indicators, accessible SVG names, and both supported layouts.

Documentation uses ordinary Markdown, runnable examples, relative repository links, and no assumed knowledge of project internals.

## Compatibility And Releases

- semantic versioning applies to the engine and Action;
- persisted schemas and theme schemas have explicit integer versions;
- release notes identify schema changes, changed visuals, and Action input changes;
- the moving major Action tag is updated only after immutable release verification.

## Pull Request Requirements

A pull request must pass CI, avoid unrelated generated changes, disclose new dependencies, preserve secrets safety, and receive required review under repository policy. Visual changes include before-and-after fixtures or screenshots in the pull request description.

## Community Standards

Contributors follow `CODE_OF_CONDUCT.md` and report vulnerabilities through `SECURITY.md`, not public issues. Maintainers use constructive review, document decisions, and prefer sustainable scope over feature volume.

## Acceptance Criteria

- contributors can locate the relevant contract quickly;
- theme submissions do not require engine edits;
- behavioral changes include tests and compatibility analysis;
- release artifacts are reproducible;
- licensing and security expectations are explicit;
- contribution requirements remain reasonable for a small fun project.
