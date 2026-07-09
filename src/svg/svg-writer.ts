import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StoredState } from "../storage/types.js";
import type { Theme } from "../theme/types.js";
import { renderJourneySvg } from "./svg-renderer.js";
import type { SvgRenderOptions } from "./types.js";

export async function writeJourneySvg(
  state: StoredState,
  theme: Theme,
  outputDir = "output",
  options?: SvgRenderOptions
): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const svg = renderJourneySvg({ state, theme, options });
  const outputPath = join(outputDir, "journey.svg");
  await writeFile(outputPath, `${svg}\n`, "utf8");
  return outputPath;
}
