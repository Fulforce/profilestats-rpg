\# svg-spec.md



\# Purpose



The SVG Renderer produces the primary user-facing output of the GitHub Middle-earth RPG Engine.



Everything in the project ultimately exists to generate:



```text

output/journey.svg

```



The SVG should feel like:



```text

Part RPG character sheet

Part quest progress tracker

Part adventure map

```



The SVG must communicate progression at a glance.



A user should understand:



\- Where they are

\- How far they have travelled

\- What they have achieved



within 3 seconds of viewing the image.



\---



\# Design Philosophy



The SVG is not a statistics dashboard.



The SVG is an adventure map.



Statistics support the journey.



The journey is the focus.



Priority order:



```text

1\. Character Position

2\. Current Location

3\. Progress %

4\. Title

5\. XP

6\. Achievement Count

```

\---

\# MVP Visual Direction

The MVP renderer should feel more like a quest progress card than a stats dashboard.

The first visual read should be:

```text
Who am I?
Where am I?
Where am I going next?
How far through the journey am I?
```

Stats must support that read rather than compete with it.

\---

\# V2 MVP Layout

The preferred MVP layout is:

```text
Header:
  Theme name
  User + current title
  Journey Started label

Hero status:
  Current Location -> Next Location
  XP • Progress % • Achievement Count

Map:
  Completed route segment
  Future route segment
  All markers
  Selective labels
  Prominent character marker

Footer:
  Journey start date
  Last updated
```

\---

\# Journey Started Label

The SVG should include a small label showing when the journey began.

Example:

```text
Journey Started: 2026-01-01
```

This label should be secondary to the current location and progress.

\---

\# Label Density

All route markers should be visible.

Location labels should be selective to avoid overlap.

Always label:

```text
First location
Current location
Next location
Final location
```

For the Middle-earth MVP, also label recognizable route anchors when present:

```text
Rivendell
Lothlorien
Dead Marshes
Shelob's Lair
```

Additional labels may be shown when spacing allows.

Do not render every location label if it causes crowding.

\---

\# XP Source Summary

The top-middle area may be used to explain how the current XP was earned.

Display a compact contribution summary based on stored stats.

Example:

```text
XP Sources
9 commits + 1 PR merged + 1 repository
```

This should remain short and should not become a full dashboard.

\---

\# Route Progress Styling

The completed route segment must be visually distinct from the future route segment.

Recommended MVP styling:

```text
Completed route: theme primary color
Future route: muted secondary color
Current marker: accent color with subtle glow
Future markers: hollow or muted
```

\---

\# Character Prominence

The character should be the strongest visual element on the map.

The character should:

```text
Be larger than ordinary location markers
Sit above the route
Include a subtle "you are here" pointer or anchor
Move smoothly between route markers
```



\---



\# Core Principles



The SVG should be:



✅ Readable on GitHub



✅ Lightweight



✅ Static



✅ Themeable



✅ Mobile-friendly



✅ Visually informative



✅ Deterministic



The SVG should NOT:



❌ Require JavaScript



❌ Require animation



❌ Depend on external assets



❌ Depend on custom fonts



❌ Depend on a browser runtime



\---



\# Output File



Generated file:



```text

output/journey.svg

```



\---



\# SVG Dimensions



Recommended MVP size:



```text

1200 × 360

```



Alternative:



```text

1000 × 300

```



Renderer should support configurable sizing.



Default:



```json

{

&#x20; "width": 1200,

&#x20; "height": 360

}

```



\---



\# Layout Overview



The card consists of three zones:



```text

Header

↓



Stats Panel

↓



Journey Map

```



\---



\# Layout Structure



```text

┌──────────────────────────────────────────────┐



Joe the Adventurer



XP: 12,450

Progress: 52%

Location: Lothlorien

Achievements: 18



──────────────────────────────────────────────



🌳──🏘──🏔──⛏──🌲──🌋



&#x20;              🧙



──────────────────────────────────────────────



Next Destination: Amon Hen



└──────────────────────────────────────────────┘

```



\---



\# Section Breakdown



\## Header



Contains:



```text

Theme Name

GitHub Username

Current Title

```



Example:



```text

Middle-earth Journey



Joe the Adventurer

```



\---



\# Stats Section



Displays:



```text

XP

Progress %

Current Location

Next Location

Achievements

```



Example:



```text

XP: 12,450



Progress: 52%



Location: Lothlorien



Next: Amon Hen



Achievements: 18

```



\---



\# Progress Presentation



Progress should be visible numerically.



Example:



```text

52%

```



Optional future support:



```text

Subtle progress bar

```



Not required for MVP.



\---



\# Journey Map Section



The most important section.



Purpose:



Visualize the adventure.



\---



\# Journey Map Philosophy



The map is not a geographical simulation.



The map is a visual timeline.



Users should instantly understand:



```text

Past

Current

Future

```



along a single horizontal route.



\---



\# Horizontal Route System



Example:



```text

Shire ─ Bree ─ Rivendell ─ Moria ─ Mount Doom

```



Locations are rendered in order.



\---



\# Route Line



Render a continuous route line.



Example:



```text

────────────────────────────

```



or



```text

════════════════════════════

```



Theme determines styling.



\---



\# Location Markers



Every location should be represented visually.



Example:



```text

● Shire



● Bree



● Rivendell



● Moria



● Mount Doom

```



\---



