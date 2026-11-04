import { render, RenderError } from "@danielsimonjr/sciengjs";
import { readInput, writeOutput } from "./render-lib.ts";
import { engineConfig } from "./engine-config.ts";

/** The output formats of a LaTeX render. A PNG or a PDF takes one block only. */
export const LATEX_FORMATS = ["svg", "png", "pdf"] as const;
/** The output format of a LaTeX render. */
export type LatexFormat = (typeof LATEX_FORMATS)[number];

/** One block of a LaTeX source. The label names the kind of block, and tex holds its source. */
export interface Block { label: string; tex: string; }

/**
 * Splits a LaTeX source into blocks.
 * A bare math source gives one block. A document gives one block for each equation, align, gather, multline, array, cases and display block, in source order.
 * Each block gets the \newcommand and \DeclareMathOperator definitions of the preamble. A document with no such block gives one block for the whole source.
 */
export function extractBlocks(texSource: string): Block[] {
  const isDocument = texSource.includes("\\documentclass") || texSource.includes("\\begin{document}");
  if (!isDocument) return [{ label: "math", tex: texSource.trim() }];

  const found: (Block & { index: number })[] = [];
  const envRegex = /\\begin\{(align|equation|gather|multline|array|cases)\*?\}[\s\S]*?\\end\{\1\*?\}/g;
  let m: RegExpExecArray | null;
  while ((m = envRegex.exec(texSource)) !== null) found.push({ label: m[1], tex: m[0], index: m.index });

  const displayRegex = /\\\[[\s\S]*?\\\]/g;
  while ((m = displayRegex.exec(texSource)) !== null) found.push({ label: "display", tex: m[0].slice(2, -2).trim(), index: m.index });

  found.sort((x, y) => x.index - y.index);
  let blocks: Block[] = found.map(({ label, tex }) => ({ label, tex }));

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
  const attributes = new Map<string, string>();
  const tagMatch = /<svg\b[^>]*>/i.exec(svg);
  if (tagMatch === null) return attributes;
  const attributeRegex = /\s([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = attributeRegex.exec(tagMatch[0])) !== null) {
    attributes.set(match[1], match[2] !== undefined ? match[2] : match[3]);
  }
  return attributes;
}

/**
 * Converts an SVG length to user units of the outer svg.
 * A unitless value and a px value stay as they are. A pt value is multiplied by 4/3.
 * An ex value, an em value and any other text return null, so the caller uses the viewBox.
 */
function parseLengthToUserUnits(value: string): number | null {
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(pt|px|ex|em)?$/i.exec(value);
  if (match === null) return null;
  const amount = Number.parseFloat(match[1]);
  const unit = match[2] === undefined ? "" : match[2].toLowerCase();
  if (unit === "" || unit === "px") return amount;
  if (unit === "pt") return (amount * 4) / 3;
  return null;
}

/** Reads the width (3rd number) and the height (4th number) of a viewBox attribute. */
function readViewBoxSize(attributes: Map<string, string>): { width: number; height: number } {
  const value = attributes.get("viewBox");
  if (value === undefined) return { width: Number.NaN, height: Number.NaN };
  const parts = value.trim().split(/[\s,]+/).filter((part) => part.length > 0);
  const width = parts.length >= 3 ? Number(parts[2]) : Number.NaN;
  const height = parts.length >= 4 ? Number(parts[3]) : Number.NaN;
  return { width, height };
}

/** Removes the XML declaration and the DOCTYPE from the start of an SVG text. */
function stripPreamble(svg: string): string {
  return svg.replace(/^\s*<\?xml[\s\S]*?\?>\s*/, "").replace(/^\s*<!DOCTYPE[\s\S]*?>\s*/, "");
}

/** Formats a written number with at most 3 decimals and no trailing zeros. */
function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

/**
 * Writes the width, the height, and the placement of a block on its first svg root tag.
 * Removes the existing width and height attributes and keeps every other attribute, including the viewBox.
 */
