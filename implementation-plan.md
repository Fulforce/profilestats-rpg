\# implementation-plan.md



\# Purpose



This document defines the implementation roadmap for the GitHub Middle-earth RPG Engine.



The goal is to provide a structured delivery plan that can be executed by:



\- Claude Code

\- OpenAI Codex

\- Cursor

\- Human contributors



The implementation should follow the specifications contained within `/specs`.



This plan prioritizes:



```text

Working MVP

↓

Stable Architecture

↓

Visual Polish

↓

Extensibility

```



\---



\# Project Outcome



At completion, a user should be able to:



```text

Fork Repository

↓

Configure GitHub Username

↓

Enable GitHub Actions

↓

Automatically Generate Journey SVG

↓

Embed SVG In README

↓

Track RPG Progression Over Time

```



\---



\# Development Strategy



Build from the inside out.



Order of importance:



```text

Data Collection

↓

Progression Logic

↓

Storage

↓

Rendering

↓

Automation

```



Never start with SVG design.



The progression engine must work first.



\---



\# Phase 0 – Repository Setup



\## Goal



Create the project skeleton.



\---



\## Deliverables



```text

Repository Structure

TypeScript Setup

ESLint

Prettier

GitHub Action Skeleton

Specs Directory

```



\---



\## Tasks



Create:



```text

src/

themes/

data/

output/

docs/

specs/

```



Initialize:



```text

package.json

tsconfig.json

```



Install:



```text

typescript

tsx

eslint

prettier

yaml

```



\---



\## Acceptance Criteria



✅ Project builds



✅ TypeScript compiles



✅ Repository structure exists



\---



\# Phase 1 – Configuration System



\## Goal



Allow engine configuration to be loaded and validated.



\---



\## Deliverables



```text

config.yml

config-loader.ts

config-validator.ts

```



\---



\## Tasks



Load:



```yaml

githubUser

theme



journey:

&#x20; startDate

&#x20; targetXP

&#x20; xpMultiplier

```



Validate configuration.



Return typed configuration object.



\---



\## Acceptance Criteria



✅ Config loads successfully



✅ Validation works



✅ Invalid configuration fails cleanly



\---



\# Phase 2 – Theme System



\## Goal



Implement theme loading.



\---



\## Deliverables



```text

theme-loader.ts

theme-validator.ts

```



\---



\## Tasks



Load:



```text

theme.json

map.json

titles.json

achievements.json

palette.json

```



Validate all required files.



Build normalized theme object.



\---



\## Acceptance Criteria



✅ Middle-earth theme loads correctly



✅ Validation errors are descriptive



✅ Theme object is reusable



\---



\# Phase 3 – GitHub API Layer



\## Goal



Collect contribution activity.



\---



\## Deliverables



```text

github-api.ts

activity-collector.ts

```



\---



\## Tasks



Collect:



```text

Commits

PRs Opened

PRs Merged

Issues Opened

Issues Closed

Reviews

Repositories Created

Releases Published

Streaks

```



Apply:



```text

journey.startDate

```



filtering.



Return normalized activity object.



\---



\## Acceptance Criteria



✅ Activity retrieved



✅ Pagination handled



✅ Dates filtered correctly



✅ Output matches spec



\---



\# Phase 4 – XP Engine



\## Goal



Convert activity into XP.



\---



\## Deliverables



```text

xp-engine.ts

```



\---



\## Tasks



Implement:



```text

XP Rules

XP Multipliers

Streak Bonuses

```



Return:



```ts

XPResult

```



\---



\## Acceptance Criteria



✅ XP calculations correct



✅ XP multiplier applied



✅ Deterministic output



\---



\# Phase 5 – Journey Engine



\## Goal



Convert XP into progression.



\---



\## Deliverables



```text

journey-engine.ts

```



\---



\## Tasks



Calculate:



```text

Progress %

Current Location

Next Location

Character Position

Segment Progress

```



Use:



```text

map.json

targetXP

```



\---



\## Acceptance Criteria



✅ Correct location determined



✅ Progress accurate



✅ Character interpolation works



\---



\# Phase 6 – Title Engine



\## Goal



Determine active title.



\---



\## Deliverables



```text

title-engine.ts

```



\---



\## Tasks



Load:



```text

titles.json

```



Calculate:



```text

Current Title

Unlocked Titles

New Title Events

```



\---



\## Acceptance Criteria



✅ Proper title selected



✅ Events generated



\---



\# Phase 7 – Achievement Engine



\## Goal



Evaluate achievements.



\---



\## Deliverables



```text

achievement-engine.ts

```



\---





