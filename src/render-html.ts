/** The kinds of block that buildHtml accepts. */
export type BlockType = "mermaid" | "dot" | "latex" | "plotly" | "wavedrom" | "raw-html";

// Trust model per block type: mermaid/latex sources are HTML-escaped; dot and
// plotly are JSON-embedded with "<" escaped; wavedrom is verbatim behind a
// a guard that refuses "<script", "</script" and "<!--"; raw-html is verbatim and fully caller-trusted.
/** One block of an HTML page: its kind, its source text, and an optional section heading. */
export interface HtmlBlock {
  type: BlockType;
  source: string;
  title?: string;
  /** plotly only: when true, the engine draws the figure as inline SVG and no Plotly script loads for the block. */
  static?: boolean;
  /** plotly and static only: the SVG that the engine drew for the source. Set by resolveStaticBlocks. */
  svg?: string;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Encodes a value for a double-quoted attribute. A carriage return becomes &#13; so that no parser
// removes it; a line feed stays literal, which the parser keeps.
const escAttr = (s: string): string =>
  esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\r/g, "&#13;");

// JSON-encode a value for embedding inside an inline <script>: escape "<" so
// a value containing "</script>" cannot close the surrounding tag early.
const jsEmbed = (v: unknown): string => JSON.stringify(v).replace(/</g, "\\u003c");

// Exact-pinned CDN assets with Subresource Integrity (sha384 of each pinned
// file, computed 2026-07-02). A pin and its hash always change together.
// RENDERERS.md documents the hand-authoring equivalents — keep them aligned.
const HEAD_IMPORTS: Record<Exclude<BlockType, "raw-html">, string> = {
  mermaid: `<script src="https://cdn.jsdelivr.net/npm/mermaid@11.16.0/dist/mermaid.min.js" integrity="sha384-T/0lMUdJpd2S1ZHtRiofG3htU3xPCrFVeAQ1UUE2TJwlEJSV5NUwn30kP28n238E" crossorigin="anonymous"></script>`,
  dot: `<script src="https://cdn.jsdelivr.net/npm/@viz-js/viz@3.28.0/dist/viz-global.min.js" integrity="sha384-jv5ql4TEr9ULyGfjHq2FtVcK4+Eda4mfBLyS+yMQpx8ncVHQk+U0TIgGQ4L6EXCk" crossorigin="anonymous"></script>`,
  latex: [
    `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" integrity="sha384-zh0CIslj+VczCZtlzBcjt5ppRcsAmDnRem7ESsYwWwg3m/OaJ2l4x7YBZl9Kxxib" crossorigin="anonymous">`,
    `<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js" integrity="sha384-Rma6DA2IPUwhNxmrB/7S3Tno0YY7sFu9WSYMCuulLhIqYSGZ2gKCJWIqhBWqMQfh" crossorigin="anonymous"></script>`,
    `<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js" integrity="sha384-hCXGrW6PitJEwbkoStFjeJxv+fSOOQKOPbJxSfM6G5sWZjAyWhXiTIIAmQqnlLlh" crossorigin="anonymous"></script>`,
  ].join("\n  "),
  plotly: `<script src="https://cdn.plot.ly/plotly-2.35.2.min.js" integrity="sha384-cCVCZkAjYNxaYKbM8lsArLznDF/SvMFr1jcZrvOpSTCa0W40ZAdLzHCEulnUa5i7" crossorigin="anonymous"></script>`,
  wavedrom: [
    `<script src="https://cdnjs.cloudflare.com/ajax/libs/wavedrom/3.1.0/skins/default.js" integrity="sha384-8bvnUBb8hQiJxDdvLdFFeS112d/Mc65xTihoALPDR2RAqKgtvpyE61eUPj3f8NrZ" crossorigin="anonymous"></script>`,
    `<script src="https://cdnjs.cloudflare.com/ajax/libs/wavedrom/3.1.0/wavedrom.min.js" integrity="sha384-ZxcO4Va8vGMKlVz1cdMB+9lv/IdAUuNTigvTrcrJOBz4cbucyxkIzfBIaSMdSOmI" crossorigin="anonymous"></script>`,
  ].join("\n  "),
};

