// Tests of the html_to_markdown tool: input XOR, output path, asset folder, name safety, no overwrite, and the round trip.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { RenderError } from "@danielsimonjr/sciengjs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeHandlers, dispatchTool } from "../src/tools.ts";


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

test("html_to_markdown: round trip of a page with seven blocks returns every exact source", async () => {
  const blocks = [
    { type: "mermaid" as const, source: "graph TD\n A-->B" },
    { type: "dot" as const, source: 'digraph { a [label="x & y"] }' },
    { type: "latex" as const, source: "\u005cfrac{a}{b} < c" },
    { type: "plotly" as const, source: JSON.stringify({ data: [{ x: [1, 2] }], layout: {} }) },
    { type: "wavedrom" as const, source: '{ "signal": [{ "name": "clk", "wave": "p." }] }' },
    { type: "raw-html" as const, source: "<p>raw &amp; plain</p>" },
    // The markup of this block alone infers mermaid. Only data-scieng-type gives the html fence.
    { type: "raw-html" as const, source: '<pre class="mermaid">graph LR</pre>' },
  ];
  const dir = tmp();
  const page = join(dir, "page.html");
  await handlers.render_html!({ blocks, output_path: page });
  const out = join(dir, "page.md");
  const res = JSON.parse(await handlers.html_to_markdown!({ input_path: page, output_path: out }));
  const md = readFileSync(out, "utf-8");
  for (const b of blocks) {
    const fence = "```" + (b.type === "raw-html" ? "html" : b.type) + "\n" + b.source + "\n```";
    assert.ok(md.includes(fence), `${b.type}: the source or the fence language does not come back`);
  }
  assert.deepEqual(res.assets, []);
});

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4"/></svg>';
const enc = (s: string): Uint8Array => new TextEncoder().encode(s);
const fakeEngine = (md: string, names: string[]) => async () => ({
  bytes: enc(md), mime: "text/markdown", backend: "fake", warnings: [],
  assets: names.map((name) => ({ name, bytes: enc(name.toUpperCase()), mediaType: "image/svg+xml" })),
});

test("html_to_markdown: a taken asset name gets a new file, and only the image link follows it", async () => {
  const dir = tmp();
  writeFileSync(join(dir, "image-1.svg"), "old");
  const out = join(dir, "page.md");
  const res = JSON.parse(await handlers.html_to_markdown!({ html: `<p>See <code>(image-1.svg)</code></p><p>${SVG}</p>`, output_path: out }));
  assert.deepEqual(res.assets, [join(dir, "image-1-2.svg")]);
  assert.match(readFileSync(join(dir, "image-1-2.svg"), "utf-8"), /<rect/);
  assert.equal(readFileSync(join(dir, "image-1.svg"), "utf-8"), "old");
  const md = readFileSync(out, "utf-8");
  assert.match(md, /!\[\]\(image-1-2\.svg\)/);
  assert.match(md, /`\(image-1\.svg\)`/, "the code span keeps its text");
});

test("rewriteImageLinks: rewrites only image destinations that equal a renamed asset", async () => {
  const { rewriteImageLinks } = await import("../src/render-markdown.ts");
  const map = new Map([["a.svg", "a-2.svg"]]);
  const tail = ["`![c](a.svg)` \\![e](a.svg)", "```", "![f](a.svg)", "```", ""];
  const md = ['![x](a.svg) ![y](<a.svg>) ![z](a.svg "t") [l](a.svg) (a.svg) ![k](a.svgx)', ...tail].join("\n");
  const want = ['![x](a-2.svg) ![y](<a-2.svg>) ![z](a-2.svg "t") [l](a.svg) (a.svg) ![k](a.svgx)', ...tail].join("\n");
  assert.equal(rewriteImageLinks(md, map), want);
});

test("html_to_markdown: an existing output_path is refused with E_INPUT and kept", async () => {
  const dir = tmp();
  const out = join(dir, "page.md");
  writeFileSync(out, "keep");
  const r = await dispatchTool(handlers, "html_to_markdown", { html: "<p>a</p>", output_path: out });
  assert.equal(r.isError, true);
  const body = JSON.parse(r.content[0].text);
  assert.equal(body.code, "E_INPUT");
  assert.ok(body.error.includes(out), body.error);
  assert.equal(readFileSync(out, "utf-8"), "keep");
});

test("html_to_markdown: an existing <output>.tmp file is not touched", async () => {
  const dir = tmp();
  const out = join(dir, "page.md");
  writeFileSync(out + ".tmp", "mine");
  await handlers.html_to_markdown!({ html: "<p>a</p>", output_path: out });
  assert.equal(readFileSync(out + ".tmp", "utf-8"), "mine");
  assert.deepEqual(readdirSync(dir).sort(), ["page.md", "page.md.tmp"]);
});

