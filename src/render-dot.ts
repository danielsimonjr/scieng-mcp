import { readInput, writeOutput, httpText, type FetchLike } from "./render-lib.ts";

export async function renderDotSource(dot: string, output: string, fetchImpl?: FetchLike): Promise<string> {
  const body = JSON.stringify({ graph: dot, layout: "dot", format: "svg" });
  const svg = await httpText("https://quickchart.io/graphviz", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    fetchImpl,
  });
  if (!svg.includes("<svg")) throw new Error("no SVG in response");
  writeOutput(output, svg);
  return svg;
}

export async function renderDot(input: string, output: string, fetchImpl?: FetchLike): Promise<string> {
  return renderDotSource(readInput(input), output, fetchImpl);
}
