import { deflateSync } from "node:zlib";
import { readInput, writeOutput, httpText, type FetchLike } from "./render-lib.ts";

/** Encodes Mermaid source for the mermaid.ink URL: a JSON object with the code and the default theme, deflated and base64url-encoded. */
export function encodePako(mermaidCode: string): string {
  const json = JSON.stringify({ code: mermaidCode, mermaid: { theme: "default" } });
  return deflateSync(Buffer.from(json, "utf-8")).toString("base64url");
}

/**
 * Renders Mermaid source to SVG through the mermaid.ink service, and writes the SVG to the output path.
 * The source goes to that service in the request URL. The call throws when the response holds no SVG element.
 * The function returns the SVG text.
 */
export async function renderMermaidSource(code: string, output: string, fetchImpl?: FetchLike): Promise<string> {
  const url = `https://mermaid.ink/svg/pako:${encodePako(code)}`;
  const svg = await httpText(url, { fetchImpl });
  if (!svg.includes("<svg")) throw new Error("no SVG in response");
  writeOutput(output, svg);
  return svg;
}

/** Reads a Mermaid file, renders it with renderMermaidSource, and returns the SVG text. */
export async function renderMermaid(input: string, output: string, fetchImpl?: FetchLike): Promise<string> {
  return renderMermaidSource(readInput(input), output, fetchImpl);
}
