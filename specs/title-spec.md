\# title-spec.md



\# Purpose



The Title Engine provides long-term identity and recognition for a player's journey.



Titles represent a player's overall progression through their adventure.



Unlike achievements, which celebrate specific milestones, titles communicate:



```text

Who have I become?

```



Titles should feel meaningful, aspirational, and easy to understand.



\---



\# Title Philosophy



Titles are earned through XP.



Titles do not depend on:



\- Achievements

\- Specific locations

\- Random chance

\- User choices



The relationship is:



```text

GitHub Activity

&#x20;     ↓

XP

&#x20;     ↓

Title

```



Titles are simply another interpretation of XP progression.



\---



\# Design Principles



Titles must be:



✅ Easy to understand



✅ Easy to unlock



✅ Permanently earned



✅ Deterministic



✅ Theme-driven



✅ Ordered sequentially



Titles must NOT:



❌ Be lost once earned



❌ Be manually selected



❌ Depend on randomness



❌ Depend on individual repositories



\---



\# Core Concept



A title is unlocked when the player's XP reaches a predefined threshold.



The highest unlocked title becomes the active title.



Example:



```text

XP = 12,500

```



Unlocked:



```text

Hobbit

Wanderer

Ranger

Adventurer

```



Active Title:



```text

Adventurer

```



\---



\# Title Definition



```ts

type TitleDefinition = {

&#x20; id: string;

&#x20; name: string;

&#x20; requiredXP: number;

};

```



\---



\# Storage Location



Title definitions are theme-specific.



Stored in:



```text

themes/middle-earth/titles.json

```



\---



\# Example Schema



```json

\[

&#x20; {

&#x20;   "id": "HOBBIT",

&#x20;   "name": "Hobbit",

&#x20;   "requiredXP": 0

&#x20; },

&#x20; {

&#x20;   "id": "WANDERER",

&#x20;   "name": "Wanderer",

&#x20;   "requiredXP": 1000

&#x20; }

]

```



\---



\# Title Evaluation Rules



The engine should:



```text

Load title definitions

↓

Sort by required XP

↓

Compare against current XP

↓

Identify highest unlocked title

↓

Return active title

```



\---



\# Active Title Logic



The active title is the highest title whose requirement has been satisfied.



Example:



```text

XP = 7,500

```



Titles:



```text

Hobbit      0

Wanderer    1,000

Ranger      5,000

Adventurer  10,000

```



Result:



```text

Ranger

```



\---



\# Initial Middle-earth Titles



Initial MVP title ladder:



```text

0        Hobbit

1,000    Wanderer

5,000    Ranger

10,000   Adventurer

20,000   Ring Bearer

35,000   Hero of the Fellowship

50,000   Legend of Middle-earth

```



These values are configurable.



The engine must not hardcode them.



\---



\# Title Unlock Events



When a player earns a new title for the first time:



Generate an event.



Example:



```json

{

&#x20; "date": "2026-07-09",



&#x20; "type": "TITLE\_UNLOCKED",



&#x20; "value": "RANGER"

}

```



Store in:



```text

events.json

```



\---



\# Event Rules



A title event may only occur once.



Example:



```text

RANGER

```



must never generate multiple events.



\---



\# Title State



The engine should return:



```ts

type TitleResult = {

&#x20; currentTitleId: string;

&#x20; currentTitleName: string;

&#x20; unlockedTitles: string\[];

&#x20; newlyUnlockedTitle?: string;

};

```



\---



\# State Storage Requirements



The active title must be stored in:



```text

state.json

```



Example:



```json

{

&#x20; "title": "Adventurer"

}

```



\---



\# Daily Snapshot Requirements



Every daily snapshot must include the active title.



Example:



```json

{

&#x20; "date": "2026-07-09",

&#x20; "title": "Adventurer"

}

```



This enables:



\- Historical replay

\- Journey playback

\- Title progression history



\---



\# SVG Requirements



The active title must be displayed prominently.



Example:



```text

Joe the Adventurer

```



or



```text

⭐ Title: Adventurer

```



The title should be one of the primary visual elements on the card.



\---



\# Character Evolution Support



Titles may later influence visual appearance.



Examples:



```text

Wanderer

→ small backpack



Ranger

→ cloak



Ring Bearer

→ ring glow



Hero of the Fellowship

→ banner

```



These visual upgrades are NOT required in MVP.



The title system should remain independent from rendering.



\---



\# Theme Compatibility



The Title Engine must not contain:



```text

Hobbit

Ranger

Ring Bearer

```



hardcoded in engine code.



All titles must be loaded from:



```text

themes/<theme>/titles.json

```



This enables future themes such as:



```text

Space Odyssey

Pirate Voyage

Cyberpunk Run

Witcher Path

```



without modifying engine logic.



\---



\# Future Compatibility



The schema should support future additions.



Possible future fields:



```json

{

&#x20; "id": "RANGER",

&#x20; "name": "Ranger",

&#x20; "requiredXP": 5000,

&#x20; "description": "A seasoned traveller.",

&#x20; "icon": "ranger.svg",

&#x20; "color": "#4CAF50"

}

```



These are not required in MVP.



\---



\# Success Criteria



The Title Engine is complete when:



✅ Titles are data-driven



✅ Titles unlock through XP only



✅ Highest unlocked title becomes active



✅ Title history is preserved



✅ Title unlock events are generated



✅ Title appears in SVG



✅ Future themes can define custom title ladders



✅ No engine changes are required to support new themes

