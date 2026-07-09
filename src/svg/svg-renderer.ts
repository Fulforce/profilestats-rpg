import type { StoredState } from "../storage/types.js";
import type { Theme, ThemeMapLocation } from "../theme/types.js";
import type { SvgRenderInput } from "./types.js";

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 360;
const ROUTE_START_X = 80;
const ROUTE_END_X = 1120;
const ROUTE_Y = 245;

export function renderJourneySvg({ state, theme, options = {} }: SvgRenderInput): string {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const route = createRouteScale(theme, width);
  const characterX = route.scaleX(state.characterX);
  const progressBarWidth = Math.round((width - 160) * (state.progressPercent / 100));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escapeXml(theme.manifest.name)} Journey for ${escapeXml(state.metadata.githubUser)}</title>`,
    `<desc id="desc">Currently at ${escapeXml(state.currentLocation)} with ${state.xp} XP and ${state.progressPercent}% journey progress.</desc>`,
    `<rect width="${width}" height="${height}" rx="0" fill="${theme.palette.background}"/>`,
    renderHeader(state, theme),
    renderStats(state, theme),
    renderProgressBar(theme, progressBarWidth),
    renderRouteLine(theme, width),
    renderMarkers(theme, state, route),
    renderCharacter(theme, characterX),
    renderFooter(state, theme, height),
    `</svg>`
  ].join("\n");
}

function renderHeader(state: StoredState, theme: Theme): string {
  return [
    `<text x="80" y="52" fill="${theme.palette.text}" font-family="Georgia, serif" font-size="26" font-weight="700">${escapeXml(theme.manifest.name)} Journey</text>`,
    `<text x="80" y="84" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="18">${escapeXml(state.metadata.githubUser)} the ${escapeXml(state.title)}</text>`
  ].join("\n");
}

function renderStats(state: StoredState, theme: Theme): string {
  const stats = [
    ["XP", formatNumber(state.xp)],
    ["Progress", `${state.progressPercent}%`],
    ["Location", state.currentLocation],
    ["Next", state.nextLocation ?? "Journey Complete"],
    ["Achievements", String(state.achievementCount)]
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
    `<rect x="80" y="178" width="1040" height="10" rx="5" fill="${theme.palette.secondary}" opacity="0.24"/>`,
    `<rect x="80" y="178" width="${progressBarWidth}" height="10" rx="5" fill="${theme.palette.primary}"/>`
  ].join("\n");
}

function renderRouteLine(theme: Theme, width: number): string {
  return [
    `<line x1="80" y1="${ROUTE_Y}" x2="${width - 80}" y2="${ROUTE_Y}" stroke="${theme.palette.secondary}" stroke-width="5" stroke-linecap="round" opacity="0.35"/>`
  ].join("\n");
}

function renderMarkers(
  theme: Theme,
  state: StoredState,
  route: ReturnType<typeof createRouteScale>
): string {
  const currentLocationId = locationIdByName(theme, state.currentLocation);

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
      const labelY = locationLabelY(location);

      return [
        status === "current"
          ? `<circle cx="${x}" cy="${ROUTE_Y}" r="18" fill="${theme.palette.accent}" opacity="0.18"/>`
          : "",
        `<circle cx="${x}" cy="${ROUTE_Y}" r="${radius}" fill="${fill}" stroke="${theme.palette.primary}" stroke-width="3" opacity="${opacity}"/>`,
        `<text x="${x}" y="${labelY}" text-anchor="middle" fill="${theme.palette.text}" font-size="11" opacity="${opacity}">${escapeXml(shortLocationName(location.name))}</text>`
      ].filter(Boolean).join("\n");
    }),
    `</g>`
  ].join("\n");
}

function renderCharacter(theme: Theme, characterX: number): string {
  const x = characterX;
  const y = ROUTE_Y - 42;

  return [
    `<g transform="translate(${x} ${y})" aria-label="Current character position">`,
    `<circle cx="0" cy="0" r="18" fill="${theme.palette.accent}" opacity="0.2"/>`,
    `<circle cx="0" cy="-8" r="9" fill="${theme.palette.accent}" stroke="${theme.palette.text}" stroke-width="2"/>`,
    `<path d="M -13 8 Q 0 -1 13 8 L 9 23 L -9 23 Z" fill="${theme.palette.primary}" stroke="${theme.palette.text}" stroke-width="2" stroke-linejoin="round"/>`,
    `<path d="M -15 -10 Q 0 -25 15 -10 Q 0 -15 -15 -10 Z" fill="${theme.palette.secondary}" stroke="${theme.palette.text}" stroke-width="2" stroke-linejoin="round"/>`,
    `</g>`
  ].join("\n");
}

function renderFooter(state: StoredState, theme: Theme, height: number): string {
  return [
    `<text x="80" y="${height - 38}" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="15">Next Destination: ${escapeXml(state.nextLocation ?? "Journey Complete")}</text>`,
    `<text x="1120" y="${height - 38}" text-anchor="end" fill="${theme.palette.secondary}" font-family="Arial, sans-serif" font-size="13">Last updated ${escapeXml(state.lastUpdated)}</text>`
  ].join("\n");
}

function createRouteScale(theme: Theme, width: number): { scaleX: (x: number) => number } {
  const values = theme.map.locations.map((location) => location.x);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const start = width === DEFAULT_WIDTH ? ROUTE_START_X : Math.round(width * 0.067);
  const end = width === DEFAULT_WIDTH ? ROUTE_END_X : Math.round(width * 0.933);

  return {
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

function locationLabelY(location: ThemeMapLocation): number {
  return location.requiredXP % 2 === 0 ? ROUTE_Y + 32 : ROUTE_Y + 48;
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

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
