export type BlockType = "mermaid" | "dot" | "latex" | "plotly" | "wavedrom" | "raw-html";

// Trust model per block type: mermaid/latex sources are HTML-escaped; dot and
// plotly are JSON-embedded with "<" escaped; wavedrom is verbatim behind a
// "</script" guard; raw-html is verbatim and fully caller-trusted.
export interface HtmlBlock { type: BlockType; source: string; title?: string }

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

const INIT_SCRIPTS: Partial<Record<BlockType, string>> = {
  mermaid: `mermaid.initialize({ startOnLoad: true, theme: "dark" });`,
  wavedrom: `window.addEventListener("load", () => WaveDrom.ProcessAll());`,
  latex: `document.addEventListener("DOMContentLoaded", () => {
    renderMathInElement(document.body, { delimiters: [
      { left: "\\\\[", right: "\\\\]", display: true },
      { left: "$$", right: "$$", display: true },
      { left: "\\\\(", right: "\\\\)", display: false },
    ]});
  });`,
};

const hasOwnDelimiters = (tex: string): boolean =>
  tex.includes("\\[") || tex.includes("$$") || tex.includes("\\begin{");

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
      let spec: { data?: unknown; layout?: unknown };
      try { spec = JSON.parse(b.source) as typeof spec; }
      catch { throw new Error(`plotly block ${i}: source must be valid JSON ({"data": [...], "layout": {...}})`); }
      return `<div id="plotly-${i}"></div>\n<script>Plotly.newPlot("plotly-${i}", ${jsEmbed(spec.data ?? [])}, ${jsEmbed(spec.layout ?? {})});</script>`;
    }
    case "wavedrom":
      // WaveDrom reads this tag's text verbatim; legitimate WaveJSON never
      // contains "</script", so refuse rather than risk tag breakout.
      if (/<\/script/i.test(b.source)) {
        throw new Error(`wavedrom block ${i}: source must not contain "</script"`);
      }
      return `<script type="WaveDrom">${b.source}</script>`;
    case "raw-html":
      // Embedded verbatim BY DESIGN — the caller owns this content's safety.
      return b.source;
  }
}

export function buildHtml(blocks: HtmlBlock[], title = "scieng playground"): string {
  if (blocks.length === 0) throw new Error("buildHtml needs at least one block");
  const types = new Set(blocks.map((b) => b.type));
  const imports = (Object.keys(HEAD_IMPORTS) as (keyof typeof HEAD_IMPORTS)[])
    .filter((t) => types.has(t)).map((t) => HEAD_IMPORTS[t]);
  const inits = (Object.keys(INIT_SCRIPTS) as BlockType[])
    .filter((t) => types.has(t)).map((t) => INIT_SCRIPTS[t]!);
  const body = blocks.map((b, i) => {
    const inner = renderBlock(b, i);
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
    .latex-block { margin: 1.5rem 0; }
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
