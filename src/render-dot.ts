// Renders DOT graph sources through the sciengjs engine and writes the image to disk.
// Engine errors, including code-carrying validation failures, propagate unchanged.
import { render } from "@danielsimonjr/sciengjs";
import { writeOutput } from "./render-lib.ts";
import { engineConfig } from "./engine-config.ts";

/** Draws a DOT source to an SVG or PNG file and returns the written byte count plus any engine warnings. */
export async function renderDotSource(
  source: string,
  output: string,
  format: "svg" | "png",
): Promise<{ bytes: number; warnings: string[] }> {
  const result = await render({ type: "dot", format, source }, engineConfig());
  writeOutput(output, result.bytes);
  return { bytes: result.bytes.byteLength, warnings: result.warnings };
}
