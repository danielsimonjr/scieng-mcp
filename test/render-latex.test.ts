import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractBlocks, combineSvgs, renderLatex, renderLatexSource } from "../src/render-latex.ts";

test("extractBlocks: raw math (no document) => single block", () => {
  const b = extractBlocks("E = mc^2");
  assert.equal(b.length, 1);
  assert.equal(b[0].label, "math");
  assert.equal(b[0].tex, "E = mc^2");
});

test("extractBlocks: document env + display + newcommand prefix", () => {
  const src = [
    "\\documentclass{article}",
    "\\newcommand{\\R}{\\mathbb{R}}",
    "\\begin{document}",
    "\\begin{equation} a=b \\end{equation}",
    "\\[ x+y \\]",
    "\\end{document}",
  ].join("\n");
  const b = extractBlocks(src);
  assert.equal(b.length, 2);
  assert.equal(b[0].label, "equation");
  assert.equal(b[1].label, "display");
  assert.ok(b.every((x) => x.tex.includes("\\newcommand{\\R}")));
});

test("combineSvgs stacks multiple SVGs into one root", () => {
  const a = "<?xml version='1.0'?><svg width='100pt' height='20pt'>A</svg>";
  const c = "<svg width='200pt' height='40pt'>B</svg>";
  const out = combineSvgs([a, c]);
  assert.match(out, /^<\?xml/);
  assert.equal((out.match(/<svg/g) || []).length, 3); // root + 2 inner
  assert.match(out, /x="20" y="20"/);
});

test("renderLatex single block writes the raw SVG directly", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tex-"));
  const inp = join(dir, "e.tex");
  const out = join(dir, "e.svg");
  writeFileSync(inp, "E=mc^2");
  const fake: typeof fetch = async () => new Response("<svg height='10pt' width='40pt'>eq</svg>", { status: 200 });
  const svg = await renderLatex(inp, out, { fetchImpl: fake });
  assert.equal(svg, readFileSync(out, "utf-8"));
  assert.match(svg, /<svg/);
});

test("renderLatex tolerates a single block failing (partial failure)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tex-"));
  const inp = join(dir, "doc.tex");
  const out = join(dir, "doc.svg");
  const src = [
    "\\documentclass{article}",
    "\\begin{document}",
    "\\begin{equation} a=b \\end{equation}",
    "\\begin{equation} c=d \\end{equation}",
    "\\end{document}",
  ].join("\n");
  writeFileSync(inp, src);
  let call = 0;
  const fake: typeof fetch = async () => {
    call++;
    if (call === 1) return new Response("<svg height='10pt' width='40pt'>ok</svg>", { status: 200 });
    return new Response("bad request", { status: 400 });
  };
  const svg = await renderLatex(inp, out, { fetchImpl: fake });
  assert.match(svg, /ok<\/svg>/);
  assert.equal(svg, readFileSync(out, "utf-8"));
});

test("renderLatex throws when all blocks fail", async () => {
  const dir = mkdtempSync(join(tmpdir(), "allfail-"));
  const inp = join(dir, "allfail.tex");
  const out = join(dir, "allfail.svg");
  writeFileSync(inp, "E=mc^2");
  const fake: typeof fetch = async () => new Response("bad request", { status: 400 });
  await assert.rejects(renderLatex(inp, out, { fetchImpl: fake }), /no blocks rendered/);
});

test("renderLatexSource reports per-block failures without failing the call", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tex-"));
  let call = 0;
  const fake: typeof fetch = async () => {
    call++;
    return call === 1 ? new Response("not svg", { status: 200 })
                      : new Response("<svg id='b'/>", { status: 200 });
  };
  const src = "\\documentclass{article}\\begin{document}\\begin{equation}a\\end{equation}\\begin{equation}b\\end{equation}\\end{document}";
  const { svg, failures } = await renderLatexSource(src, join(dir, "o.svg"), { fetchImpl: fake });
  assert.equal(failures.length, 1);
  assert.equal(failures[0].index, 0);
  assert.match(svg, /<svg/);
});

test("renderLatexSource lists failures in input order, not completion order", async () => {
  const src = "\\documentclass{article}\\begin{document}\\begin{equation}a\\end{equation}\\begin{equation}b\\end{equation}\\begin{equation}c\\end{equation}\\end{document}";
  // Block 0 fails slowly, block 1 fails at once, block 2 renders. Completion order would be [1, 0].
  let call = 0;
  const fake: typeof fetch = async () => {
    const n = call++;
    if (n === 0) {
      await new Promise((r) => setTimeout(r, 30));
      return new Response("bad", { status: 400 });
    }
    if (n === 1) return new Response("bad", { status: 400 });
    return new Response("<svg height='10pt' width='40pt'>ok</svg>", { status: 200 });
  };
  const { failures } = await renderLatexSource(src, join(mkdtempSync(join(tmpdir(), "ord-")), "o.svg"), { fetchImpl: fake });
  assert.deepEqual(failures.map((f) => f.index), [0, 1]);
});

// A root tag as codecogs returns it: double-quoted attributes, pt units, a viewBox with a negative y origin.
const CODECOGS_A = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="38.5pt" height="13.4pt" viewBox="0 -10.5 38.5 13.4" version="1.1"><path d="M0 0"/></svg>';
const CODECOGS_B = '<svg xmlns="http://www.w3.org/2000/svg" width="30pt" height="9.5pt" viewBox="0 -7 30 9.5"><path d="M0 0"/></svg>';

/** Returns the y coordinate that combineSvgs gives to each nested svg, in order. */
function nestedYs(out: string): number[] {
  return [...out.matchAll(/<svg[^>]* y="([^"]+)">/g)].map((m) => Number(m[1]));
}

test("combineSvgs reads double-quoted height (codecogs style)", () => {
  const out = combineSvgs([CODECOGS_A, CODECOGS_B]);
  // block 1 at y=20, height 13.4, gap 20 => block 2 at 53.4
  assert.deepEqual(nestedYs(out), [20, 53.4]);
});

test("combineSvgs reads single-quoted height and width", () => {
  const a = "<svg width='100pt' height='20pt'>A</svg>";
  const b = "<svg width='200pt' height='40pt'>B</svg>";
  const out = combineSvgs([a, b]);
  assert.deepEqual(nestedYs(out), [20, 60]);
  assert.match(out, /width="240pt"/); // max width 200 + 40
});

test("combineSvgs converts px and unitless lengths to pt", () => {
  const a = '<svg width="40px" height="20px" viewBox="0 0 40 20">A</svg>';
  const b = '<svg width="40" height="20" viewBox="0 0 40 20">B</svg>';
  const out = combineSvgs([a, b]);
  // 20 px = 15 pt => block 2 at 20 + 15 + 20 = 55
  assert.deepEqual(nestedYs(out), [20, 55]);
});

test("combineSvgs falls back to the viewBox when width and height are missing", () => {
  const stripped = [CODECOGS_A, CODECOGS_B].map((s) => s.replace(/ width="[^"]*"| height="[^"]*"/g, ""));
  const out = combineSvgs(stripped);
  assert.deepEqual(nestedYs(out), [20, 53.4]);
  assert.match(out, /width="78.5pt"/); // max viewBox width 38.5 + 40
});

test("combineSvgs uses the viewBox for an em or ex length", () => {
  const a = '<svg width="2ex" height="2ex" viewBox="0 -10.5 38.5 13.4">A</svg>';
  const out = combineSvgs([a, CODECOGS_B]);
  assert.deepEqual(nestedYs(out), [20, 53.4]);
});
