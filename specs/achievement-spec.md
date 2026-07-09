\# achievement-spec.md



\# Purpose



The Achievement Engine rewards meaningful progression milestones throughout a user's journey.



Achievements provide:



\- Positive feedback

\- Long-term goals

\- Progress milestones

\- RPG-like progression

\- Event generation

\- Visual accomplishments within the SVG



Achievements should reinforce the feeling of travelling through a living adventure rather than accumulating statistics.



\---



\# Achievement Philosophy



Achievements are not the primary progression system.



XP drives progression.



Achievements celebrate progression.



The relationship should be:



```text

GitHub Activity

&#x20;     ↓

XP

&#x20;     ↓

Journey Progress

&#x20;     ↓

Achievements

```



Achievements should never become mandatory for progression.



\---



\# Design Principles



Achievements must be:



✅ Deterministic



✅ Earned through real activity



✅ Permanently unlockable



✅ Stored forever



✅ Theme-driven



✅ Compatible with future themes



Achievements must NOT:



❌ Rely on randomness



❌ Depend on manual user actions



❌ Require external integrations



❌ Be revocable once unlocked



\---



\# Achievement Definition



Every achievement contains:



```ts

type AchievementDefinition = {

&#x20; id: string;

&#x20; name: string;

&#x20; description: string;

&#x20; category:

&#x20;   | "JOURNEY"

&#x20;   | "XP"

&#x20;   | "CONTRIBUTION"

&#x20;   | "MILESTONE";



&#x20; condition: AchievementCondition;

};

```



\---



\# Achievement Categories



MVP supports four categories.



\---



\# JOURNEY



Unlocked by reaching locations.



Examples:



```text

Left the Shire

Entered Moria

Reached Mount Doom

```



\---



\# XP



Unlocked by total earned XP.



Examples:



```text

1,000 XP

10,000 XP

25,000 XP

50,000 XP

```



\---



\# CONTRIBUTION



Unlocked through GitHub activity.



Examples:



```text

First Pull Request Merged

First Release Published

100 Commits

```



\---



\# MILESTONE



Special progression achievements.



Examples:



```text

First Title Earned

Halfway to Mount Doom

Legend of Middle-earth

```



\---



\# Achievement Storage



Achievement definitions are stored inside the active theme.



Location:



```text

themes/middle-earth/achievements.json

```



\---



\# Achievement Schema



Example:



```json

{

&#x20; "id": "FIRST\_PR\_MERGED",

&#x20; "name": "First Victory",

&#x20; "description": "Merge your first pull request.",

&#x20; "category": "CONTRIBUTION",



&#x20; "condition": {

&#x20;   "type": "prsMerged",

&#x20;   "value": 1

&#x20; }

}

```



\---



\# Supported Condition Types



MVP supports the following condition types.



\---



\# XP-Based



```json

{

&#x20; "type": "xp",

&#x20; "value": 1000

}

```



Unlock:



```text

XP >= 1000

```



\---



\# Location-Based



```json

{

&#x20; "type": "location",

&#x20; "value": "MORIA"

}

```



Unlock:



```text

Current Location = Moria

```



\---



\# Commits



```json

{

&#x20; "type": "commits",

&#x20; "value": 100

}

```



Unlock:



```text

Commits >= 100

```



\---



\# Pull Requests Opened



```json

{

&#x20; "type": "prsOpened",

&#x20; "value": 10

}

```



Unlock:



```text

PRs Opened >= 10

```



\---



\# Pull Requests Merged



```json

{

&#x20; "type": "prsMerged",

&#x20; "value": 1

}

```



Unlock:



```text

PRs Merged >= 1

```



\---



\# Issues Opened



```json

{

&#x20; "type": "issuesOpened",

&#x20; "value": 10

}

```



Unlock:



```text

Issues Opened >= 10

```



\---



\# Issues Closed



```json

{

&#x20; "type": "issuesClosed",

&#x20; "value": 10

}

```



Unlock:



```text

Issues Closed >= 10

```



\---



\# Reviews Submitted



```json

{

&#x20; "type": "reviewsSubmitted",

&#x20; "value": 10

}

```



Unlock:



```text

Reviews Submitted >= 10

```



\---



\# Repositories Created



