// Renders any input type and output format that the sciengjs engine supports, and writes the bytes to disk.
// The engine decides which pairs exist. An unsupported pair rejects with E_UNSUPPORTED. The error passes through unchanged.
import { render, type InputType, type OutputFormat, type RenderOptions } from "@danielsimonjr/sciengjs";
import { writeOutput } from "./render-lib.ts";
import { engineConfig } from "./engine-config.ts";

/** The result of one generic render: the written path, its byte count and the engine's metadata. */
export interface AnyRenderResult {
  path: string;
  bytes: number;
  mime: string;
  backend: string;
  warnings: string[];
}

/** Renders a Plotly JSON source to an SVG string through the engine. Used for static plotly blocks of render_html. */
export async function renderPlotSvg(source: string): Promise<string> {
  const result = await render({ type: "plot", format: "svg", source }, engineConfig());
  return new TextDecoder().decode(result.bytes);
}

/** Renders a source of the given input type to the given format, writes the file, and returns the engine's metadata. */
export async function renderAny(
  type: InputType,
  format: OutputFormat,
  source: string,
  output: string,
  options?: RenderOptions,
): Promise<AnyRenderResult> {
  const req = options === undefined ? { type, format, source } : { type, format, source, options };
  const result = await render(req, engineConfig());
  writeOutput(output, result.bytes);
  return { path: output, bytes: result.bytes.byteLength, mime: result.mime, backend: result.backend, warnings: result.warnings };
}
