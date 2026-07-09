# Architecture

The engine is built as a sequence of deterministic layers.

```text
Configuration
↓
Theme loading
↓
GitHub activity collection
↓
XP calculation
↓
Journey calculation
↓
Title evaluation
↓
Achievement evaluation
↓
Storage
↓
SVG rendering
```

## Core Contracts

`Activity` is the normalized GitHub activity model.

`XPResult` converts activity into raw and final XP.

`JourneyState` converts XP into progress, current location, next location, and character position.

`TitleResult` identifies the active title and newly unlocked title events.

`AchievementResult` identifies unlocked achievements and achievement events.

`StoredState` is the current persisted snapshot used by the SVG renderer.

## Theme Boundary

The engine should not know about specific worlds such as Middle-earth, pirates, or space travel.

Themes own:

- route locations
- titles
- achievements
- palette
- visual assets

The engine owns:

- validation
- XP calculation
- progress calculation
- event generation
- storage
- rendering mechanics

## Generated Output

`npm run update` writes:

```text
data/state.json
data/daily-log.json
data/events.json
output/journey.svg
```

These files are ignored in the host repository so the default branch stays fork-friendly.