// A latex block that holds its own environment is not wrapped (see hasOwnDelimiters), so
// auto-render must list each environment, or the block stays as literal text.
const LATEX_ENVS = ["equation", "equation*", "align", "align*", "gather", "gather*"];
const envDelimiters = LATEX_ENVS
  .map((e) => `\n      { left: "\\\\begin{${e}}", right: "\\\\end{${e}}", display: true },`).join("");

const INIT_SCRIPTS: Partial<Record<BlockType, string>> = {
  mermaid: `mermaid.initialize({ startOnLoad: true, theme: "dark" });`,
  wavedrom: `window.addEventListener("load", () => WaveDrom.ProcessAll());`,
  latex: `document.addEventListener("DOMContentLoaded", () => {
    renderMathInElement(document.body, { delimiters: [
      { left: "\\\\[", right: "\\\\]", display: true },
      { left: "$$", right: "$$", display: true },
      { left: "\\\\(", right: "\\\\)", display: false },${envDelimiters}
    ]});
  });`,
};

// Page styles that only some block types need, added only when such a block is present.
const BLOCK_STYLES: Partial<Record<BlockType, string>> = {
  wavedrom: `.wavedrom-block { background: #fff; color: #000; padding: 1rem; border: 1px solid #8a8a8a; border-radius: 4px; overflow-x: auto; }`,
};

const hasOwnDelimiters = (tex: string): boolean =>
  tex.includes("\\[") || tex.includes("$$") || tex.includes("\\begin{");

const inputError = (message: string): Error => Object.assign(new Error(message), { name: "RenderError", code: "E_INPUT" });

