import { join } from "node:path";
import { writeFilesTransaction, type FileArtifact } from "../io/transactional-files.js";
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
  const artifact = buildJourneySvgArtifact(state, theme, outputDir, options);
  await writeFilesTransaction([artifact]);
  return artifact.path;
}

export function buildJourneySvgArtifact(
  state: StoredState,
  theme: Theme,
  outputDir = "output",
  options?: SvgRenderOptions
): FileArtifact {
  const svg = renderJourneySvg({ state, theme, options });

  if (!svg.trim().startsWith("<svg") || !svg.trim().endsWith("</svg>")) {
    throw new Error("SVG renderer returned an invalid document.");
  }

  return {
    path: join(outputDir, "journey.svg"),
    content: `${svg}\n`
  };
}