test("html_to_markdown: an output_path without .md is refused with E_INPUT", async () => {
  const r = await dispatchTool(handlers, "html_to_markdown", { html: "<p>a</p>", output_path: join(tmp(), "page.txt") });
  assert.equal(JSON.parse(r.content[0].text).code, "E_INPUT");
});

test("html_to_markdown: an empty html is refused with 'html is empty'", async () => {
  await assert.rejects(handlers.html_to_markdown!({ html: "", output_path: join(tmp(), "o.md") }), /html is empty/);
});

test("html_to_markdown: an empty html together with input_path is refused as both", async () => {
  await assert.rejects(handlers.html_to_markdown!({ html: "", input_path: "x.html", output_path: join(tmp(), "o.md") }), /exactly one/);
});

test("htmlToMarkdownFile: a failed asset write removes every file of the call", async () => {
  const { htmlToMarkdownFile } = await import("../src/render-markdown.ts");
  const dir = tmp();
  const out = join(dir, "page.md");
  await assert.rejects(htmlToMarkdownFile({ html: "<p>a</p>", output_path: out }, fakeEngine("![](a.svg)\n", ["a.svg", "b.svg"]) as never, {
    writeFile: (p, d, o) => {
      if (p.endsWith("b.svg")) throw Object.assign(new Error("disk full"), { code: "ENOSPC" });
      writeFileSync(p, d, o);
    },
  }), /disk full/);
  assert.deepEqual(readdirSync(dir), []);
});

test("htmlToMarkdownFile: an asset that appears between the plan and the write gets the next name", async () => {
  const { htmlToMarkdownFile } = await import("../src/render-markdown.ts");
  const dir = tmp();
  const out = join(dir, "page.md");
  let raced = false;
  const res = await htmlToMarkdownFile({ html: "<p>a</p>", output_path: out }, fakeEngine("![](a.svg)\n", ["a.svg"]) as never, {
    writeFile: (p, d, o) => {
      if (!raced && p.endsWith("a.svg")) { raced = true; writeFileSync(p, "other"); }
      writeFileSync(p, d, o);
    },
  });
  assert.deepEqual(res.assets, [join(dir, "a-2.svg")]);
  assert.equal(readFileSync(join(dir, "a.svg"), "utf-8"), "other");
  assert.equal(readFileSync(out, "utf-8"), "![](a-2.svg)\n");
});

test("htmlToMarkdownFile: download_images and browser map to the engine options; an engine error keeps its code", async () => {
  const { htmlToMarkdownFile } = await import("../src/render-markdown.ts");
  const seen: { type: string; format: string; options: unknown }[] = [];
  const ok = async (req: never) => { seen.push(req); return { bytes: new Uint8Array(), mime: "text/markdown", backend: "fake", warnings: [] }; };
  await htmlToMarkdownFile({ html: "<p>a</p>", output_path: join(tmp(), "a.md") }, ok as never);
  await htmlToMarkdownFile({ html: "<p>a</p>", output_path: join(tmp(), "b.md"), download_images: true, browser: true }, ok as never);
  assert.deepEqual(seen.map((r) => r.options), [
    { downloadImages: false, browser: false },
    { downloadImages: true, browser: true },
  ]);
  assert.equal(seen[0].type, "html");
  assert.equal(seen[0].format, "md");
  const failing = async () => { throw new RenderError("E_TIMEOUT", "too slow"); };
  const h = { html_to_markdown: async (raw: unknown) => JSON.stringify(await htmlToMarkdownFile(raw as never, failing as never)) };
  const r = await dispatchTool(h, "html_to_markdown", { html: "<p>a</p>", output_path: join(tmp(), "c.md") });
  assert.equal(JSON.parse(r.content[0].text).code, "E_TIMEOUT");
});

test("assetFilePath: refuses colon, NUL, device names, trailing dot or space, and absolute paths", async () => {
  const { assetFilePath } = await import("../src/render-markdown.ts");
  const dir = tmp();
  for (const name of ["a:b.png", "a\u0000.png", "CON", "con.svg", "Nul.txt", "COM1", "lpt9.png", "aux.tar.gz", "a.", "a ", "/abs.png", "C:x.png"]) {
    assert.throws(() => assetFilePath(dir, name), /asset name/, JSON.stringify(name));
  }
  assert.equal(assetFilePath(dir, "console.svg"), join(dir, "console.svg"));
  assert.equal(assetFilePath(dir, "COM10.png"), join(dir, "COM10.png"));
});

test("html_to_markdown: the fence language comes from data-scieng-type, not from the markup", async () => {
  const out = join(tmp(), "t.md");
  const html = '<div class="scieng-block" data-scieng-type="mermaid" data-scieng-source="graph TD"><p>plain</p></div>';
  await handlers.html_to_markdown!({ html, output_path: out });
  assert.match(readFileSync(out, "utf-8"), /```mermaid\ngraph TD\n```/);
});
