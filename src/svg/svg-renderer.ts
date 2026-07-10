import type {
  RenderRouteLocation,
  RenderSourceRow,
  RenderViewModel,
  SvgRenderInput
} from "./types.js";

const FONT = "DejaVu Sans, sans-serif";

export function renderJourneySvg({ view }: SvgRenderInput): string {
  const body = view.layout === "compact" ? renderCompact(view) : renderStandard(view);
  const title = `${view.theme.name} Journey for ${view.profile.githubUser}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${view.width}" height="${view.height}" viewBox="0 0 ${view.width} ${view.height}" role="img" aria-labelledby="psrpg-title psrpg-desc">`,
    `<title id="psrpg-title">${escapeXml(title)}</title>`,
    `<desc id="psrpg-desc">${escapeXml(view.accessibleDescription)}</desc>`,
    body,
    `</svg>`
  ].join("\n");
}

function renderStandard(view: RenderViewModel): string {
  const palette = view.theme.palette;
  const sourceRows = view.sources?.slice(0, 4) ?? [];
  const status = view.progress.status === "COMPLETED" ? "Journey complete" : "Journey active";
  const destinationLabel =
    view.progress.status === "COMPLETED" ? "Final location" : "Next destination";
  const destination = view.progress.nextLocation ?? view.progress.currentLocation;
  const progressWidth = Math.round(720 * (view.progress.percent / 100));

  return [
    background(view, 16),
    `<g font-family="${FONT}">`,
    `<text x="40" y="36" fill="${palette.secondary}" font-size="12" font-weight="700" letter-spacing="1.2">${escapeXml(view.theme.name.toUpperCase())} JOURNEY</text>`,
    `<text x="40" y="70" fill="${palette.text}" font-size="26" font-weight="700">${escapeXml(truncate(view.profile.githubUser, 32))}</text>`,
    view.profile.title
      ? `<text x="40" y="94" fill="${palette.secondary}" font-size="15">${escapeXml(truncate(view.profile.title, 42))}</text>`
      : "",
    `<text x="1160" y="38" text-anchor="end" fill="${palette.primary}" font-size="13" font-weight="700">${status}</text>`,
    `<text x="1160" y="65" text-anchor="end" fill="${palette.secondary}" font-size="12">Started ${escapeXml(view.dates.started)}</text>`,
    `<text x="1160" y="85" text-anchor="end" fill="${palette.secondary}" font-size="12">${view.progress.status === "COMPLETED" ? `Completed ${escapeXml(view.dates.completed ?? view.dates.updated)}` : `Updated ${escapeXml(view.dates.updated)}`}</text>`,
    renderStandardSources(view, sourceRows),
    `<g transform="translate(390 112)">`,
    panel(palette, 0, 0, 770, 106),
    `<text x="22" y="27" fill="${palette.secondary}" font-size="12" font-weight="700">PROGRESS</text>`,
    `<text x="22" y="57" fill="${palette.text}" font-size="22" font-weight="700">${formatNumber(view.progress.awardedXP)} / ${formatNumber(view.progress.targetXP)} XP</text>`,
    `<text x="742" y="57" text-anchor="end" fill="${palette.primary}" font-size="24" font-weight="800">${formatPercent(view.progress.percent)}%</text>`,
    `<rect x="22" y="75" width="720" height="9" rx="4.5" fill="${palette.secondary}" opacity="0.2"/>`,
    `<rect x="22" y="75" width="${progressWidth}" height="9" rx="4.5" fill="${palette.primary}"/>`,
    `</g>`,
    `<g transform="translate(40 236)">`,
    `<text x="0" y="0" fill="${palette.secondary}" font-size="12" font-weight="700">CURRENT LOCATION</text>`,
    `<text x="0" y="26" fill="${palette.text}" font-size="18" font-weight="700">${escapeXml(truncate(view.progress.currentLocation, 30))}</text>`,
    `<text x="390" y="0" fill="${palette.secondary}" font-size="12" font-weight="700">${destinationLabel.toUpperCase()}</text>`,
    `<text x="390" y="26" fill="${palette.text}" font-size="18" font-weight="700">${escapeXml(truncate(destination, 30))}</text>`,
    view.achievements
      ? `<text x="1120" y="18" text-anchor="end" fill="${palette.secondary}" font-size="13"><tspan fill="${palette.text}" font-weight="800">${view.achievements.count}</tspan> achievements</text>`
      : "",
    `</g>`,
    renderJourneyMap(view),
    renderWarning(view, 40, 399),
    `</g>`
  ]
    .filter(Boolean)
    .join("\n");
}

