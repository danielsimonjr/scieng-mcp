import { readInput, writeOutput, httpText, mapLimit, type FetchLike } from "./render-lib.ts";

/** One block of a LaTeX source. The label names the kind of block, and tex holds its source. */
export interface Block { label: string; tex: string; }

/**
 * Splits a LaTeX source into blocks.
 * A bare math source gives one block. A document gives one block for each equation, align, gather, multline, array, cases and display block.
 * Each block gets the \newcommand and \DeclareMathOperator definitions of the preamble. A document with no such block gives one block for the whole source.
 */
export function extractBlocks(texSource: string): Block[] {
  const isDocument = texSource.includes("\\documentclass") || texSource.includes("\\begin{document}");
  if (!isDocument) return [{ label: "math", tex: texSource.trim() }];

  let blocks: Block[] = [];
  const envRegex = /\\begin\{(align|equation|gather|multline|array|cases)\*?\}[\s\S]*?\\end\{\1\*?\}/g;
  let m: RegExpExecArray | null;
  while ((m = envRegex.exec(texSource)) !== null) blocks.push({ label: m[1], tex: m[0] });

  const displayRegex = /\\\[[\s\S]*?\\\]/g;
  while ((m = displayRegex.exec(texSource)) !== null) blocks.push({ label: "display", tex: m[0].slice(2, -2).trim() });

  const preamble = texSource.split("\\begin{document}")[0] || "";
  const newcmds = preamble.match(/\\(newcommand|DeclareMathOperator)\*?\{[^}]+\}(\[[^\]]*\])?\{[^}]+\}/g) || [];
  const cmdPrefix = newcmds.join("\n");
  if (cmdPrefix) blocks = blocks.map((b) => ({ ...b, tex: cmdPrefix + "\n" + b.tex }));

  if (blocks.length === 0) blocks.push({ label: "document", tex: texSource });
  return blocks;
}

/**
 * Reads the attributes of the first svg root tag of an SVG text.
 * Accepts a value in double quotes or in single quotes.
 */
function readRootAttributes(svg: string): Map<string, string> {
  const tagMatch = svg.match(/<svg\b[^>]*>/i);
  const tag = tagMatch === null ? "" : tagMatch[0];
  const attributes = new Map<string, string>();
  const attributePattern = /\s([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let attributeMatch: RegExpExecArray | null;
  while ((attributeMatch = attributePattern.exec(tag)) !== null) {
    attributes.set(attributeMatch[1] ?? "", attributeMatch[2] ?? attributeMatch[3] ?? "");
  }
  return attributes;
}

/**
 * Converts an SVG length to pt.
 * A pt value stays as it is. A px value and a unitless value are multiplied by 0.75.
 * An ex value, an em value and any other text return null, because the font size is unknown.
 */
function parseLengthToPt(value: string): number | null {
  const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(pt|px|ex|em)?$/i);
  if (match === null) return null;
  const amount = parseFloat(match[1] ?? "");
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "ex" || unit === "em") return null;
  if (unit === "pt") return amount;
  return amount * 0.75;
}

/**
 * Stacks SVG images in one vertical SVG document on a white background.
 * All sizes are in pt. The width and the height come from the root svg tag of each image.
 * When a width or a height is missing or unusable, the function uses the viewBox number of that dimension, read as pt.
 * When no viewBox is usable either, the width is 400 and the height is 50.
 */
export function combineSvgs(svgs: string[]): string {
  const resolve = (attributes: Map<string, string>, name: "width" | "height", viewBoxIndex: number, fallback: number): number => {
    const parsed = attributes.has(name) ? parseLengthToPt(attributes.get(name) ?? "") : null;
    if (parsed !== null) return parsed;
    const viewBox = attributes.get("viewBox");
    const fromViewBox = viewBox === undefined ? NaN : parseFloat(viewBox.trim().split(/[\s,]+/)[viewBoxIndex] ?? "");
    return Number.isFinite(fromViewBox) ? fromViewBox : fallback;
  };

  let totalHeight = 20;
  const info: { svg: string; w: number; h: number; y: number }[] = [];
  for (const svg of svgs) {
    const attributes = readRootAttributes(svg);
    const h = resolve(attributes, "height", 3, 50);
    const w = resolve(attributes, "width", 2, 400);
    info.push({ svg, w, h, y: totalHeight });
    totalHeight += h + 20;
  }
  const maxW = Math.max(...info.map((b) => b.w)) + 40;
  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${maxW}pt" height="${totalHeight}pt" viewBox="0 0 ${maxW} ${totalHeight}">`);
  parts.push(`<rect width="${maxW}" height="${totalHeight}" fill="white"/>`);
  for (const b of info) {
    const inner = b.svg
      .replace(/<\?xml[^?]*\?>\s*/, "")
      .replace(/<!DOCTYPE[^>]*>\s*/, "")
      .replace(/<svg([^>]*)>/, `<svg$1 x="20" y="${b.y}">`);
    parts.push(inner);
  }
  parts.push("</svg>");
  return parts.join("\n");
}

/**
 * Renders each block of a LaTeX source through the codecogs service, and writes the SVG to the output path.
 * The source goes to that service in the request URL. The default dpi is 200. Up to four blocks run at once.
 * The call lists the failed blocks in failures, in input order. The call rejects with "no blocks rendered" when no block renders. A failed block does not reject the call.
 */
export async function renderLatexSource(
  texSource: string,
  output: string,
  opts: { dpi?: number; fetchImpl?: FetchLike } = {},
): Promise<{ svg: string; failures: { index: number; label: string; message: string }[] }> {
  const { dpi = 200, fetchImpl } = opts;
  const blocks = extractBlocks(texSource);
  const results = await mapLimit(blocks, 4, async (block, i): Promise<{ svg: string | null; failure: { index: number; label: string; message: string } | null }> => {
    const url = `https://latex.codecogs.com/svg.image?\\dpi{${dpi}}${encodeURIComponent(block.tex)}`;
    try {
      const svg = await httpText(url, { headers: { "User-Agent": "Node.js" }, fetchImpl });
      if (svg.includes("<svg")) return { svg, failure: null };
      return { svg: null, failure: { index: i, label: block.label, message: "no SVG in response" } };
    } catch (err) {
      return { svg: null, failure: { index: i, label: block.label, message: (err as Error).message } };
    }
  });
  const valid = results.flatMap((r) => (r.svg === null ? [] : [r.svg]));
  const failures = results.flatMap((r) => (r.failure === null ? [] : [r.failure]));
  if (valid.length === 0) throw new Error("no blocks rendered");
  const out = valid.length === 1 ? valid[0] : combineSvgs(valid);
  writeOutput(output, out);
  return { svg: out, failures };
}

/**
 * Reads a LaTeX source file. Renders the file with renderLatexSource. Writes the SVG to the output path.
 * The function returns the SVG text.
 */
export async function renderLatex(
  input: string,
  output: string,
  opts: { dpi?: number; fetchImpl?: FetchLike } = {},
): Promise<string> {
  return (await renderLatexSource(readInput(input), output, opts)).svg;
}
