import type { StoredState } from "../storage/types.js";
import type { Theme, ThemeMapLocation } from "../theme/types.js";
import { defaultXPRules } from "../xp/xp-rules.js";
import type { SvgRenderInput } from "./types.js";

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 360;
const ROUTE_START_X = 80;
const ROUTE_END_X = 1120;
const ROUTE_Y = 246;

export function renderJourneySvg({ state, theme, options = {} }: SvgRenderInput): string {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const route = createRouteScale(theme, width);
  const characterX = route.scaleX(state.characterX);
  const progressBarWidth = Math.round((width - 160) * (state.progressPercent / 100));
  const completedRouteWidth = Math.max(0, characterX - route.startX);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escapeXml(theme.manifest.name)} Journey for ${escapeXml(state.metadata.githubUser)}</title>`,
    `<desc id="desc">Currently at ${escapeXml(state.currentLocation)} with ${state.xp} XP and ${state.progressPercent}% journey progress.</desc>`,
    `<rect width="${width}" height="${height}" rx="0" fill="${theme.palette.background}"/>`,
    renderTerrainBands(theme, route),
    renderHeader(state, theme),
    renderXpSourceSummary(state, theme),
    renderStats(state, theme),
    renderProgressBar(theme, progressBarWidth),
    renderRouteLine(theme, route, completedRouteWidth),
    renderMarkers(theme, state, route),
    renderCharacter(theme, characterX),
    renderFooter(state, theme, height),
    `</svg>`
  ].join("\n");
}

function renderHeader(state: StoredState, theme: Theme): string {
  return [
    `<text x="80" y="52" fill="${theme.palette.text}" font-family="Georgia, serif" font-size="26" font-weight="700">${escapeXml(theme.manifest.name)} Journey</text>`,
    `<text x="80" y="84" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="18">${escapeXml(state.metadata.githubUser)} the ${escapeXml(state.title)}</text>`,
    `<text x="1120" y="54" text-anchor="end" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="13" font-weight="700">Journey Started</text>`,
    `<text x="1120" y="78" text-anchor="end" fill="${theme.palette.text}" font-family="Arial, sans-serif" font-size="17" font-weight="700">${escapeXml(state.metadata.journeyStartDate)}</text>`
  ].join("\n");
}

function renderXpSourceSummary(state: StoredState, theme: Theme): string {
  const rows = getTopXpSources(state).slice(0, 3);

  return [
    `<g transform="translate(392 20)" font-family="Arial, sans-serif">`,
    `<rect x="0" y="0" width="416" height="80" rx="8" fill="${theme.palette.text}" opacity="0.08" stroke="${theme.palette.secondary}" stroke-width="1" stroke-opacity="0.28"/>`,
    `<text x="18" y="23" fill="${theme.palette.text}" font-size="14" font-weight="800">XP Sources</text>`,
    ...rows.map((row, index) => {
      const y = 43 + index * 17;

      return [
        `<circle cx="21" cy="${y - 4}" r="4" fill="${theme.palette.primary}" opacity="${index === 0 ? 1 : 0.65}"/>`,
        `<text x="34" y="${y}" fill="${theme.palette.secondary}" font-size="12" font-weight="700">${escapeXml(row.label)}</text>`,
        `<text x="392" y="${y}" text-anchor="end" fill="${theme.palette.text}" font-size="12" font-weight="800">+${formatNumber(row.xp)} XP</text>`
      ].join("\n");
    }),
    `</g>`
  ].join("\n");
}

function renderStats(state: StoredState, theme: Theme): string {
  const stats = [
    ["XP", formatNumber(state.xp)],
    ["Progress", `${state.progressPercent}%`],
    ["Location", state.currentLocation],
    ["Next", state.nextLocation ?? "Journey Complete"],
    ["Achievements", `${state.achievementCount}`]
  ];

  return [
    `<g font-family="Arial, sans-serif">`,
    ...stats.map(([label, value], index) => {
      const x = 80 + index * 210;
      return [
        `<text x="${x}" y="128" fill="${theme.palette.secondary}" font-size="13" font-weight="700">${label}</text>`,
        `<text x="${x}" y="154" fill="${theme.palette.text}" font-size="19" font-weight="700">${escapeXml(value)}</text>`
      ].join("\n");
    }),
    `</g>`
  ].join("\n");
}

function renderProgressBar(theme: Theme, progressBarWidth: number): string {
  return [
    `<rect x="80" y="178" width="1040" height="10" rx="5" fill="${theme.palette.secondary}" opacity="0.22"/>`,
    `<rect x="80" y="178" width="${progressBarWidth}" height="10" rx="5" fill="${theme.palette.primary}"/>`
  ].join("\n");
}

function renderRouteLine(
  theme: Theme,
  route: ReturnType<typeof createRouteScale>,
  completedRouteWidth: number
): string {
  return [
    `<line x1="${route.startX}" y1="${ROUTE_Y}" x2="${route.endX}" y2="${ROUTE_Y}" stroke="${theme.palette.secondary}" stroke-width="7" stroke-linecap="round" opacity="0.26"/>`,
    `<line x1="${route.startX}" y1="${ROUTE_Y}" x2="${route.startX + completedRouteWidth}" y2="${ROUTE_Y}" stroke="${theme.palette.primary}" stroke-width="7" stroke-linecap="round" opacity="0.92"/>`
  ].join("\n");
}

function renderMarkers(
  theme: Theme,
  state: StoredState,
  route: ReturnType<typeof createRouteScale>
): string {
  const currentLocationId = locationIdByName(theme, state.currentLocation);
  const visibleLabelIds = getVisibleLabelIds(theme, state);

  return [
    `<g font-family="Arial, sans-serif">`,
    ...theme.map.locations.map((location) => {
      const x = route.scaleX(location.x);
      const status = getMarkerStatus(location, state, currentLocationId);
      const radius = status === "current" ? 10 : 7;
      const fill =
        status === "future"
          ? theme.palette.background
          : status === "current"
            ? theme.palette.accent
            : theme.palette.primary;
      const opacity = status === "future" ? 0.55 : 1;
      const showLabel = visibleLabelIds.has(location.id);
      const labelY = locationLabelY(location, status);

      return [
        status === "current"
          ? `<circle cx="${x}" cy="${ROUTE_Y}" r="18" fill="${theme.palette.accent}" opacity="0.18"/>`
          : "",
        `<circle cx="${x}" cy="${ROUTE_Y}" r="${radius}" fill="${fill}" stroke="${theme.palette.primary}" stroke-width="3" opacity="${opacity}"/>`,
        showLabel
          ? `<text x="${x}" y="${labelY}" text-anchor="middle" fill="${theme.palette.text}" font-size="${status === "current" ? 13 : 11}" font-weight="${status === "current" ? 800 : 700}" opacity="${opacity}">${escapeXml(shortLocationName(location.name))}</text>`
          : ""
      ].filter(Boolean).join("\n");
    }),
    `</g>`
  ].join("\n");
}

function renderCharacter(theme: Theme, characterX: number): string {
  const x = characterX;
  const y = ROUTE_Y - 54;

  return [
    `<g transform="translate(${x} ${y})" aria-label="Current character position">`,
    `<circle cx="0" cy="0" r="24" fill="${theme.palette.accent}" opacity="0.2"/>`,
    `<path d="M 0 42 L -8 28 L 8 28 Z" fill="${theme.palette.accent}" stroke="${theme.palette.text}" stroke-width="2" stroke-linejoin="round"/>`,
    `<circle cx="0" cy="-10" r="11" fill="${theme.palette.accent}" stroke="${theme.palette.text}" stroke-width="2"/>`,
    `<path d="M -16 9 Q 0 -2 16 9 L 11 29 L -11 29 Z" fill="${theme.palette.primary}" stroke="${theme.palette.text}" stroke-width="2" stroke-linejoin="round"/>`,
    `<path d="M -18 -13 Q 0 -30 18 -13 Q 0 -18 -18 -13 Z" fill="${theme.palette.secondary}" stroke="${theme.palette.text}" stroke-width="2" stroke-linejoin="round"/>`,
    `</g>`
  ].join("\n");
}

function renderFooter(state: StoredState, theme: Theme, height: number): string {
  return [
    `<text x="80" y="${height - 38}" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="15">Next Destination: ${escapeXml(state.nextLocation ?? "Journey Complete")}</text>`,
    `<text x="1120" y="${height - 38}" text-anchor="end" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="13">Last updated ${escapeXml(state.lastUpdated)}</text>`
  ].join("\n");
}

function renderTerrainBands(theme: Theme, route: ReturnType<typeof createRouteScale>): string {
  const bands = theme.map.locations.map((location, index) => {
    const nextLocation = theme.map.locations[index + 1];
    const x = route.scaleX(location.x);
    const nextX = nextLocation ? route.scaleX(nextLocation.x) : route.endX;
    const width = Math.max(18, nextX - x);
    const fill = terrainFill(theme, location.terrain);

    return `<rect x="${x}" y="222" width="${width}" height="54" fill="${fill}" opacity="0.16"/>`;
  });

  return `<g aria-hidden="true">${bands.join("\n")}</g>`;
}

function createRouteScale(
  theme: Theme,
  width: number
): { scaleX: (x: number) => number; startX: number; endX: number } {
  const values = theme.map.locations.map((location) => location.x);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const start = width === DEFAULT_WIDTH ? ROUTE_START_X : Math.round(width * 0.067);
  const end = width === DEFAULT_WIDTH ? ROUTE_END_X : Math.round(width * 0.933);

  return {
    startX: start,
    endX: end,
    scaleX: (x: number) => {
      if (max === min) {
        return Math.round((start + end) / 2);
      }

      return Math.round(start + ((x - min) / (max - min)) * (end - start));
    }
  };
}

function getMarkerStatus(
  location: ThemeMapLocation,
  state: StoredState,
  currentLocationId: string | undefined
): "completed" | "current" | "future" {
  if (location.id === currentLocationId) {
    return "current";
  }

  return location.requiredXP <= state.xp ? "completed" : "future";
}

function locationIdByName(theme: Theme, name: string): string | undefined {
  return theme.map.locations.find((location) => location.name === name)?.id;
}

function getVisibleLabelIds(theme: Theme, state: StoredState): Set<string> {
  const landmarkIds = new Set(["RIVENDELL", "LOTHLORIEN", "DEAD_MARSHES", "SHELOBS_LAIR"]);
  const first = theme.map.locations[0];
  const final = theme.map.locations.at(-1);
  const current = theme.map.locations.find((location) => location.name === state.currentLocation);
  const next = theme.map.locations.find((location) => location.name === state.nextLocation);
  const landmarks = theme.map.locations.filter((location) => landmarkIds.has(location.id));
  const labels = [first, current, next, ...landmarks, final].filter(
    (location): location is ThemeMapLocation => Boolean(location)
  );

  return new Set(labels.map((location) => location.id));
}

function locationLabelY(location: ThemeMapLocation, status: "completed" | "current" | "future"): number {
  if (status === "current") {
    return ROUTE_Y + 44;
  }

  return location.requiredXP % 2 === 0 ? ROUTE_Y + 31 : ROUTE_Y + 47;
}

function shortLocationName(name: string): string {
  return name
    .replace("The ", "")
    .replace("Lothlorien", "Lothlorien")
    .replace("Shelob's Lair", "Shelob")
    .slice(0, 14);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function getTopXpSources(state: StoredState): Array<{ label: string; xp: number }> {
  const rows = [
    {
      label: "Commits",
      xp: state.stats.commits * defaultXPRules.commits
    },
    {
      label: "Pull requests",
      xp:
        state.stats.prsOpened * defaultXPRules.prsOpened +
        state.stats.prsMerged * defaultXPRules.prsMerged
    },
    {
      label: "Issues",
      xp:
        state.stats.issuesOpened * defaultXPRules.issuesOpened +
        state.stats.issuesClosed * defaultXPRules.issuesClosed
    },
    {
      label: "Reviews",
      xp: state.stats.reviewsSubmitted * defaultXPRules.reviewsSubmitted
    },
    {
      label: "Repositories",
      xp: state.stats.repositoriesCreated * defaultXPRules.repositoriesCreated
    },
    {
      label: "Releases",
      xp: state.stats.releasesPublished * defaultXPRules.releasesPublished
    },
    {
      label: "Streaks",
      xp: state.stats.streaks * defaultXPRules.streaks
    }
  ]
    .filter((row) => row.xp > 0)
    .sort((a, b) => b.xp - a.xp);

  return rows.length > 0 ? rows : [{ label: "No counted activity yet", xp: 0 }];
}

function terrainFill(theme: Theme, terrain: string | undefined): string {
  switch (terrain) {
    case "grasslands":
    case "forest":
    case "woodland":
      return theme.palette.primary;
    case "volcano":
    case "wasteland":
      return theme.palette.accent;
    case "swamp":
    case "cavern":
    case "mountains":
      return theme.palette.secondary;
    default:
      return theme.palette.secondary;
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