function renderStandardSources(view: RenderViewModel, rows: RenderSourceRow[]): string {
  const palette = view.theme.palette;
  if (!view.sources) return "";
  return [
    `<g transform="translate(40 112)">`,
    panel(palette, 0, 0, 330, 106),
    `<text x="18" y="25" fill="${palette.secondary}" font-size="12" font-weight="700">TOP XP SOURCES</text>`,
    ...(rows.length > 0
      ? rows.map((row, index) => sourceRow(row, index, palette, 3))
      : [
          `<text x="18" y="58" fill="${palette.secondary}" font-size="13">No counted activity yet</text>`
        ]),
    `</g>`
  ].join("\n");
}

function sourceRow(
  row: RenderSourceRow,
  index: number,
  palette: RenderViewModel["theme"]["palette"],
  maxRows: number
): string {
  const y = 47 + index * (maxRows === 5 ? 17 : 18);
  return [
    `<text x="18" y="${y}" fill="${palette.text}" font-size="11" font-weight="700">${escapeXml(row.label)}</text>`,
    `<text x="190" y="${y}" text-anchor="end" fill="${palette.secondary}" font-size="11">${formatNumber(row.count)}</text>`,
    `<text x="312" y="${y}" text-anchor="end" fill="${palette.primary}" font-size="11" font-weight="800">+${formatNumber(row.earnedXP)} XP</text>`
  ].join("\n");
}

