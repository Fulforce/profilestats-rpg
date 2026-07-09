\# theme-spec.md



\# Purpose



The Theme System separates game content from game logic.



The engine should understand:



```text

XP

Progress

Titles

Achievements

Routes

Rendering

```



but should not understand:



```text

Middle-earth

Pirates

Space Travel

Witchers

Cyberpunk Cities

```



Themes provide the content.



The engine provides the mechanics.



\---



\# Theme Philosophy



The RPG Engine must be theme-agnostic.



Themes should be fully interchangeable.



Adding a new theme should require:



```text

Create new theme folder

Add configuration files

Add assets

```



Without modifying:



```text

XP Engine

Journey Engine

Storage Engine

Title Engine

Achievement Engine

```



\---



\# Theme Responsibilities



A theme is responsible for defining:



✅ Journey route



✅ Route thresholds



✅ Visual assets



✅ Titles



✅ Achievements



✅ Colors



✅ Labels



✅ Map styling



✅ Character appearance



Themes are NOT responsible for:



❌ XP calculations



❌ Storage



❌ GitHub API access



❌ Progress calculations



❌ Event generation



\---



\# Theme Structure



Each theme exists inside:



```text

themes/

```



Example:



```text

themes/

└── middle-earth/

```



\---



\# Theme Directory Structure



```text

themes/

└── middle-earth/

&#x20;   ├── theme.json

&#x20;   ├── map.json

&#x20;   ├── titles.json

&#x20;   ├── achievements.json

&#x20;   ├── palette.json

&#x20;   └── assets/

&#x20;       ├── sprites/

&#x20;       ├── terrain/

&#x20;       ├── icons/

&#x20;       └── backgrounds/

```



\---



\# Theme Loading



Only one theme may be active at a time.



Theme is selected from configuration.



Example:



```yaml

theme: "middle-earth"

```



The engine loads:



```text

themes/middle-earth/

```



and uses all resources within that directory.



\---



\# Theme Manifest



Every theme must contain:



```text

theme.json

```



The manifest describes the theme.



\---



\# theme.json Schema



```json

{

&#x20; "id": "middle-earth",



&#x20; "name": "Middle-earth",



&#x20; "version": "1.0.0",



&#x20; "author": "Theme Author",



&#x20; "description": "Journey from The Shire to Mount Doom.",



&#x20; "defaultTargetXP": 50000,



&#x20; "startingTitle": "HOBBIT"

}

```



\---



\# Required Files



The following files are mandatory:



```text

theme.json

map.json

titles.json

achievements.json

palette.json

```



Theme loading should fail if required files are missing.



\---



\# Map Definition



Stored in:



```text

map.json

```



Contains:



```text

Locations

Thresholds

Map layout

Render positions

Terrain definitions

```



\---



\# Example Map Schema



```json

{

&#x20; "targetXP": 50000,



&#x20; "locations": \[

&#x20;   {

&#x20;     "id": "SHIRE",

&#x20;     "name": "The Shire",



&#x20;     "requiredXP": 0,



&#x20;     "x": 50,



&#x20;     "terrain": "grasslands"

&#x20;   }

&#x20; ]

}

```



\---



\# Location Requirements



Every location must define:



```json

{

&#x20; "id": "UNIQUE\_ID",



&#x20; "name": "Display Name",



&#x20; "requiredXP": 0,



&#x20; "x": 0

}

```



Optional:



```json

{

&#x20; "terrain": "forest",



&#x20; "description": "Ancient woodland"

}

```



\---



\# Titles Definition



Stored in:



```text

titles.json

```



\---



\# Example



```json

\[

&#x20; {

&#x20;   "id": "HOBBIT",

&#x20;   "name": "Hobbit",

&#x20;   "requiredXP": 0

&#x20; },

&#x20; {

&#x20;   "id": "RANGER",

&#x20;   "name": "Ranger",

&#x20;   "requiredXP": 5000

&#x20; }

]

```



\---



\# Achievement Definition



Stored in:



```text

achievements.json

```



Achievements are entirely theme owned.



Themes define:



```text

Name

Description

Conditions

Categories

```



