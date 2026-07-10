import type { ActivityMetric } from "../domain/types.js";
import type { ThemePalette, ThemeSvgAsset } from "../theme/types.js";

export type SvgLayout = "standard" | "compact";

export type RenderSourceRow = {
  metric: ActivityMetric;
  label: string;
  count: number;
  earnedXP: number;
};

export type RenderRouteLocation = {
  id: string;
  name: string;
  x: number;
  status: "reached" | "current" | "future";
  labelPriority?: number;
};

export type RenderViewModel = {
  layout: SvgLayout;
  width: 1200 | 495;
  height: 420 | 195;
  theme: {
    id: string;
    name: string;
    palette: ThemePalette;
    character: ThemeSvgAsset;
  };
  profile: {
    githubUser: string;
    title?: string;
  };
  progress: {
    status: "ACTIVE" | "COMPLETED";
    awardedXP: number;
    targetXP: number;
    percent: number;
    currentLocation: string;
    nextLocation?: string;
    characterX: number;
  };
  dates: {
    started: string;
    updated: string;
    completed?: string;
  };
  achievements?: {
    count: number;
    names: string[];
  };
  sources?: RenderSourceRow[];
  activity: {
    complete: boolean;
    warningSummary?: string;
  };
  route: RenderRouteLocation[];
  accessibleDescription: string;
};

export type SvgRenderInput = {
  view: RenderViewModel;
};
