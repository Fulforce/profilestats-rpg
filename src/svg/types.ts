import type { StoredState } from "../storage/types.js";
import type { Theme } from "../theme/types.js";

export type SvgRenderOptions = {
  width?: number;
  height?: number;
};

export type SvgRenderInput = {
  state: StoredState;
  theme: Theme;
  options?: SvgRenderOptions;
};