\---



\# Example



```json

{

&#x20; "id": "ENTERED\_MORIA",



&#x20; "name": "Into Darkness",



&#x20; "description": "Enter the Mines of Moria.",



&#x20; "category": "JOURNEY",



&#x20; "condition": {

&#x20;   "type": "location",

&#x20;   "value": "MORIA"

&#x20; }

}

```



\---



\# Visual Identity



Themes may define colors in:



```text

palette.json

```



\---



\# Example



```json

{

&#x20; "background": "#FDF6E3",



&#x20; "primary": "#2E7D32",



&#x20; "secondary": "#8D6E63",



&#x20; "accent": "#FFB300",



&#x20; "text": "#222222"

}

```



\---



\# Rendering Requirements



The SVG renderer must use theme assets instead of hardcoded visuals.



Examples:



```text

Markers

Icons

Sprites

Terrain

Background Elements

```



should come from the active theme.



\---



\# Asset Structure



```text

assets/



sprites/

terrain/

icons/

backgrounds/

```



\---



\# Sprites



Character visuals.



Examples:



```text

hobbit.svg

ranger.svg

hero.svg

```



For MVP:



Only one sprite is required.



Example:



```text

hobbit.svg

```



\---



\# Terrain Assets



Used to visually distinguish sections of the route.



Examples:



```text

grasslands.svg

forest.svg

mountains.svg

swamp.svg

volcano.svg

```



\---



\# Icons



Visual indicators.



Examples:



```text

achievement.svg

title.svg

location.svg

```



\---



\# Background Assets



Large decorative elements.



Examples:



```text

mountains.svg

trees.svg

clouds.svg

castle.svg

```



These assets are optional for MVP.



\---



\# Middle-earth Theme Definition



The official MVP ships with:



```text

middle-earth

```



as the only theme.



\---



\# Middle-earth Route



```text

The Shire

↓

Bree

↓

Weathertop

↓

Rivendell

↓

Moria

↓

Lothlórien

↓

Amon Hen

↓

Emyn Muil

↓

Dead Marshes

↓

Black Gate

↓

Ithilien

↓

Cirith Ungol

↓

Shelob's Lair

↓

Mount Doom

```



\---



\# Middle-earth Terrain Progression



Suggested visual regions:



```text

The Shire

→ Grasslands



Bree

→ Roads



Weathertop

→ Hills



Rivendell

→ Cliffs



Moria

→ Mountains



Lothlórien

→ Forest



Dead Marshes

→ Swamp



Mount Doom

→ Lava

```



The route should visually evolve as the user travels.



\---



\# SVG Theme Contract



Every theme must provide enough information for the renderer to determine:



```text

Current Location

Next Location

Character Position

Terrain Segment

Route Markers

Colors

Typography

```



The renderer should never require hardcoded theme values.



\---



\# Configuration



Users select themes using:



```yaml

theme: "middle-earth"

```



If omitted:



```text

middle-earth

```



becomes the default theme.



\---



\# Validation Rules



Theme Loader must validate:



✅ Theme exists



✅ Required files exist



✅ Map has locations



✅ Titles have thresholds



✅ Achievements have IDs



✅ Theme metadata exists



If validation fails:



```text

Stop execution

Emit useful error

```



\---



\# Future Theme Examples



Potential future themes:



```text

Space Odyssey

Pirate Voyage

Cyberpunk City Run

The Witcher Path

```



Each theme should be implementable without modifying engine code.



\---



\# Theme Compatibility Guarantee



A valid theme must be capable of replacing Middle-earth entirely.



The engine must never contain references such as:



```text

Moria

Rivendell

Mount Doom

Hobbit

Ring Bearer

```



All thematic content belongs exclusively to the theme layer.



\---



\# MVP Requirements



The MVP Theme System is complete when:



✅ Middle-earth loads from a theme folder



✅ Route comes from map.json



✅ Titles come from titles.json



✅ Achievements come from achievements.json



✅ Colors come from palette.json



✅ Assets are theme-owned



✅ Engine contains no Middle-earth-specific logic



✅ A future theme can be added without changing engine code