```json

{

&#x20; "type": "repositoriesCreated",

&#x20; "value": 1

}

```



Unlock:



```text

Repositories Created >= 1

```



\---



\# Releases Published



```json

{

&#x20; "type": "releasesPublished",

&#x20; "value": 1

}

```



Unlock:



```text

Releases Published >= 1

```



\---



\# Achievement Evaluation



During every engine run:



```text

Load achievement definitions

↓

Load current activity

↓

Load current journey state

↓

Evaluate all achievements

↓

Identify newly unlocked achievements

↓

Persist unlocked achievements

↓

Generate events

```



All achievements should be evaluated every run.



\---



\# Unlock Rules



Achievements unlock once.



Once unlocked:



```text

Unlocked Forever

```



Achievements must never be removed.



Achievements must never be relocked.



\---



\# Event Generation



Every newly unlocked achievement creates an event.



Example:



```json

{

&#x20; "date": "2026-07-09",



&#x20; "type": "ACHIEVEMENT\_UNLOCKED",



&#x20; "value": "FIRST\_PR\_MERGED"

}

```



Events are stored in:



```text

events.json

```



\---



\# Achievement State



The engine should return:



```ts

type AchievementResult = {

&#x20; achievements: string\[];

&#x20; unlockedThisRun: string\[];

&#x20; achievementCount: number;

};

```



\---



\# MVP Achievement Set



Initial Middle-earth achievement catalogue.



\---



\# Journey Achievements



```text

LEFT\_SHIRE

ENTERED\_BREE

REACHED\_RIVENDELL

ENTERED\_MORIA

ARRIVED\_LOTHLORIEN

CROSSED\_DEAD\_MARSHES

SURVIVED\_SHELOB

REACHED\_MOUNT\_DOOM

```



\---



\# XP Achievements



```text

XP\_1000

XP\_5000

XP\_10000

XP\_25000

XP\_50000

```



\---



\# Contribution Achievements



```text

FIRST\_COMMIT

FIRST\_PR\_OPENED

FIRST\_PR\_MERGED

FIRST\_ISSUE\_OPENED

FIRST\_ISSUE\_CLOSED

FIRST\_REPOSITORY

FIRST\_RELEASE

FIRST\_REVIEW

```



\---



\# Activity Milestones



```text

COMMITS\_100

COMMITS\_500

COMMITS\_1000



PRS\_MERGED\_10

PRS\_MERGED\_50



ISSUES\_CLOSED\_10

ISSUES\_CLOSED\_50



REVIEWS\_SUBMITTED\_25

REVIEWS\_SUBMITTED\_100

```



\---



\# SVG Requirements



The SVG should display:



```text

Achievement Count

```



Example:



```text

🏆 Achievements: 18

```



For MVP, do not render the full achievement list.



Display only:



```text

Count

```



\---



\# Historical Requirements



Each daily snapshot should contain:



```json

{

&#x20; "achievements": \[

&#x20;   "LEFT\_SHIRE",

&#x20;   "FIRST\_PR\_MERGED"

&#x20; ]

}

```



This enables:



\- Historical reconstruction

\- Achievement playback

\- Journey timeline generation



\---



\# Theme Compatibility



Achievement logic must remain generic.



The engine should never reference:



```text

MORIA

RIVENDELL

MOUNT\_DOOM

```



directly.



These values belong to the theme definition.



The engine only understands:



```text

Conditions

Rules

Unlock Evaluation

```



This allows future themes to define their own achievements.



Examples:



```text

Pirate Voyage

Space Odyssey

Cyberpunk Run

Witcher Path

```



without modifying engine code.



\---



\# Future Compatibility



The achievement system should support future extensions.



Examples:



\- Hidden achievements

\- Achievement rarity

\- Achievement icons

\- Achievement points

\- Theme-specific achievement art



These features are NOT part of MVP but the schema should be designed so they can be added without breaking existing achievement data.



\---



\# Success Criteria



The Achievement Engine is complete when:



✅ Achievements are data-driven



✅ Achievements unlock automatically



✅ Achievements persist forever



✅ Achievement events are generated



✅ Achievement history is stored



✅ Achievement count appears in the SVG



✅ Future themes can define custom achievements without engine changes

