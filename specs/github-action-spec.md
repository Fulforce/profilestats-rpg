\# github-action-spec.md



\# Purpose



The GitHub Action is responsible for keeping the RPG journey up to date automatically.



The action acts as the orchestration layer for the entire engine.



Its responsibilities are:



\- Collect GitHub activity

\- Calculate XP

\- Calculate journey progression

\- Unlock achievements

\- Unlock titles

\- Persist journey data

\- Generate SVG output

\- Commit updated files back to the repository



The action should require minimal user intervention after setup.



\---



\# Philosophy



The system should feel alive.



The user should:



```text

Fork Repository

↓

Configure Username

↓

Enable GitHub Actions

↓

Forget About It

```



Progression should happen automatically.



The SVG should update itself over time.



\---



\# Workflow Location



```text

.github/workflows/update.yml

```



\---



\# Workflow Name



Recommended:



```yaml

name: Update Journey

```



\---



\# Trigger Strategy



The workflow should support:



\## Scheduled Updates



Primary trigger.



```yaml

schedule:

&#x20; - cron: "0 2 \* \* \*"

```



Recommended:



```text

Daily\*```



Purpose:



```text

Update jour\*ey progression

Refresh\*SVG

Record daily snapshot\*```



\---



\# Manual Execution



Supp\*rt:



```yaml

workflow\*dispatch:

```



Purpose:



```text

F\*rce update\*Debug workflow\*Test changes

```



\---



\# Push Trig\*er



Optional.



For MVP:



```yaml

p\*sh:

&#x20; branches:

&#x20;   - main

```



Us\*ful during development.



May be re\*oved later.



\---



\# Workflow Lifec\*cle



Execution flow:



```text

Load\*Configuration

↓

Validate Theme

↓

C\*llect GitHub Activity

↓

Calculate \*P

↓

Calculate Journey Progress

↓

C\*lculate Title

↓

Calculate Achievem\*nts

↓

Generate Storage Updates

↓

G\*nerate SVG

↓

Commit Changes

↓

Push\*Changes

```



\---



\# Stage 1 — Load\*Configuration



Read:



```text

conf\*g.yml

```



Expected values:



```ya\*l

githubUser: "octocat"



theme: "m\*ddle-earth"



journey:

&#x20; startDate:\*"2026-01-01"

&#x20; targetXP: 50000

&#x20; x\*Multiplier: 1.0

```



\---



\# Valida\*ion Rules



Verify:



✅ githubUser e\*ists



✅ theme exists



✅ journey.st\*rtDate exists



✅ targetXP > 0



✅ x\*Multiplier > 0



If validation fail\*:



```text

Fail workflow

Emit usef\*l error

```



\---



\# Stage 2 — Load\*Theme



Load:



```text

themes/<them\*>/

```



Validate:



```text

theme.j\*on

map.json

titles.json

achievemen\*s.json

palette.json

```



\---



\# Th\*me Validation



Verify:



✅ Theme di\*ectory exists



✅ Required files ex\*st



✅ Map contains locations



✅ Ti\*les contain thresholds



✅ Achievem\*nts contain IDs



If validation fai\*s:



```text

Abort execution

```



\-\*-



\# Stage 3 — Collect GitHub Acti\*ity



Input:



```text

githubUser

jo\*rney.startDate

```



Collect:



```t\*xt

Commits

PRs Opened

PRs Merged

I\*sues Opened

Issues Closed

Reviews \*ubmitted

Repositories Created

Rele\*ses Published

Contribution Streaks\*```



Output:



```json

{

&#x20; "commits\*: 1234,

&#x20; "prsMerged": 42

}

```



\-\*-



\# Activity Collection Window



O\*ly include activity occurring on o\* after:



```yaml

journey.startDate\*```



Example:



```yaml

startDate: \*2026-01-01"

```



Any earlier activ\*ty must be ignored.



\---



\# Stage \* — Calculate XP



Input:



```text

A\*tivity

XP Rules

xpMultiplier

```



\*utput:



```json

{

&#x20; "rawXP": 10450\*

&#x20; "multiplier": 1.25,

&#x20; "finalXP"\* 13062

}

```



\---



\# Stage 5 — Cal\*ulate Journey Progress



Input:



``\*text

XP

targetXP

map.json

```



Out\*ut:



```json

{

&#x20; "progressPercent"\* 52.4,

&#x20; "currentLocation": "Lothl\*rien",

&#x20; "nextLocation": "Amon Hen\*

}

