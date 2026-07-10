import { writeFilesTransaction, type FileArtifact } from "../io/transactional-files.js";
import { renderJourneySvg } from "./svg-renderer.js";
import type { RenderViewModel } from "./types.js";
import { validateGeneratedSvg } from "./svg-validator.js";

export async function writeJourneySvg(
  view: RenderViewModel,
  outputPath = "output/journey.svg"
): Promise<string> {
  const artifact = buildJourneySvgArtifact(view, outputPath);
  await writeFilesTransaction([artifact]);
  return artifact.path;
}

export function buildJourneySvgArtifact(
  view: RenderViewModel,
  outputPath = "output/journey.svg"
): FileArtifact {
  const svg = renderJourneySvg({ view });
  validateGeneratedSvg(svg);
  return { path: outputPath, content: `${svg}\n` };
}