// Decodes the numeric and named character references that can hide a "javascript:" scheme.
const decodeRefs = (s: string): string =>
  s.replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16) % 0x110000))
    .replace(/&#(\d+);?/g, (_, d: string) => String.fromCodePoint(Number(d) % 0x110000))
    .replace(/&colon;/gi, ":").replace(/&(tab|newline);/gi, "");

/** Returns a description of the first active content in an SVG, or undefined when the SVG has none. */
function unsafeSvg(svg: string): string | undefined {
  if (/<script/i.test(svg)) return "a script tag";
  if (/<foreignObject/i.test(svg)) return "a foreignObject element";
  // Attributes live only inside tags. Text nodes are outside them, because the engine escapes "<" and ">" in text.
  const tags = (svg.match(/<[^>]*>/g) ?? []).join("");
  if (/[\s/"']on\w+\s*=/i.test(tags)) return "an event-handler attribute";
  if (/javascript:/i.test(decodeRefs(tags).replace(/[\s\x00-\x1f]/g, ""))) return "a javascript: URL";
  return undefined;
}

// The engine gives fixed ids (for example clip0), so two static blocks on one page would collide.
// Each id and each url(#id) and href="#id" reference to it gets the suffix of its block.
function scopeSvgIds(svg: string, suffix: string): string {
  const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!));
  if (ids.size === 0) return svg;
  const scoped = (id: string): string => (ids.has(id) ? id + suffix : id);
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${scoped(id)}"`)
    .replace(/url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g, (_, q: string, id: string) => `url(${q}#${scoped(id)}${q})`)
    .replace(/(href=")#([^"]+)"/g, (_, h: string, id: string) => `${h}#${scoped(id)}"`);
}

function renderBlock(b: HtmlBlock, i: number): string {
  switch (b.type) {
    case "mermaid":
      return `<pre class="mermaid">${esc(b.source)}</pre>`;
    case "dot":
      return `<div id="dot-${i}"></div>\n<script>Viz.instance().then(v => document.getElementById("dot-${i}").appendChild(v.renderSVGElement(${jsEmbed(b.source)})));</script>`;
    case "latex": {
      const tex = hasOwnDelimiters(b.source) ? b.source : `\\[${b.source}\\]`;
      return `<div class="latex-block">${esc(tex)}</div>`;
    }
    case "plotly": {
      if (b.static) {
        if (b.svg === undefined) throw new Error(`plotly block ${i}: a static block needs its SVG (the svg field is missing)`);
        const unsafe = unsafeSvg(b.svg);
        if (unsafe) throw new Error(`plotly block ${i}: the SVG of a static block must not contain ${unsafe}`);
        return `<div class="plotly-static">${scopeSvgIds(b.svg, `-b${i}`)}</div>`;
      }
      let spec: { data?: unknown; layout?: unknown };
      try { spec = JSON.parse(b.source) as typeof spec; }
      catch { throw new Error(`plotly block ${i}: source must be valid JSON ({"data": [...], "layout": {...}})`); }
      return `<div id="plotly-${i}"></div>\n<script>Plotly.newPlot("plotly-${i}", ${jsEmbed(spec.data ?? [])}, ${jsEmbed(spec.layout ?? {})});</script>`;
    }
    case "wavedrom":
      // WaveDrom reads this tag's text verbatim; legitimate WaveJSON never
      // contains "</script", so refuse rather than risk tag breakout.
      // An opening <script or an HTML comment can change how the parser ends the tag, so both are refused too.
      const refused = /<\/?script|<!--/i.exec(b.source);
      if (refused) {
        throw new Error(`wavedrom block ${i}: source contains "${refused[0]}", which can open a script context in the page`);
      }
      // The default skin draws black lines and text, so the block gets a light panel.
      return `<div class="wavedrom-block"><script type="WaveDrom">${b.source}</script></div>`;
    case "raw-html":
      // Embedded verbatim BY DESIGN — the caller owns this content's safety.
      return b.source;
  }
}

/**
 * Builds one HTML page from the blocks, in the order given.
 * The page loads only the pinned CDN files that the block types need. Each file has a Subresource Integrity hash.
 * The call throws when blocks is empty. The call also throws when a plotly source is not valid JSON, or when a wavedrom source contains "</script".
 * The call throws an E_INPUT error when a block that is not plotly sets static.
 * The call throws when the SVG of a static block holds a script tag, a foreignObject element, an event-handler attribute or a javascript: URL.
 * Each static block gets its own suffix on the ids of its SVG, so two blocks on one page do not collide.
 */
export function buildHtml(blocks: HtmlBlock[], title = "scieng playground"): string {
  if (blocks.length === 0) throw new Error("buildHtml needs at least one block");
  blocks.forEach((b, i) => {
    if (b.static && b.type !== "plotly") throw inputError(`${b.type} block ${i}: static is valid only on a plotly block`);
  });
  // A static plotly block draws through the engine, so it does not need the Plotly CDN file.
  const types = new Set(blocks.map((b) => (b.type === "plotly" && b.static ? "static-plotly" : b.type)));
  const imports = (Object.keys(HEAD_IMPORTS) as (keyof typeof HEAD_IMPORTS)[])
    .filter((t) => types.has(t)).map((t) => HEAD_IMPORTS[t]);
  const inits = (Object.keys(INIT_SCRIPTS) as BlockType[])
    .filter((t) => types.has(t)).map((t) => INIT_SCRIPTS[t]!);
  const styles = (Object.keys(BLOCK_STYLES) as BlockType[])
    .filter((t) => types.has(t)).map((t) => `\n    ${BLOCK_STYLES[t]!}`).join("");
  const body = blocks.map((b, i) => {
    const inner = `<div class="scieng-block" data-scieng-type="${b.type}" data-scieng-source="${escAttr(b.source)}">${renderBlock(b, i)}</div>`;
    return b.title ? `<section>\n<h2>${esc(b.title)}</h2>\n${inner}\n</section>` : inner;
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${imports.join("\n  ")}
  <style>
    :root { --bg: #1a1a2e; --fg: #e0e0e0; --accent: #00d2ff; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--fg); padding: 2rem; }
    section { margin: 2rem 0; }
    h2 { color: var(--accent); margin-bottom: 1rem; }
    .mermaid { background: transparent; }
    .latex-block { margin: 1.5rem 0; }${styles}
  </style>
</head>
<body>
${body.join("\n")}
<script>
${inits.join("\n")}
</script>
</body>
</html>
`;
}

/**
 * Renders each static plotly block with the given renderer, and returns the blocks in order.
 * An engine error keeps its code. It is rethrown as a RenderError that names the block index.
 */
export async function resolveStaticBlocks(
  blocks: HtmlBlock[],
  renderPlot: (source: string) => Promise<string>,
): Promise<HtmlBlock[]> {
  const out: HtmlBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.type !== "plotly" || !b.static) { out.push(b); continue; }
    try {
      out.push({ ...b, svg: await renderPlot(b.source) });
    } catch (err) {
      const code = (err as { code?: unknown }).code;
      if (typeof code !== "string") throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw Object.assign(new Error(`plotly block ${i}: [${code}] ${msg}`), { name: "RenderError", code });
    }
  }
  return out;
}
