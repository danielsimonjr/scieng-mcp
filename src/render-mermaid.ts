// Renders Mermaid sources through the sciengjs engine and writes the image to disk.
// Engine errors, including the E_STAGE_MISSING error of a type that needs the browser, pass through unchanged.
import { render } from "@danielsimonjr/sciengjs";
import { writeOutput } from "./render-lib.ts";
import { engineConfig } from "./engine-config.ts";

export const MERMAID_FORMATS = ["svg", "png", "pdf"] as const;
/** The output formats of a Mermaid render. */
export type MermaidFormat = (typeof MERMAID_FORMATS)[number];

/**
 * Draws a Mermaid source to an SVG, PNG or PDF file and returns the written byte count and any engine warnings.
 * Class, state and sequence diagrams need no browser. Other diagram types need SCIENG_BROWSER.
 */
export async function renderMermaidSource(
  source: string,
  output: string,
  format: MermaidFormat,
): Promise<{ bytes: number; warnings: string[] }> {
  const result = await render({ type: "mermaid", format, source }, engineConfig());
  writeOutput(output, result.bytes);
  return { bytes: result.bytes.byteLength, warnings: result.warnings };
}