```



\---



\# Stage 6 — Evaluate \*itles



Input:



```text

XP

titles.j\*on

```



Output:



```json

{

&#x20; "titl\*": "Adventurer"

}

```



\---



\# Stag\* 7 — Evaluate Achievements



Input:\*

```text

Activity

Journey State

Cu\*rent XP

achievements.json

```



Out\*ut:



```json

{

&#x20; "achievements": \[\*    "LEFT\_SHIRE",

&#x20;   "FIRST\_PR\_ME\*GED"

&#x20; ]

}

```



\---



\# Stage 8 — U\*date State Files



Generate:



```te\*t

data/state.json

```



Update:



``\*text

Current Snapshot

```



\---



\# \*pdate Daily Log



Update:



```text

\*ata/daily-log.json

```



Rules:



``\*text

One snapshot per calendar day\*```



If today's record exists:



``\*text

Replace today's snapshot

```

\*Otherwise:



```text

Append new sna\*shot

```



\---



\# Update Event Log

\*Update:



```text

data/events.json

\*``



Append:



```text

Newly unlocke\* achievements

Newly unlocked title\*

Newly reached locations

```



Neve\* create duplicates.



\---



\# Stage \* — Generate SVG



Input:



```text

s\*ate.json

theme assets

map.json

```\*

Output:



```text

output/journey.s\*g

```



Must include:



✅ XP



✅ Prog\*ess



✅ Current Location



✅ Next Lo\*ation



✅ Current Title



✅ Achievem\*nt Count



✅ Route



✅ Character Pos\*tion



\---



\# SVG Validation



Verif\*:



```text

SVG generated

SVG not e\*pty

```



If generation fails:



```\*ext

Fail workflow

```



Do not comm\*t invalid SVGs.



\---



\# Stage 10 —\*Commit Changes



Expected changed f\*les:



```text

data/state.json

data\*daily-log.json

data/events.json

ou\*put/journey.svg

```



\---



\# Commit\*Message



Recommended:



```text

cho\*e: update journey progression

```

\*Alternative:



```text

chore: updat\* middle-earth journey

```



\---



\# Git Commit Rules



Only commit if files changed.



Avoid empty commits.

\*Example:



```bash

No changes → No \*ommit

```



\---



\# Push Changes



Pu\*h updates back to:



```text

main

`\*`



branch.



\---



\# Permissions



Wo\*kflow requires:



```yaml

permissions:

&#x20; contents: write

```



Purpose:



```text

Commit generated files

```



\---



\# Failure Handling



Workflow failures should be visible.



Failures should include:



```text

Missing config

Missing theme

Invalid JSON

GitHub API errors

SVG generation errors

```



Emit descriptive messages.



Avoid generic:



```text

Something went wrong

```



errors.



\---



\# Rate Limiting



The collector should:



```text

Minimize API calls

```



Recommended:



```text

Query only required activity

```



Avoid:



```text

Fetching raw repository history unnecessarily

```



\---



\# Idempotency



Multiple executions on the same day should produce:



```text

Same state

Same SVG

One daily snapshot

No duplicate events

```



The workflow must be safe to rerun.



\---



\# Recovery Behaviour



If:



```text

state.json

```



is deleted:



The engine should rebuild it.



If:



```text

events.json

```



is deleted:



The engine should regenerate future events but historical loss is accepted.



If:



```text

daily-log.json

```



is deleted:



Future snapshots continue normally.



Historical data is not reconstructed in MVP.



\---



\# Security Requirements



The workflow must never:



❌ Commit secrets



❌ Commit GitHub tokens



❌ Commit API responses



❌ Persist credentials



Only generated progression data may be stored.



\---



\# Performance Goals



Target runtime:



```text

< 2 minutes

```



Preferred:



```text

< 30 seconds

```



for typical users.



\---



\# MVP Acceptance Criteria



The GitHub Action is complete when:



✅ Runs automatically each day



✅ Supports manual execution



✅ Loads configuration



✅ Loads selected theme



✅ Collects GitHub activity



✅ Calculates XP



✅ Calculates location and progress



✅ Evaluates achievements



✅ Evaluates titles



✅ Updates state.json



✅ Updates daily-log.json



✅ Updates events.json



✅ Generates journey.svg



✅ Commits changed files



✅ Pushes updates successfully



✅ Avoids duplicate snapshots and events



✅ Can be installed via repository fork



✅ Requires no ongoing user maintenance

