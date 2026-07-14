# Product Vision

## Product

GitHub Profile Stats RPG turns an individual's public GitHub activity into a themed, deterministic journey that can be embedded in a GitHub profile README.

The project is a fun, community-reusable open-source tool. It is not a hosted service and must not require infrastructure, accounts, databases, subscriptions, or ongoing costs for the maintainer.

The version-1 contracts in these specifications define the supported public behavior. Later releases evolve those contracts through explicit versioning and compatibility decisions.

Middle-earth is the default bundled theme. Additional themes may be contributed through pull requests and selected through configuration.

## Experience

Within a few seconds, the generated image should answer:

- Who is this journey for?
- Where are they now?
- How much progress have they made?
- What title and achievements have they earned?
- What activity contributed to their XP?
- What is the next destination?

The core loop is:

```text
Public GitHub activity
  -> normalized activity report
  -> XP breakdown
  -> journey progress
  -> titles and achievements
  -> versioned history
  -> static SVG
```

## Product Principles

1. **Zero-hosting:** execution and generated files belong to each user and run through their GitHub repository.
2. **Fork-friendly:** the complete project remains usable by editing a configuration file in a fork.
3. **Action-friendly:** users may install a released GitHub Action in an existing profile repository.
4. **Deterministic:** equal versioned inputs produce equal progression results.
5. **Campaign-based:** a journey has a stable identity, completes once, and is retained in history.
6. **Public by default:** only public GitHub activity is collected; private activity is outside the supported scope.
7. **Theme-driven:** story, route, titles, achievements, palette, and visual assets belong to themes.
8. **Static output:** generated SVGs need no scripts, external fonts, remote assets, or runtime service.
9. **Honest data:** incomplete or capped GitHub results are identified, not silently presented as exact.
10. **Small-project sustainability:** features must be maintainable by a small open-source project.

## Supported Users

The primary user is an individual GitHub user creating a card for their own profile. Organization dashboards, team competitions, social accounts, hosted editing, and multi-tenant services are non-goals.

## Installation Modes

### Fork mode

The user forks the repository, configures their journey, enables the included workflow, and commits generated artifacts in the fork.

### Action mode

The user adds `.github/profile-stats-rpg.yml` and a small workflow to an existing repository. The released Action executes on GitHub's runner and writes artifacts into that repository. The project maintainer hosts no service.

Both modes use the same engine, schemas, themes, and renderer.

## Success Criteria

The product is successful when:

- first-time setup is documented and requires no code changes;
- fork and Action installations produce equivalent results;
- a journey cannot be silently rewritten after completion;
- completed journeys and their achievements remain available;
- configuration, storage, themes, and Action releases are versioned;
- standard and compact SVGs are readable in GitHub light and dark contexts;
- API limitations and failures are actionable;
- community themes can be added without changing engine logic;
- CI verifies behavior, schemas, themes, and generated SVG safety.

## Explicit Non-Goals

- a hosted web application or API;
- private contribution collection;
- organization or team profiles;
- live leaderboards or multiplayer features;
- a hosted theme registry;
- arbitrary remote code execution from themes;
- exact reconstruction of activity GitHub does not expose publicly;
- compatibility with every historical schema indefinitely.