function renderJourneyMap(view: RenderViewModel): string {
  const palette = view.theme.palette;
  const routeStart = 55;
  const routeEnd = 1145;
  const routeY = 326;
  const route = createRouteScale(view.route, routeStart, routeEnd);
  const current = view.route.find((location) => location.status === "current") ?? view.route[0];
  const currentX = route.scaleX(current?.x ?? view.progress.characterX);
  const completed = view.progress.status === "COMPLETED";
  const labels = placeLabels(view.route, route.scaleX, routeStart, routeEnd);

  return [
    `<g data-region="journey-map">`,
    `<line x1="${routeStart}" y1="${routeY}" x2="${routeEnd}" y2="${routeY}" stroke="${palette.secondary}" stroke-width="5" stroke-linecap="round" opacity="0.35"${completed ? "" : ' stroke-dasharray="8 7"'}/>`,
    `<line x1="${routeStart}" y1="${routeY}" x2="${completed ? routeEnd : currentX}" y2="${routeY}" stroke="${palette.primary}" stroke-width="7" stroke-linecap="round"/>`,
    ...view.route.map((location) => {
      const x = route.scaleX(location.x);
      if (location.status === "current") {
        return `<path d="M ${x} ${routeY - 11} L ${x + 11} ${routeY} L ${x} ${routeY + 11} L ${x - 11} ${routeY} Z" fill="${palette.accent}" stroke="${palette.text}" stroke-width="2"/>`;
      }
      if (location.status === "future") {
        return `<circle cx="${x}" cy="${routeY}" r="6" fill="${palette.background}" stroke="${palette.secondary}" stroke-width="2"/>`;
      }
      return `<circle cx="${x}" cy="${routeY}" r="6" fill="${palette.primary}" stroke="${palette.background}" stroke-width="2"/><path d="M ${x - 3} ${routeY} l 2 2 l 4 -5" fill="none" stroke="${palette.background}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }),
    ...labels.map(
      (label) =>
        `<text x="${label.x}" y="${label.y}" text-anchor="middle" fill="${palette.text}" font-size="11" font-weight="700">${escapeXml(truncate(label.name, 18))}</text>`
    ),
    renderCharacter(view, currentX - 18, routeY - 62, 36, 45),
    `</g>`
  ].join("\n");
}

function renderCompact(view: RenderViewModel): string {
  const palette = view.theme.palette;
  const rows = view.sources?.slice(0, 5) ?? [];
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const dash = round(circumference * (view.progress.percent / 100));
  const destination = view.progress.nextLocation ?? view.progress.currentLocation;

  return [
    background(view, 12),
    `<g font-family="${FONT}">`,
    `<text x="18" y="28" fill="${palette.text}" font-size="17" font-weight="800">${escapeXml(truncate(view.profile.githubUser, 24))}</text>`,
    view.profile.title
      ? `<text x="18" y="46" fill="${palette.secondary}" font-size="11">${escapeXml(truncate(view.profile.title, 38))}</text>`
      : "",
    view.sources
      ? [
          `<g transform="translate(0 14)">`,
          ...(rows.length > 0
            ? rows.map((row, index) => compactSourceRow(row, index, palette))
            : [
                `<text x="18" y="74" fill="${palette.secondary}" font-size="11">No counted activity yet</text>`
              ]),
          `</g>`
        ].join("\n")
      : "",
    `<g transform="translate(420 84)">`,
    `<circle cx="0" cy="0" r="${radius}" fill="none" stroke="${palette.secondary}" stroke-width="8" opacity="0.2"/>`,
    `<circle cx="0" cy="0" r="${radius}" fill="none" stroke="${palette.primary}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${dash} ${round(circumference - dash)}" transform="rotate(-90)"/>`,
    `<text x="0" y="5" text-anchor="middle" fill="${palette.text}" font-size="17" font-weight="800">${formatPercent(view.progress.percent)}%</text>`,
    `<text x="0" y="22" text-anchor="middle" fill="${palette.secondary}" font-size="10">${formatCompactNumber(view.progress.awardedXP)}/${formatCompactNumber(view.progress.targetXP)} XP</text>`,
    `</g>`,
    view.achievements
      ? `<text x="420" y="143" text-anchor="middle" fill="${palette.secondary}" font-size="10">${view.achievements.count} achievements</text>`
      : "",
    `<line x1="18" y1="153" x2="477" y2="153" stroke="${palette.secondary}" opacity="0.25"/>`,
    `<text x="18" y="171" fill="${palette.secondary}" font-size="10">AT</text>`,
    `<text x="38" y="171" fill="${palette.text}" font-size="11" font-weight="700">${escapeXml(truncate(view.progress.currentLocation, 20))}</text>`,
    `<text x="245" y="171" fill="${palette.secondary}" font-size="10">${view.progress.status === "COMPLETED" ? "FINISHED" : "NEXT"}</text>`,
    `<text x="477" y="171" text-anchor="end" fill="${palette.text}" font-size="11" font-weight="700">${escapeXml(truncate(destination, 20))}</text>`,
    `<text x="18" y="188" fill="${palette.secondary}" font-size="10">Started ${escapeXml(view.dates.started)}</text>`,
    `<text x="477" y="188" text-anchor="end" fill="${palette.secondary}" font-size="10">${view.progress.status === "COMPLETED" ? `Completed ${escapeXml(view.dates.completed ?? view.dates.updated)}` : `Updated ${escapeXml(view.dates.updated)}`}</text>`,
    renderWarning(view, 330, 18),
    `</g>`
  ]
    .filter(Boolean)
    .join("\n");
}

function compactSourceRow(
  row: RenderSourceRow,
  index: number,
  palette: RenderViewModel["theme"]["palette"]
): string {
  const y = 50 + index * 17;
  return `<text x="18" y="${y}" fill="${palette.text}" font-size="10"><tspan font-weight="700">${escapeXml(row.label)}</tspan><tspan x="174" text-anchor="end" fill="${palette.secondary}">${formatNumber(row.count)}</tspan><tspan x="278" text-anchor="end" fill="${palette.primary}" font-weight="800">+${formatNumber(row.earnedXP)} XP</tspan></text>`;
}

function renderCharacter(
  view: RenderViewModel,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${view.theme.character.viewBox}" aria-hidden="true">${view.theme.character.content}</svg>`;
}

function renderWarning(view: RenderViewModel, x: number, y: number): string {
  if (view.activity.complete) return "";
  const palette = view.theme.palette;
  return `<g aria-label="Activity data incomplete"><circle cx="${x + 6}" cy="${y - 4}" r="6" fill="none" stroke="${palette.accent}" stroke-width="2"/><text x="${x + 6}" y="${y - 1}" text-anchor="middle" fill="${palette.accent}" font-size="10" font-weight="800">!</text><text x="${x + 18}" y="${y}" fill="${palette.secondary}" font-size="11">Activity data incomplete</text></g>`;
}

function background(view: RenderViewModel, radius: number): string {
  const palette = view.theme.palette;
  return [
    `<rect width="${view.width}" height="${view.height}" rx="${radius}" fill="${palette.background}"/>`,
    `<rect x="1" y="1" width="${view.width - 2}" height="${view.height - 2}" rx="${radius - 1}" fill="none" stroke="${palette.secondary}" stroke-opacity="0.35"/>`
  ].join("\n");
}

function panel(
  palette: RenderViewModel["theme"]["palette"],
  x: number,
  y: number,
  width: number,
  height: number
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="9" fill="${palette.text}" opacity="0.055" stroke="${palette.secondary}" stroke-width="1" stroke-opacity="0.3"/>`;
}

function placeLabels(
  locations: RenderRouteLocation[],
  scaleX: (x: number) => number,
  minX: number,
  maxX: number
): Array<{ name: string; x: number; y: number }> {
  const occupied: Array<{ left: number; right: number; y: number }> = [];
  const selected: Array<{ name: string; x: number; y: number }> = [];
  const candidates = locations
    .filter((location) => location.labelPriority !== undefined)
    .sort(
      (a, b) =>
        (a.labelPriority ?? 99) - (b.labelPriority ?? 99) || a.x - b.x || a.id.localeCompare(b.id)
    );

  for (const location of candidates) {
    const markerX = scaleX(location.x);
    const halfWidth = Math.min(58, Math.max(22, truncate(location.name, 18).length * 3.2));
    const x = Math.max(minX + halfWidth, Math.min(maxX - halfWidth, markerX));
    const ys = location.labelPriority && location.labelPriority <= 2 ? [357, 303] : [303, 357];
    const y = ys.find(
      (candidateY) =>
        !occupied.some(
          (box) =>
            Math.abs(box.y - candidateY) < 15 &&
            x - halfWidth < box.right + 8 &&
            x + halfWidth > box.left - 8
        )
    );
    if (y === undefined) continue;
    occupied.push({ left: x - halfWidth, right: x + halfWidth, y });
    selected.push({ name: location.name, x, y });
  }

  return selected.sort((a, b) => a.x - b.x || a.y - b.y);
}

function createRouteScale(
  locations: RenderRouteLocation[],
  start: number,
  end: number
): { scaleX: (x: number) => number } {
  const xs = locations.map((location) => location.x);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  return {
    scaleX: (x: number) =>
      max === min
        ? Math.round((start + end) / 2)
        : Math.round(start + ((x - min) / (max - min)) * (end - start))
  };
}

function truncate(value: string, maxCharacters: number): string {
  if (value.length <= maxCharacters) return value;
  return `${value.slice(0, Math.max(1, maxCharacters - 1)).trimEnd()}…`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  const compact = Math.round((value / 1000) * 10) / 10;
  return `${Number.isInteger(compact) ? compact.toFixed(0) : compact}k`;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
