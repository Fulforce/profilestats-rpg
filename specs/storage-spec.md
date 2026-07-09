\# storage-spec.md



\# Purpose



The Storage Layer persists journey progression over time.



The storage system is responsible for:



\- Current journey state

\- Historical daily snapshots

\- Milestone event tracking

\- Historical contribution statistics

\- Yearly progression summaries



Storage is designed to support:



\- SVG rendering

\- Journey replay

\- Historical lookups

\- Future dashboards

\- Future analytics

\- Annual reports

\- Timeline visualizations



\---



\# Storage Philosophy



The project uses a hybrid storage model.



Storage consists of:



```text

state.json

daily-log.json

events.json

```



Each file has a single responsibility.



\---



\# Source Of Truth



GitHub activity remains the primary source of truth.



All XP, progression, titles, achievements and locations should be derivable from:



```text

GitHub Activity

\+

Configuration

```



Storage exists to:



\- Improve performance

\- Preserve history

\- Preserve milestones

\- Enable replay

\- Support reporting



Storage should never become the authority for raw GitHub activity.



\---



\# Directory Structure



```text

data/



state.json

daily-log.json

events.json

```



\---



\# state.json



\## Purpose



Contains the latest computed journey state.



This is the current snapshot used by:



\- SVG rendering

\- GitHub Pages

\- Future APIs

\- Debugging

\- External integrations



Only a single record exists.



This file is replaced during each update cycle.



\---



\# Structure



```json

{

&#x20; "metadata": {

&#x20;   "theme": "middle-earth",

&#x20;   "githubUser": "octocat",

&#x20;   "journeyStartDate": "2026-01-01",

&#x20;   "targetXP": 50000,

&#x20;   "xpMultiplier": 1.0

&#x20; },



&#x20; "lastUpdated": "2026-07-09",



&#x20; "xp": 12450,



&#x20; "title": "Adventurer",



&#x20; "currentLocation": "Lothlorien",



&#x20; "nextLocation": "Amon Hen",



&#x20; "progressPercent": 52.4,



&#x20; "achievementCount": 8,



&#x20; "achievements": \[

&#x20;   "LEFT\_SHIRE",

&#x20;   "FIRST\_PR\_MERGED",

&#x20;   "ENTERED\_MORIA"

&#x20; ],



&#x20; "stats": {

&#x20;   "commits": 1204,

&#x20;   "prsOpened": 75,

&#x20;   "prsMerged": 42,

&#x20;   "issuesOpened": 28,

&#x20;   "issuesClosed": 41,

&#x20;   "reviewsSubmitted": 67,

&#x20;   "repositoriesCreated": 3,

&#x20;   "releasesPublished": 5,

&#x20;   "streaks": 12

&#x20; }

}

```



\---



\# Metadata Section



\## Purpose



Stores configuration values used to generate the journey.



This enables:



\- Easier debugging

\- Future migrations

\- Dashboard generation

\- Configuration auditing



\---



\# Metadata Fields



```json

{

&#x20; "theme": "middle-earth",

&#x20; "githubUser": "octocat",

&#x20; "journeyStartDate": "2026-01-01",

&#x20; "targetXP": 50000,

&#x20; "xpMultiplier": 1.0

}

```



\---



\# Update Rules



During each engine execution:



```text

Calculate latest journey state

Replace existing state.json

Write updated snapshot

```



No historical data should exist inside this file.



This file always represents the latest known state.



\---



\# daily-log.json



\## Purpose



Stores immutable daily journey snapshots.



This file provides:



\- Historical replay

\- Location history

\- XP history

\- Achievement history

\- Yearly summaries

\- Future charting



Snapshots should be append-only.



Historical records should never be modified.



\---



\# Snapshot Frequency



Maximum:



```text

1 snapshot per calendar day

```



Recommended behaviour:



```text

If snapshot already exists for today:



Update today's entry



Otherwise:



Append new snapshot

```



This avoids duplicate entries when workflows run multiple times.



\---



\# Structure



