\# contributor-spec.md



\# Purpose



This document defines how contributors should extend and improve the GitHub RPG Engine.



The project is designed as a platform rather than a single theme implementation.



Contributors should be able to:



✅ Add new themes



✅ Add assets



✅ Improve SVG rendering



✅ Add achievements



✅ Add titles



✅ Improve documentation



✅ Fix bugs



without requiring changes to core engine architecture.



\---



\# Core Philosophy



The engine and themes are separate concerns.



Contributors should prefer:



```text

Theme Extensions

```



over:



```text

Engine Modifications

```



whenever possible.



Example:



Preferred:



```text

Add Pirate Theme

```



Not Preferred:



```text

Hardcode Pirate Logic Into Engine

```



\---



\# Contributor Types



The project supports several contribution categories.



\---



\# Theme Contributors



Create entirely new RPG experiences.



Examples:



```text

Middle-earth

Pirate Voyage

Space Odyssey

Cyberpunk Run

Witcher Path

```



Theme contributors are expected to work primarily in:



```text

themes/

```



\---



\# Asset Contributors



Improve visuals.



Areas:



```text

Character Sprites

Terrain Art

Location Markers

Icons

Background Elements

```



Assets should remain:



✅ SVG-first



✅ Lightweight



✅ GitHub-compatible



\---



\# Gameplay Contributors



Improve progression systems.



Areas:



```text

XP Models

Achievements

Titles

Quest Systems

```



Changes should remain deterministic.



\---



\# Documentation Contributors



Areas:



```text

Setup Guides

Theme Guides

Architecture Docs

Examples

```



Documentation contributions are strongly encouraged.



\---



\# Engine Contributors



Areas:



```text

Performance

Bug Fixes

Refactoring

Testing

Tooling

```



Engine changes should preserve:



```text

Theme Compatibility

Deterministic Progression

Specification Compliance

```



\---



\# Repository Structure



```text

.github/

src/

themes/

data/

docs/

specs/

```



\---



\# Contribution Workflow



Recommended workflow:



```text

Fork Repository

↓

Create Feature Branch

↓

Implement Change

↓

Validate Behaviour

↓

Submit Pull Request

```



\---



\# Pull Request Requirements



Every pull request should:



✅ Solve one problem



✅ Include documentation updates if required



✅ Follow existing architecture



✅ Preserve theme abstraction



✅ Avoid introducing breaking changes



\---



\# Architecture Rule



Contributors must preserve:



```text

Engine

↓

Theme

```



separation.



The following should never be hardcoded into engine logic:



```text

Middle-earth

Moria

Mount Doom

Hobbit

Ring Bearer

```



These belong exclusively in themes.



\---



\# Creating A Theme



A theme must contain:



```text

theme.json

map.json

titles.json

achievements.json

palette.json

assets/

```



\---



\# Minimum Theme Structure



```text

themes/

└── my-theme/

&#x20;   ├── theme.json

&#x20;   ├── map.json

&#x20;   ├── titles.json

&#x20;   ├── achievements.json

&#x20;   ├── palette.json

&#x20;   └── assets/

```



\---



\# Theme Validation Requirements



A theme must provide:



✅ Theme metadata



✅ Route locations



✅ XP thresholds



✅ At least one title



✅ At least one achievement



✅ Valid JSON files



\---



\# Route Design Guidelines



Good routes should:



✅ Tell a story



✅ Have meaningful milestones



✅ Progress logically



✅ End with a clear destination



Examples:



```text

Earth → Mars



Beginner Pirate → Pirate King



Village → Capital City



Shire → Mount Doom

```



\---



\# Achievement Guidelines



Good achievements should:



✅ Feel rewarding



✅ Be achievable



✅ Encourage contribution



✅ Be data-driven



Avoid:



❌ Impossible achievements



❌ Random achievements



❌ Theme-breaking achievements



\---



\# Title Guidelines



Good titles should:



✅ Reflect progression



✅ Escalate naturally



✅ Match theme identity



Example:



```text

Cadet

Navigator

Explorer

Captain

Admiral

Legend

```



\---



\# SVG Asset Guidelines



All assets should be:



✅ SVG-based



✅ Open-source friendly



✅ Lightweight



✅ Readable at small sizes



Avoid:



❌ Large embedded bitmaps



❌ Heavy visual effects



❌ Complex filters



\---



\# Documentation Standards



Major changes should update:



```text

README.md

docs/

specs/

```



where relevant.



Documentation is considered part of the feature.



\---



\# Future Theme Registry



Future versions may include:



```text

Official Themes

Community Themes

Featured Themes

```



Contributors should design themes so they can be distributed independently.



\---



\# Coding Standards



Contributors should:



✅ Use TypeScript



✅ Prefer pure functions



✅ Prefer small modules



✅ Follow specifications



✅ Keep business logic testable



\---



\# Testing Expectations



Changes should not break:



✅ Journey calculation



✅ XP calculation



✅ Achievement evaluation



✅ SVG generation



✅ Storage compatibility



\---



\# Backwards Compatibility



Contributions should avoid:



```text

Breaking existing themes

Breaking storage schemas

Breaking configuration contracts

```



Backward compatibility is preferred wherever possible.



\---



\# Contribution Priorities



Areas where contributions are most valuable:



```text

New Themes

SVG Improvements

Documentation

Testing

GitHub API Improvements

Achievement Packs

Title Packs

```



\---



\# Recognition



Contributors should be acknowledged in:



```text

README.md

CONTRIBUTORS.md

```



where appropriate.



\---



\# Success Criteria



The contributor experience is successful when:



✅ New themes can be created without engine changes



✅ Contributors understand project architecture quickly



✅ Pull requests remain focused and manageable



✅ Community-created themes are possible



✅ Engine stability is preserved

`

