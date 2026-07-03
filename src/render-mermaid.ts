import { deflateSync } from "node:zlib";
import { readInput, writeOutput, httpText, type FetchLike } from "./render-lib.ts";

export function encodePako(mermaidCode: string): string {
  const json = JSON.stringify({ code: mermaidCode, mermaid: { theme: "default" } });
  return deflateSync(Buffer.from(json, "utf-8")).toString("base64url");
}

export async function renderMermaidSource(code: string, output: string, fetchImpl?: FetchLike): Promise<string> {
  const url = `https://mermaid.ink/svg/pako:${encodePako(code)}`;
  const svg = await httpText(url, { fetchImpl });
  if (!svg.includes("<svg")) throw new Error("no SVG in response");
  writeOutput(output, svg);
  return svg;
}

export async function renderMermaid(input: string, output: string, fetchImpl?: FetchLike): Promise<string> {
  return renderMermaidSource(readInput(input), output, fetchImpl);
}
