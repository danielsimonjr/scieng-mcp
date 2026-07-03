import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TOOLS, makeHandlers } from "../src/tools.ts";

test("exactly the five spec tools are defined", () => {
  assert.deepEqual(TOOLS.map((t) => t.name).sort(),
    ["ooxml_replace", "render_dot", "render_html", "render_latex", "render_mermaid"]);
  for (const t of TOOLS) assert.equal(t.inputSchema.type, "object");
});

test("render_mermaid: inline source writes SVG and returns path+bytes JSON", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const out = join(dir, "d.svg");
  const fake: typeof fetch = async () => new Response("<svg id='m'/>", { status: 200 });
  const h = makeHandlers(fake);
  const res = JSON.parse(await h.render_mermaid({ source: "graph TD\n A-->B", output_path: out }));
  assert.equal(res.path, out);
  assert.equal(res.bytes, Buffer.byteLength("<svg id='m'/>"));
  assert.match(readFileSync(out, "utf-8"), /<svg/);
});

test("render tools reject ambiguous input", async () => {
  const h = makeHandlers();
  await assert.rejects(() => h.render_mermaid({}), /exactly one of/);
  await assert.rejects(() => h.render_mermaid({ source: "x", input_path: "y" }), /exactly one of/);
  await assert.rejects(() => h.render_mermaid({ source: "x" }), /output_path/);
});

test("render_dot: input_path derives output path", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const inp = join(dir, "g.dot");
  writeFileSync(inp, "digraph { a -> b }");
  const fake: typeof fetch = async () => new Response("<svg id='d'/>", { status: 200 });
  const res = JSON.parse(await makeHandlers(fake).render_dot({ input_path: inp }));
  assert.equal(res.path, join(dir, "g.svg"));
  assert.ok(existsSync(res.path));
});

test("render_latex reports failures array", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const fake: typeof fetch = async () => new Response("<svg id='l'/>", { status: 200 });
  const res = JSON.parse(await makeHandlers(fake).render_latex({ source: "E=mc^2", output_path: join(dir, "e.svg") }));
  assert.deepEqual(res.failures, []);
  assert.ok(res.bytes > 0);
});

test("render_html builds a playground from blocks", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const out = join(dir, "p.html");
  const res = JSON.parse(await makeHandlers().render_html({
    title: "T", output_path: out,
    blocks: [{ type: "mermaid", source: "graph TD\n A-->B" }],
  }));
  assert.equal(res.path, out);
  assert.match(readFileSync(out, "utf-8"), /mermaid@11/);
});

test("ooxml_replace end-to-end", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const p = join(dir, "document.xml");
  writeFileSync(p, `<w:document><w:r><w:t>old</w:t></w:r></w:document>`);
  const res = JSON.parse(await makeHandlers().ooxml_replace({
    document_xml_path: p, replacements: [{ find: "old", replace: "new" }],
  }));
  assert.equal(res.replaced_count, 1);
  assert.match(readFileSync(p, "utf-8"), />new</);
});