function placeRootTag(svg: string, width: number, height: number, y: number): string {
  const openMatch = /<svg\b[^>]*>/i.exec(svg);
  if (openMatch === null) return svg;
  const original = openMatch[0];
  let tag = original.replace(/\s(width|height)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
  const selfClosing = tag.endsWith("/>");
  const stem = tag.slice(0, tag.length - (selfClosing ? 2 : 1)).replace(/\s+$/, "");
  tag = stem + ` width="${fmt(width)}" height="${fmt(height)}" x="20" y="${fmt(y)}"` + (selfClosing ? "/>" : ">");
  return svg.slice(0, openMatch.index) + tag + svg.slice(openMatch.index + original.length);
}

/**
 * Stacks SVG images in one vertical SVG document on a white background.
 * All sizes are in user units of the outer svg. A pt value is multiplied by 4/3. A unitless value and a px value are kept.
 * An ex value, an em value, a missing value and an unusable value take the viewBox width or height.
 * When no viewBox is usable, the width is 400 and the height is 50.
 * Each block is placed at its y, with a margin of 20 above and below it. Each nested svg gets the resolved width and height.
 */
export function combineSvgs(svgs: string[]): string {
  let totalHeight = 20;
  const blocks: string[] = [];
  const widths: number[] = [];
  for (const svg of svgs) {
    const body = stripPreamble(svg);
    const attributes = readRootAttributes(body);
    const viewBoxSize = readViewBoxSize(attributes);
    let width = parseLengthToUserUnits(attributes.get("width") ?? "");
    if (width === null) width = Number.isFinite(viewBoxSize.width) ? viewBoxSize.width : 400;
    let height = parseLengthToUserUnits(attributes.get("height") ?? "");
    if (height === null) height = Number.isFinite(viewBoxSize.height) ? viewBoxSize.height : 50;
    const y = totalHeight;
    totalHeight += height + 20;
    blocks.push(placeRootTag(body, width, height, y));
    widths.push(width);
  }
  const maxW = fmt((widths.length > 0 ? Math.max(...widths) : 0) + 40);
  const total = fmt(totalHeight);
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${maxW}" height="${total}" viewBox="0 0 ${maxW} ${total}">`,
    `<rect width="${maxW}" height="${total}" fill="white"/>`,
    ...blocks,
    "</svg>",
  ].join("\n");
}

/** The failure of one block: its position, its label and the engine error text and code. */
export interface LatexFailure { index: number; label: string; message: string; code?: string; }

/**
 * Renders each block of a LaTeX source through the sciengjs engine, on this machine, and writes the file.
 * An svg render stacks all blocks in one SVG. A png or pdf render takes one block: a source with more blocks
 * rejects with E_UNSUPPORTED. A failed block goes into failures in input order. When every block fails, the
 * call rejects with the engine error of the first block, so the code (for example E_INPUT) reaches the caller.
 */
export async function renderLatexSource(
  texSource: string,
  output: string,
  opts: { format?: LatexFormat; scale?: number } = {},
): Promise<{ svg: string; bytes: number; failures: LatexFailure[] }> {
  const format: LatexFormat = opts.format ?? "svg";
  const blocks = extractBlocks(texSource);
  if (format !== "svg" && blocks.length > 1) {
    throw Object.assign(new Error(`${format} takes one block; this source has ${blocks.length}. Use svg for a document.`), { code: "E_UNSUPPORTED" });
  }
  const config = engineConfig();
  const results = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    try {
      const req = opts.scale === undefined
        ? { type: "math" as const, format, source: block.tex }
        : { type: "math" as const, format, source: block.tex, options: { scale: opts.scale } };
      results.push({ ok: true as const, bytes: (await render(req, config)).bytes });
    } catch (err) {
      const code = err instanceof RenderError ? err.code : undefined;
      results.push({ ok: false as const, failure: { index: i, label: block.label, message: (err as Error).message, code }, err });
    }
  }
  const failures = results.flatMap((r) => (r.ok ? [] : [r.failure]));
  const firstError = results.find((r) => !r.ok);
  if (results.every((r) => !r.ok) && firstError && !firstError.ok) throw firstError.err;
  const valid = results.flatMap((r) => (r.ok ? [r.bytes] : []));
  if (format !== "svg") {
    writeOutput(output, valid[0]);
    return { svg: "", bytes: valid[0].byteLength, failures };
  }
  const svgs = valid.map((b) => Buffer.from(b).toString("utf-8"));
  const out = svgs.length === 1 ? svgs[0] : combineSvgs(svgs);
  writeOutput(output, out);
  return { svg: out, bytes: Buffer.byteLength(out, "utf-8"), failures };
}

/**
 * Reads a LaTeX source file. Renders the file with renderLatexSource. Writes the SVG to the output path.
 * The function returns the SVG text.
 */
export async function renderLatex(
  input: string,
  output: string,
  opts: { format?: LatexFormat; scale?: number } = {},
): Promise<string> {
  return (await renderLatexSource(readInput(input), output, opts)).svg;
}
