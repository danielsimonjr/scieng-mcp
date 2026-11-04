import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractBlocks, combineSvgs, renderLatex, renderLatexSource } from "../src/render-latex.ts";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const scratch = (): string => mkdtempSync(join(tmpdir(), "tex-"));
function writeInput(text: string): string {
  const path = join(scratch(), "in.tex");
  writeFileSync(path, text);
  return path;
}

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
    "\\\end{document}",
  ].join("\n");
  const b = extractBlocks(src);
  assert.equal(b.length, 2);
  assert.equal(b[0].label, "equation");
  assert.equal(b[1].label, "display");
  assert.ok(b.every((x) => x.tex.includes("\\newcommand{\\R}")));
});

test("extractBlocks keeps source order: a display block between two environments", () => {
  const src = [
    "\\documentclass{article}",
    "\\begin{document}",
    "\\begin{equation} a \\end{equation}",
    "\\[ b \\]",
    "\\begin{align} c \\end{align}",
    "\\end{document}",
  ].join("\n");
  const b = extractBlocks(src);
  assert.deepEqual(b.map((x) => x.label), ["equation", "display", "align"]);
});

test("combineSvgs stacks multiple SVGs into one root", () => {
  const a = "<?xml version='1.0'?><svg width='100pt' height='20pt'>A</svg>";
  const c = "<svg width='200pt' height='40pt'>B</svg>";
  const out = combineSvgs([a, c]);
  assert.match(out, /^<\?xml/);
  assert.equal((out.match(/<svg/g) || []).length, 3); // root + 2 inner
  assert.match(out, /x="20" y="20"/);
});

test("renderLatex single block writes the SVG drawn by the engine", async () => {
  const out = join(scratch(), "e.svg");
  const svg = await renderLatex(writeInput("E=mc^2"), out);
  assert.equal(svg, readFileSync(out, "utf-8"));
  assert.match(svg, /<svg/);
});

test("renderLatexSource renders a PNG and a PDF of one block", async () => {
  const png = join(scratch(), "e.png");
  await renderLatexSource("E=mc^2", png, { format: "png" });
  assert.deepEqual([...readFileSync(png).subarray(0, 8)], PNG_SIGNATURE);
  const pdf = join(scratch(), "e.pdf");
  if (process.env.SCIENG_BROWSER) {
    // A browser is set: the engine draws the pdf.
    await renderLatexSource("E=mc^2", pdf, { format: "pdf" });
    assert.equal(readFileSync(pdf).subarray(0, 5).toString("latin1"), "%PDF-");
    return;
  }
  await assert.rejects(renderLatexSource("E=mc^2", pdf, { format: "pdf" }), (err: unknown) => {
    assert.equal((err as { code?: string }).code, "E_STAGE_MISSING");
    return true;
  }, "pdf needs the browser stage when SCIENG_BROWSER is not set");
});

test("renderLatexSource passes scale to the engine for a PNG", async () => {
  const small = join(scratch(), "s.png");
  const big = join(scratch(), "b.png");
  await renderLatexSource("E=mc^2", small, { format: "png", scale: 1 });
  await renderLatexSource("E=mc^2", big, { format: "png", scale: 3 });
  assert.ok(readFileSync(big).length > readFileSync(small).length);
});

test("renderLatexSource rejects a multi-block PNG with E_UNSUPPORTED", async () => {
  const src = "\\documentclass{article}\\begin{document}\\begin{equation}a\\end{equation}\\begin{equation}b\\end{equation}\\end{document}";
  await assert.rejects(renderLatexSource(src, join(scratch(), "m.png"), { format: "png" }), (err: unknown) => {
    assert.equal((err as { code?: string }).code, "E_UNSUPPORTED");
    return true;
  });
});

test("renderLatexSource reports a bad block in failures with the engine code", async () => {
  const src = "\\documentclass{article}\\begin{document}\\begin{equation}a\\end{equation}\\begin{equation}\\frac{\\end{equation}\\end{document}";
  const { svg, failures } = await renderLatexSource(src, join(scratch(), "o.svg"));
  assert.equal(failures.length, 1);
  assert.equal(failures[0].index, 1);
  assert.equal(failures[0].code, "E_INPUT");
  assert.match(svg, /<svg/);
});

test("renderLatexSource throws the engine error when every block fails", async () => {
  await assert.rejects(renderLatexSource("\frac{", join(scratch(), "x.svg")), (err: unknown) => {
    assert.equal((err as { code?: string }).code, "E_INPUT");
    return true;
  });
});

// Three measured SVG headers of a remote LaTeX renderer. Unitless, double-quoted, viewBox equals the size.
const LIVE_1 = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 73.27 19.12" width="73.27" height="19.12"><path d="M0 0"/></svg>';
const LIVE_2 = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 87.64 51.76" width="87.64" height="51.76"><path d="M0 0"/></svg>';
const LIVE_3 = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 17.84 36.69" width="17.84" height="36.69"><path d="M0 0"/></svg>';

