\# xp-engine-spec.md



\# Purpose



The XP Engine converts GitHub activity into a single progression value.



XP is the universal progression currency of the RPG Engine.



Everything derives from XP:



```text

GitHub Activity

&#x20;     ↓

XP

&#x20;     ↓

Journey Progress

&#x20;     ↓

Titles

&#x20;     ↓

Achievements

&#x20;     ↓

SVG

```



The XP Engine is the only component responsible for converting developer activity into game progression.



\---



\# Design Philosophy



XP should:



✅ Reward meaningful contribution



✅ Be easy to understand



✅ Be deterministic



✅ Be reproducible



✅ Be theme-agnostic



✅ Scale across all future themes



XP should NOT:



❌ Depend on randomness



❌ Depend on theme



❌ Depend on manual input



❌ Require user judgement



\---



\# Core Principle



Every activity generates XP.



XP is calculated using:



```text

Activity

\+

XP Rules

\+

XP Multiplier

=

Final XP

```



\---



\# Inputs



The XP Engine consumes:



```ts

type Activity = {

&#x20; commits: number;

&#x20; prsOpened: number;

&#x20; prsMerged: number;

&#x20; issuesOpened: number;

&#x20; issuesClosed: number;

&#x20; reviewsSubmitted: number;

&#x20; repositoriesCreated: number;

&#x20; releasesPublished: number;

&#x20; streaks: number;

};

```



\---



\# XP Rules



Initial MVP values:



```json

{

&#x20; "commit": 1,

&#x20; "prOpened": 20,

&#x20; "prMerged": 50,

&#x20; "issueOpened": 10,

&#x20; "issueClosed": 15,

&#x20; "reviewSubmitted": 25,

&#x20; "repositoryCreated": 100,

&#x20; "releasePublished": 150,

&#x20; "streak7Days": 200

}

```



These values must be configurable.



Do not hardcode inside engine logic.



\---



\# XP Weighting Philosophy



Not all GitHub activity has equal impact.



Examples:



```text

Commit

=

Small progression



PR Merge

=

Meaningful progression



Repository Creation

=

Major progression



Release Publication

=

Major progression

```



The XP system should encourage meaningful activity rather than raw commit volume.



\---



\# XP Calculation



Base XP is calculated as:



```text

(commits × 1)

\+

(prsOpened × 20)

\+

(prsMerged × 50)

\+

(issuesOpened × 10)

\+

(issuesClosed × 15)

\+

(reviewsSubmitted × 25)

\+

(repositoriesCreated × 100)

\+

(releasesPublished × 150)

\+

(streaks × 200)

```



\---



\# Example Calculation



Activity:



```json

{

&#x20; "commits": 500,

&#x20; "prsOpened": 10,

&#x20; "prsMerged": 8,

&#x20; "issuesOpened": 20,

&#x20; "issuesClosed": 15,

&#x20; "reviewsSubmitted": 12,

&#x20; "repositoriesCreated": 2,

&#x20; "releasesPublished": 1,

&#x20; "streaks": 3

}

```



Calculation:



```text

500 × 1   = 500

10 × 20   = 200

8 × 50    = 400

20 × 10   = 200

15 × 15   = 225

12 × 25   = 300

2 × 100   = 200

1 × 150   = 150

3 × 200   = 600

```



Result:



```text

Raw XP = 2,775

```



\---



\# XP Multiplier



After base XP is calculated:



Apply:



```yaml

journey:

&#x20; xpMultiplier: 1.0

```



Formula:



```text

Final XP =

Raw XP × XP Multiplier

```



\---



\# Example



```text

Raw XP = 2,775



Multiplier = 1.5

```



Result:



```text

Final XP = 4,162.5

```



Round:



```text

4163 XP

```



\---



\# Rounding Rules



XP must always be stored as an integer.



After applying multipliers:



```text

Round to nearest whole number.

```



Example:



```text

4162.5

↓

4163

```



\---



\# Activity Window



The XP Engine must only calculate XP using activity occurring on or after:



```yaml

journey:

&#x20; startDate

```



Example:



```yaml

journey:

&#x20; startDate: "2026-01-01"

```



Ignore:



```text

Any activity before 2026-01-01

```



\---



\# Journey Start Behaviour



When a user selects:



```yaml

startDate: "today"

```



Result:



```text

Journey begins at 0 XP.

```



Only future activity contributes.



\---



\# Historical Journey Behaviour



When a user selects:



```yaml

startDate: "2023-01-01"

```



Result:



```text

XP is calculated from activity occurring after that date.

```



The player may begin partway through the journey.



\---



\# Contribution Streaks



MVP supports:



```text

7-day streak bonus

```



Reward:



```text

200 XP

```



Definition:



```text

7 consecutive days

with at least one contribution.

```



\---



\# Streak Calculation



Example:



```text

21-day streak

```



Produces:



```text

3 streak rewards



=

600 XP

```



Formula:



```text

floor(streakLength / 7)

```



Example:



```text

15-day streak



15 / 7



=



2 completed streaks



=

400 XP

```



\---



\# No Negative XP



XP may never be negative.



Minimum value:



```text

0

```



\---



\# No XP Decay



XP never decreases.



Examples:



```text

Repository deleted

Pull request reverted

Issue reopened

```



These do not remove XP.



XP represents historical progression.



\---



\# No Random Bonuses



MVP does not support:



```text

Random rewards

Critical bonuses

Loot systems

Temporary multipliers

```



All XP must be predictable.



\---



\# XP Result Contract



The XP Engine returns:



```ts

type XPResult = {

&#x20; rawXP: number;

&#x20; multiplier: number;

&#x20; finalXP: number;

};

```



\---



\# Example Output



```json

{

&#x20; "rawXP": 2775,

&#x20; "multiplier": 1.5,

&#x20; "finalXP": 4163

}

```



\---



\# State Storage Requirements



The final XP value must be stored in:



```text

state.json

```



Example:



```json

{

&#x20; "xp": 12450

}

```



\---



\# Daily Snapshot Requirements



Each daily snapshot must include:



```json

{

&#x20; "date": "2026-07-09",

&#x20; "xp": 12450

}

```



This supports:



\- Progress tracking

\- Historical replay

\- Annual reporting



\---



\# Theme Compatibility



The XP Engine must contain no theme-specific logic.



The XP Engine must never contain references to:



```text

Middle-earth

Mount Doom

Pirates

Cyberpunk

Space Travel

```



The XP Engine only understands:



```text

Activity

XP Rules

Multipliers

```



\---



\# Future Compatibility



Future versions may support:



```text

Custom XP Rule Sets

Theme-specific XP Models

Achievement XP Bonuses

Quest Rewards

Seasonal Events

```



These features are NOT part of MVP.



The engine should be structured to support them without redesign.



\---



\# Non-Goals



The XP Engine is not responsible for:



```text

Journey Progress

Location Calculation

Title Calculation

Achievement Evaluation

SVG Rendering

Storage Persistence

```



Its sole responsibility is:



```text

Convert Activity Into XP

```



\---



\# MVP Acceptance Criteria



The XP Engine is complete when:



✅ GitHub activity is converted into XP



✅ XP rules are configurable



✅ Start date filtering works



✅ XP multiplier works



✅ Streak bonuses work



✅ Output is deterministic



✅ Output is reproducible



✅ XP is stored as an integer



✅ No negative XP is possible



✅ No theme-specific logic exists



✅ Same inputs always generate the same XP result