\# Marker States



Locations may exist in one of three states.



\---



\# Completed



Player has passed location.



Example styling:



```text

Filled marker

Theme primary color

```



\---



\# Current



Player is currently at or between locations.



Example styling:



```text

Highlighted marker

Glow effect

Larger size

```



\---



\# Future



Not yet reached.



Example styling:



```text

Muted marker

Reduced opacity

```



\---



\# Character System



The character is the visual focus.



The character represents the player.



\---



\# Character Requirements



MVP:



```text

Single Hobbit sprite

```



Positioned along the route.



\---



\# Character Placement



Character position is determined using:



```text

Journey Progress

\+

Segment Progress

```



The character must move smoothly.



Do not snap exclusively to location markers.



\---



\# Position Calculation



Input:



```text

Current Location

Next Location

Segment Progress

```



Output:



```text

Interpolated X Coordinate

```



Example:



```text

Moria → Lothlorien



50% complete



Character appears half-way

between markers.

```



\---



\# Character Rendering



Supported approaches:



```text

SVG Paths

SVG Groups

SVG Symbols

```



Preferred:



```text

Reusable SVG Group

```



Example:



```svg

<g id="hobbit">

...

</g>

```



\---



\# Character Scale



Character must remain visible.



Recommended:



```text

48px - 72px height

```



depending on final SVG dimensions.



\---



\# Terrain Visualization



The route should tell a story.



Different locations should visually imply different biomes.



\---



\# Suggested Middle-earth Regions



```text

Shire

→ Grassland



Bree

→ Roads



Weathertop

→ Hills



Rivendell

→ Cliffs



Moria

→ Mountains



Lothlorien

→ Forest



Dead Marshes

→ Swamp



Mount Doom

→ Lava

```



\---



\# Terrain Rendering



Terrain may be rendered using:



```text

SVG paths

SVG shapes

Pattern fills

Theme assets

```



Terrain should remain simple in MVP.



Avoid visual clutter.



\---



\# Layer Structure



Recommended render order:



```text

Background

↓



Terrain

↓



Route Line

↓



Location Markers

↓



Character

↓



Labels

↓



Stat Overlays

```



\---



\# Labels



Location labels should appear beneath markers.



Example:



```text

Moria

```



Rules:



✅ Readable



✅ Consistent font size



✅ No overlap



✅ Truncation supported if required



\---



\# Typography



Use system-safe fonts only.



Example:



```css

font-family:

&#x20; sans-serif;

```



Avoid:



```text

External font loading

```



\---



\# Card Background



Theme controlled.



Example Middle-earth styling:



```text

Parchment

Soft terrain tones

Muted fantasy palette

```



Avoid:



```text

Dark-heavy backgrounds

```



GitHub pages are typically light themed.



\---



\# Achievement Display



MVP displays:



```text

Achievement Count

```



Example:



```text

🏆 18 Achievements

```



Do not render the full achievement list.



\---



\# Title Display



Display prominently.



Example:



```text

Joe the Adventurer

```



or



```text

⭐ Adventurer

```



\---



\# XP Display



Display total XP.



Example:



```text

12,450 XP

```



Use formatted values.



\---



\# Current Location Display



Display clearly.



Example:



```text

📍 Lothlorien

```



This should be visible without inspecting the map.



\---



\# Next Destination Display



Display next milestone.



Example:



```text

🎯 Amon Hen

```



This reinforces future progression.



\---



\# Completion State



When:



```text

XP >= targetXP

```



Render:



```text

Current Location:

Mount Doom



Progress:

100%

```



Optional visual enhancement:



```text

Golden marker

```



Not required for MVP.



\---



\# Responsive Behaviour



The SVG should gracefully scale.



Requirements:



✅ GitHub README compatible



✅ Browser compatible



✅ Works when width is constrained



SVG must use:



```text

viewBox

```



to support scaling.



\---



\# Accessibility



Every SVG must include:



```text

<title>

```



and



```text

<desc>

```



elements.



Example:



```xml

<title>

Joe's Middle-earth Journey

</title>



<desc>

Currently at Lothlorien with 12,450 XP and 52% journey progress.

</desc>

```



\---



\# Theme Requirements



The renderer should not contain:



```text

Moria

Rivendell

Mount Doom

```



hardcoded values.



All labels, locations, terrain definitions and assets must come from the active theme.



\---



\# Performance Requirements



SVG generation should complete within seconds.



The SVG should:



✅ Load instantly in GitHub



✅ Remain under reasonable file size



✅ Avoid excessively complex paths



✅ Avoid external dependencies



\---



\# Future Visual Enhancements



Not part of MVP:



```text

Animated route glow

Weather effects

Particle systems

Equipment overlays

Day/night variations

Achievement badge strip

Companion characters

Historical replay SVGs

```



The renderer should be structured so these can be added later.



\---



\# MVP Acceptance Criteria



The SVG Renderer is complete when:



✅ SVG is generated automatically



✅ Username is displayed



✅ Current title is displayed



✅ XP is displayed



✅ Progress % is displayed



✅ Current location is displayed



✅ Next location is displayed



✅ Achievement count is displayed



✅ Journey route is displayed



✅ Location markers are displayed



✅ Character sprite is displayed



✅ Character position reflects actual progress



✅ Theme assets drive rendering



✅ SVG is embeddable in GitHub README



✅ A user can understand their location within 3 seconds

