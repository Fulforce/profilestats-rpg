\# config-spec.md



\# Purpose



The Configuration System controls how the RPG Engine operates for an individual user.



Configuration should allow users to customize:



\- GitHub account

\- Active theme

\- Journey scope

\- Journey pace

\- Display options



without modifying application code.



Configuration acts as the primary interface between the user and the engine.



\---



\# Design Philosophy



Configuration should be:



✅ Human-readable



✅ Easy to edit



✅ Version controlled



✅ Theme-independent



✅ Backwards compatible



✅ Fork-friendly



Configuration should NOT require:



❌ Code changes



❌ Recompilation



❌ Environment variable editing for normal usage



\---



\# Configuration File



Location:



```text

config.yml

```



Repository root.



\---



\# Example Configuration



```yaml

githubUser: "octocat"



theme: "middle-earth"



journey:

&#x20; startDate: "2026-01-01"

&#x20; targetXP: 50000

&#x20; xpMultiplier: 1.0



display:

&#x20; showStats: true

&#x20; showTitle: true

&#x20; showAchievements: true

```



\---



\# Configuration Schema



\## githubUser



Required.



GitHub username whose activity will be analyzed.



Example:



```yaml

githubUser: "octocat"

```



Validation:



```text

Required

Must be a valid GitHub username

Must not be empty

```



\---



\# theme



Defines the active theme.



Example:



```yaml

theme: "middle-earth"

```



Validation:



```text

Required

Theme directory must exist

Theme must pass validation

```



Default:



```yaml

theme: "middle-earth"

```



\---



\# Journey Configuration



The journey section controls progression.



\---



\# journey.startDate



Defines the earliest date from which activity is counted.



Example:



```yaml

journey:

&#x20; startDate: "2026-01-01"

```



Purpose:



```text

Start a brand new journey

Use a 6 month lookback

Use a 1 year lookback

Use complete GitHub history

```



Validation:



```text

Required

Must be a valid ISO date

Cannot be in the future

```



Examples:



```yaml

startDate: "2026-07-09"

```



Fresh journey.



```yaml

startDate: "2025-07-09"

```



One-year lookback.



```yaml

startDate: "2020-01-01"

```



Multi-year lookback.



\---



\# journey.targetXP



Defines how much XP is required to complete the active journey.



Example:



```yaml

journey:

&#x20; targetXP: 50000

```



Meaning:



```text

50000 XP

=

Journey Completion

```



Purpose:



```text

Control journey length

```



Validation:



```text

Required

Integer

Greater than zero

```



Recommended default:



```yaml

targetXP: 50000

```



\---



\# journey.xpMultiplier



Applies a multiplier to calculated XP.



Example:



```yaml

journey:

&#x20; xpMultiplier: 1.5

```



Calculation:



```text

Final XP

=

Raw XP × xpMultiplier

```



Purpose:



```text

Increase progression speed

Decrease progression speed

```



Validation:



```text

Required

Greater than zero

```



Examples:



```yaml

xpMultiplier: 0.5

```



Slower progression.



```yaml

xpMultiplier: 1.0

```



Normal progression.



```yaml

xpMultiplier: 2.0

```



Faster progression.



\---



\# Display Configuration



Controls visual rendering.



Display settings never affect progression.



\---



\# display.showStats



Controls XP and progression statistics.



Example:



```yaml

display:

&#x20; showStats: true

```



Default:



```yaml

showStats: true

```



\---



\# display.showTitle



Controls title visibility.



Example:



```yaml

display:

&#x20; showTitle: true

```



Default:



```yaml

showTitle: true

```



\---



\# display.showAchievements



Controls achievement count visibility.



Example:



```yaml

display:

&#x20; showAchievements: true

```



Default:



```yaml

showAchievements: true

```



\---



\# Full Default Configuration



The engine should assume:



```yaml

githubUser: ""



theme: "middle-earth"



journey:

&#x20; startDate: "2026-01-01"

&#x20; targetXP: 50000

&#x20; xpMultiplier: 1.0



display:

&#x20; showStats: true

&#x20; showTitle: true

&#x20; showAchievements: true

```



Required values must still be validated.



\---



\# Validation Rules



The configuration loader must validate:



```text

githubUser exists



theme exists



journey.startDate exists



journey.targetXP > 0



journey.xpMultiplier > 0

```



\---



\# Validation Failure Example



Example invalid configuration:



```yaml

githubUser: ""



journey:

&#x20; targetXP: -100

```



Expected result:



```text

Configuration validation failed.



githubUser is required.



targetXP must be greater than zero.

```



Execution should stop.



\---



\# Configuration Contract



The configuration loader should return:



```ts

type Config = {

&#x20; githubUser: string;



&#x20; theme: string;



&#x20; journey: {

&#x20;   startDate: string;

&#x20;   targetXP: number;

&#x20;   xpMultiplier: number;

&#x20; };



&#x20; display: {

&#x20;   showStats: boolean;

&#x20;   showTitle: boolean;

&#x20;   showAchievements: boolean;

&#x20; };

};

```



\---



\# State Metadata Requirements



Configuration values should be stored in:



```text

data/state.json

```



Metadata section.



Example:



```json

{

&#x20; "metadata": {

&#x20;   "theme": "middle-earth",

&#x20;   "githubUser": "octocat",

&#x20;   "journeyStartDate": "2026-01-01",

&#x20;   "targetXP": 50000,

&#x20;   "xpMultiplier": 1.0

&#x20; }

}

```



This improves:



```text

Debugging

Reporting

Replay capabilities

Tooling

```



\---



\# Future Compatibility



The schema should allow future additions.



Examples:



```yaml

theme: "space-odyssey"



journey:

&#x20; startDate: "2026-01-01"

&#x20; targetXP: 75000

&#x20; xpMultiplier: 1.25



display:

&#x20; showStats: true



renderer:

&#x20; width: 1400

&#x20; height: 400

```



Future fields should be additive and backwards compatible.



\---



\# Non-Goals



Configuration is not responsible for:



```text

XP Calculation

Achievement Logic

Journey Progression

Storage

GitHub API Collection

SVG Rendering

```



Configuration only provides input values to those systems.



\---



\# MVP Acceptance Criteria



The Configuration System is complete when:



✅ Configuration is loaded from config.yml



✅ GitHub username can be configured



✅ Theme can be selected



✅ Journey start date can be configured



✅ Journey target XP can be configured



✅ XP multiplier can be configured



✅ Display options can be configured



✅ Validation errors are descriptive



✅ Invalid configuration blocks execution



✅ Configuration is reusable across future themes



✅ No code changes are required for normal user customization

