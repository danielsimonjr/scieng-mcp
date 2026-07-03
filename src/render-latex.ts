import { readInput, writeOutput, httpText, mapLimit, type FetchLike } from "./render-lib.ts";

export interface Block { label: string; tex: string; }

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

export function combineSvgs(svgs: string[]): string {
  let totalHeight = 20;
  const info: { svg: string; w: number; h: number; y: number }[] = [];
  for (const svg of svgs) {
    const hMatch = svg.match(/height='([^']+?)(?:pt|px)?'/);
    const wMatch = svg.match(/width='([^']+?)(?:pt|px)?'/);
    const h = hMatch ? parseFloat(hMatch[1]) : 50;
    const w = wMatch ? parseFloat(wMatch[1]) : 400;
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

export async function renderLatexSource(
  texSource: string,
  output: string,
  opts: { dpi?: number; fetchImpl?: FetchLike } = {},
): Promise<{ svg: string; failures: { index: number; label: string; message: string }[] }> {
  const { dpi = 200, fetchImpl } = opts;
  const blocks = extractBlocks(texSource);
  const failures: { index: number; label: string; message: string }[] = [];
  const rendered = await mapLimit(blocks, 4, async (block, i) => {
    const url = `https://latex.codecogs.com/svg.image?\\dpi{${dpi}}${encodeURIComponent(block.tex)}`;
    try {
      const svg = await httpText(url, { headers: { "User-Agent": "Node.js" }, fetchImpl });
      if (svg.includes("<svg")) return svg;
      failures.push({ index: i, label: block.label, message: "no SVG in response" });
      return null;
    } catch (err) {
      failures.push({ index: i, label: block.label, message: (err as Error).message });
      return null;
    }
  });
  const valid = rendered.filter((r): r is string => r !== null);
  if (valid.length === 0) throw new Error("no blocks rendered");
  const out = valid.length === 1 ? valid[0] : combineSvgs(valid);
  writeOutput(output, out);
  return { svg: out, failures };
}

export async function renderLatex(
  input: string,
  output: string,
  opts: { dpi?: number; fetchImpl?: FetchLike } = {},
): Promise<string> {
  return (await renderLatexSource(readInput(input), output, opts)).svg;
}
