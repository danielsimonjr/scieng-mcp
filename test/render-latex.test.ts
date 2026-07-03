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