```json

\[

&#x20; {

&#x20;   "date": "2026-07-09",



&#x20;   "xp": 12450,



&#x20;   "title": "Adventurer",



&#x20;   "currentLocation": "Lothlorien",



&#x20;   "nextLocation": "Amon Hen",



&#x20;   "progressPercent": 52.4,



&#x20;   "achievements": \[

&#x20;     "LEFT\_SHIRE",

&#x20;     "FIRST\_PR\_MERGED",

&#x20;     "ENTERED\_MORIA"

&#x20;   ],



&#x20;   "stats": {

&#x20;     "commits": 1204,

&#x20;     "prsOpened": 75,

&#x20;     "prsMerged": 42,

&#x20;     "issuesOpened": 28,

&#x20;     "issuesClosed": 41,

&#x20;     "reviewsSubmitted": 67,

&#x20;     "repositoriesCreated": 3,

&#x20;     "releasesPublished": 5,

&#x20;     "streaks": 12

&#x20;   }

&#x20; }

]

```



\---



\# Snapshot Contents



Each snapshot must contain:



```text

Date

XP

Title

Current Location

Next Location

Progress %

Achievements

GitHub Contribution Statistics

```



Each snapshot should contain everything necessary to understand:



```text

Who was I?

Where was I?

How much progress had I made?

What achievements had I unlocked?

What contributions produced that progress?

```



for any point in time.



\---



\# Retention Policy



Retain all snapshots forever.



No expiry policy.



No archive policy.



No pruning mechanism.



The daily log acts as the permanent adventure record.



\---



\# Historical Lookup Requirement



The engine must support:



```text

Where was I on this date?

```



Example:



```text

2026-03-15

```



Expected result:



```json

{

&#x20; "date": "2026-03-15",

&#x20; "xp": 5600,

&#x20; "title": "Ranger",

&#x20; "currentLocation": "Rivendell"

}

```



Historical journey reconstruction is a core capability.



\---



\# events.json



\## Purpose



Stores important milestones in the journey.



Events act as a historical quest log.



Events are immutable.



Events must never be deleted.



\---



\# Event Types



MVP supports:



```text

LOCATION\_UNLOCKED

TITLE\_UNLOCKED

ACHIEVEMENT\_UNLOCKED

```



\---



\# Structure



```json

\[

&#x20; {

&#x20;   "date": "2026-02-10",



&#x20;   "type": "LOCATION\_UNLOCKED",



&#x20;   "value": "RIVENDELL"

&#x20; }

]

```



\---



\# Location Event Example



```json

{

&#x20; "date": "2026-04-14",

&#x20; "type": "LOCATION\_UNLOCKED",

&#x20; "value": "MORIA"

}

```



\---



\# Achievement Event Example



```json

{

&#x20; "date": "2026-05-03",

&#x20; "type": "ACHIEVEMENT\_UNLOCKED",

&#x20; "value": "FIRST\_PR\_MERGED"

}

```



\---



\# Title Event Example



```json

{

&#x20; "date": "2026-06-01",

&#x20; "type": "TITLE\_UNLOCKED",

&#x20; "value": "RANGER"

}

```



\---



\# Event Rules



Each milestone may only be recorded once.



Example:



```text

ENTERED\_MORIA

```



must never be duplicated.



If an event already exists:



```text

Do not create another.

```



\---



\# Event Timeline Purpose



Events should support future features such as:



\- Quest logs

\- Journey timelines

\- Achievement history

\- Title progression history

\- Journey replays



without additional schema changes.



\---



\# Yearly Reporting



Yearly summaries should be derived from daily snapshots.



Separate yearly storage is not required.



\---



\# Example Derived Summary



```json

{

&#x20; "year": 2026,



&#x20; "startingXP": 2500,



&#x20; "endingXP": 12450,



&#x20; "earnedXP": 9950,



&#x20; "startLocation": "Bree",



&#x20; "endLocation": "Lothlorien",



&#x20; "achievementsUnlocked": 4

}

```



\---



\# Storage Guarantees



The 

