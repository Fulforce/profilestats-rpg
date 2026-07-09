\# domain-model.md



\# Activity



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



\# XP Result



```ts

type XPResult = {

&#x20; rawXP: number;

&#x20; multiplier: number;

&#x20; finalXP: number;

};

```



\# Journey State



```ts

type JourneyState = {

&#x20; progressPercent: number;

&#x20; currentLocationId: string;

&#x20; currentLocationName: string;

&#x20; nextLocationId?: string;

&#x20; nextLocationName?: string;

};

```



\# Title



```ts

type Title = {

&#x20; id: string;

&#x20; name: string;

&#x20; requiredXP: number;

};

```



\# Achievement



```ts

type Achievement = {

&#x20; id: string;

&#x20; name: string;

&#x20; description: string;

&#x20; unlockedAt?: string;

};

```



\# Current State



```ts

type State = {

&#x20; xp: number;

&#x20; title: string;

&#x20; location: string;

&#x20; progressPercent: number;

&#x20; achievements: string\[];

&#x20; lastUpdated: string;

};

```



\# Daily Snapshot



```ts

type DailySnapshot = {

&#x20; date: string;

&#x20; xp: number;

&#x20; title: string;

&#x20; location: string;

&#x20; progressPercent: number;

&#x20; achievements: string\[];

};

```



\# Event



```ts

type Event = {

&#x20; date: string;

&#x20; type:

&#x20;   | "LOCATION\_UNLOCKED"

&#x20;   | "ACHIEVEMENT\_UNLOCKED"

&#x20;   | "TITLE\_UNLOCKED";

&#x20; value: string;

};

```

