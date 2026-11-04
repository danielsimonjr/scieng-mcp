// Tests of the html_to_markdown tool: input XOR, output path, asset folder, name safety, no overwrite, and the round trip.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeHandlers } from "../src/tools.ts";


const tmp = (): string => mkdtempSync(join(tmpdir(), "h2m-"));
const handlers = makeHandlers();

test("html_to_markdown: inline html writes the Markdown and returns path, bytes, assets and warnings", async () => {
  const out = join(tmp(), "page.md");
  const res = JSON.parse(await handlers.html_to_markdown!({ html: "<h1>Title</h1><p>Body text.</p>", output_path: out }));
  assert.equal(res.path, out);
  assert.equal(res.bytes, readFileSync(out).length);
  assert.deepEqual(res.assets, []);
  assert.ok(Array.isArray(res.warnings));
  assert.match(readFileSync(out, "utf-8"), /Title/);
});

test("html_to_markdown: input_path reads the .html file", async () => {
  const dir = tmp();
  const input = join(dir, "in.html");
  writeFileSync(input, "<p>From file</p>");
  const out = join(dir, "out.md");
  await handlers.html_to_markdown!({ input_path: input, output_path: out });
  assert.match(readFileSync(out, "utf-8"), /From file/);
});

test("html_to_markdown: giving both html and input_path is refused", async () => {
  await assert.rejects(handlers.html_to_markdown!({ html: "<p>a</p>", input_path: "x.html", output_path: join(tmp(), "o.md") }));
});

test("html_to_markdown: giving neither html nor input_path is refused", async () => {
  await assert.rejects(handlers.html_to_markdown!({ output_path: join(tmp(), "o.md") }));
});

test("html_to_markdown: output_path is required", async () => {
  await assert.rejects(handlers.html_to_markdown!({ html: "<p>a</p>" }));
});

test("html_to_markdown: an asset name with a slash or dot-dot is refused", async () => {
  const { assetFilePath } = await import("../src/render-markdown.ts");
  const dir = tmp();
  for (const name of ["a/b.png", "a\u005cb.png", "../x.png", "..", "x/../y.png"]) {
    assert.throws(() => assetFilePath(dir, name), /asset name/, name);
  }
});

test("html_to_markdown: an existing file is never overwritten; the new file gets -2, -3", async () => {
  const { uniquePath } = await import("../src/render-markdown.ts");
  const dir = tmp();
  writeFileSync(join(dir, "fig.png"), "old");
  assert.equal(uniquePath(dir, "fig.png"), join(dir, "fig-2.png"));
  writeFileSync(join(dir, "fig-2.png"), "old");
  assert.equal(uniquePath(dir, "fig.png"), join(dir, "fig-3.png"));
  assert.equal(readFileSync(join(dir, "fig.png"), "utf-8"), "old");
});

test("html_to_markdown: round trip of a page with six block types returns every exact source", async () => {
  const blocks = [
    { type: "mermaid" as const, source: "graph TD\n A-->B" },
    { type: "dot" as const, source: 'digraph { a [label="x & y"] }' },
    { type: "latex" as const, source: "\u005cfrac{a}{b} < c" },
    { type: "plotly" as const, source: JSON.stringify({ data: [{ x: [1, 2] }], layout: {} }) },
    { type: "wavedrom" as const, source: '{ "signal": [{ "name": "clk", "wave": "p." }] }' },
    { type: "raw-html" as const, source: "<p>raw &amp; plain</p>" },
  ];
  const dir = tmp();
  const page = join(dir, "page.html");
  await handlers.render_html!({ blocks, output_path: page });
  const out = join(dir, "page.md");
  const res = JSON.parse(await handlers.html_to_markdown!({ input_path: page, output_path: out }));
  const md = readFileSync(out, "utf-8");
  for (const b of blocks) assert.ok(md.includes(b.source), `${b.type}: source does not come back`);
  assert.deepEqual(res.assets, []);
});