interface Box { y: number; width: number; height: number; viewBox: string | undefined; }

function attributeOf(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m === null ? undefined : m[1];
}

/** Returns the rendered box of each nested svg that combineSvgs placed, in output order. */
function nestedBoxes(out: string): Box[] {
  return [...out.matchAll(/<svg\b[^>]* x="20" y="[^"]*"[^>]*>/g)].map((m) => ({
    y: Number(attributeOf(m[0], "y")),
    width: Number(attributeOf(m[0], "width")),
    height: Number(attributeOf(m[0], "height")),
    viewBox: attributeOf(m[0], "viewBox"),
  }));
}

function outerHeight(out: string): number {
  return Number(attributeOf(out.match(/<svg\b[^>]*>/)?.[0] ?? "", "height"));
}

function assertNear(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
}

test("combineSvgs stacks three measured unitless headers with no overlap", () => {
  const out = combineSvgs([LIVE_1, LIVE_2, LIVE_3]);
  const boxes = nestedBoxes(out);
  assert.equal(boxes.length, 3);
  assertNear(boxes[0].y, 20);
  for (let i = 0; i < 3; i++) {
    assertNear(boxes[i].height, [19.12, 51.76, 36.69][i]);
    assertNear(boxes[i].width, [73.27, 87.64, 17.84][i]);
  }
  assert.equal(boxes[0].viewBox, "0 0 73.27 19.12"); // the viewBox is kept
  for (let i = 0; i < 2; i++) {
    assert.ok(boxes[i].y + boxes[i].height <= boxes[i + 1].y, `block ${i} overlaps block ${i + 1}`);
    assertNear(boxes[i + 1].y - (boxes[i].y + boxes[i].height), 20); // the gap is the margin
  }
  assertNear(outerHeight(out), 20 + (19.12 + 51.76 + 36.69) + 3 * 20);
  // Every number that combineSvgs writes has at most 3 decimals and no float artefact.
  for (const m of out.matchAll(/\s(?:x|y|width|height|viewBox)="([^"]*)"/g)) {
    for (const num of m[1].match(/-?\d+(?:\.\d+)?/g) ?? []) {
      assert.ok(/\.\d{4,}/.test(num) === false, `too many decimals: ${num} in ${m[0]}`);
    }
  }
  assert.match(out, /y="59.12"/);
  assert.match(out, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" width="127.64" height="187.57" viewBox="0 0 127.64 187.57">/);
});

test("combineSvgs converts a pt height to user units by 4/3", () => {
  const a = "<svg width='30pt' height='9pt' viewBox='0 0 30 9.5'>A</svg>";
  const boxes = nestedBoxes(combineSvgs([a, LIVE_1]));
  assertNear(boxes[0].height, 12); // 9 pt = 12 user units
  assertNear(boxes[0].width, 40); // 30 pt = 40 user units
  assertNear(boxes[1].y, 52); // 20 + 12 + 20
});

test("combineSvgs keeps a px height in user units", () => {
  const a = '<svg width="40px" height="20px" viewBox="0 0 40 20">A</svg>';
  const boxes = nestedBoxes(combineSvgs([a, LIVE_1]));
  assertNear(boxes[0].height, 20);
  assertNear(boxes[0].width, 40);
  assertNear(boxes[1].y, 60); // 20 + 20 + 20
});

test("combineSvgs uses the viewBox for an ex or em length", () => {
  const a = '<svg width="2em" height="2ex" viewBox="0 0 40 13.4">A</svg>';
  const boxes = nestedBoxes(combineSvgs([a, LIVE_1]));
  assertNear(boxes[0].height, 13.4);
  assertNear(boxes[0].width, 40);
});

test("combineSvgs uses the viewBox when a block has no size", () => {
  const a = '<svg viewBox="0 0 30 9.5">A</svg>';
  const boxes = nestedBoxes(combineSvgs([a, LIVE_1]));
  assertNear(boxes[0].width, 30);
  assertNear(boxes[0].height, 9.5);
  assertNear(boxes[1].y, 49.5); // 20 + 9.5 + 20
});

test("combineSvgs reads single-quoted pt sizes in user units", () => {
  const a = "<svg width='100pt' height='20pt'>A</svg>";
  const b = "<svg width='200pt' height='40pt'>B</svg>";
  const out = combineSvgs([a, b]);
  const boxes = nestedBoxes(out);
  // Written values have at most 3 decimals: 20 pt = 26.667 user units (rounded).
  assertNear(boxes[0].height, 26.667);
  assertNear(boxes[1].y, 66.667);
  assertNear(Number(attributeOf(out.match(/<svg\b[^>]*>/)?.[0] ?? "", "width")), 306.667);
});
