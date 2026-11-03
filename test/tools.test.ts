import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TOOLS, makeHandlers, dispatchTool, type ToolHandler } from "../src/tools.ts";

test("exactly the six tools are defined", () => {
  assert.deepEqual(TOOLS.map((t) => t.name).sort(),
    ["capabilities", "ooxml_replace", "render_dot", "render_html", "render_latex", "render_mermaid"]);
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

test("render_dot: input_path derives the output path from the format", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const inp = join(dir, "g.dot");
  writeFileSync(inp, "digraph { a -> b }");
  const h = makeHandlers();
  const svg = JSON.parse(await h.render_dot({ input_path: inp }));
  assert.equal(svg.path, join(dir, "g.svg"));
  assert.ok(existsSync(svg.path));
  const png = JSON.parse(await h.render_dot({ input_path: inp, format: "png" }));
  assert.equal(png.path, join(dir, "g.png"));
  assert.deepEqual([...readFileSync(png.path).subarray(0, 4)], [137, 80, 78, 71]);
});

test("render_dot renders locally: an injected fetch is never called", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const out = join(dir, "local.svg");
  let calls = 0;
  const refuse: typeof fetch = async () => { calls++; throw new Error("network blocked"); };
  const res = JSON.parse(await makeHandlers(refuse).render_dot({ source: "digraph { a -> b }", output_path: out }));
  assert.equal(res.path, out);
  assert.equal(res.bytes, readFileSync(out).length);
  assert.match(readFileSync(out, "utf-8"), /<svg/);
  assert.equal(calls, 0);
});

test("render_dot: format png writes PNG bytes", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const out = join(dir, "p.png");
  const res = JSON.parse(await makeHandlers().render_dot({ source: "digraph { a -> b }", output_path: out, format: "png" }));
  assert.equal(res.path, out);
  assert.deepEqual([...readFileSync(out).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(res.bytes, readFileSync(out).length);
});

test("render_dot: an image attribute gives a warning in the result", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const res = JSON.parse(await makeHandlers().render_dot({
    source: 'digraph { a [image="/tmp/x.png"] }', output_path: join(dir, "i.svg"),
  }));
  assert.ok(Array.isArray(res.warnings));
  assert.ok(res.warnings.some((w: string) => /image attribute/.test(w)), JSON.stringify(res.warnings));
});

test("render_dot rejects a format other than svg or png", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  await assert.rejects(() => makeHandlers().render_dot({
    source: "digraph { a }", output_path: join(dir, "x.pdf"), format: "pdf",
  }));
});

test("render_dot describes a local render and names no remote service", () => {
  const tool = TOOLS.find((t) => t.name === "render_dot");
  assert.ok(tool);
  assert.doesNotMatch(tool.description ?? "", /quickchart/i);
  assert.match(tool.description ?? "", /locally/i);
});

test("capabilities returns the engine pairs and their readiness", async () => {
  const res = JSON.parse(await makeHandlers().capabilities({}));
  assert.ok(Array.isArray(res.capabilities));
  const dotSvg = res.capabilities.find((c: { type: string; format: string }) => c.type === "dot" && c.format === "svg");
  assert.ok(dotSvg, "no dot to svg pair");
  assert.equal(dotSvg.stage, "graph");
  assert.equal(dotSvg.ready, true);
});

test("capabilities is a read-only tool with no input properties", () => {
  const tool = TOOLS.find((t) => t.name === "capabilities");
  assert.ok(tool);
  assert.equal(tool.annotations?.readOnlyHint, true);
  assert.deepEqual(Object.keys(tool.inputSchema.properties ?? {}), []);
});

test("the README names every tool", () => {
  const readme = readFileSync(join(import.meta.dirname, "..", "README.md"), "utf-8");
  for (const t of TOOLS) assert.ok(readme.includes("`" + t.name + "`"), `README does not name ${t.name}`);
  assert.ok(readme.includes("`capabilities`"), "README does not name capabilities");
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

test("dispatchTool rejects prototype-inherited names not present as own properties", async () => {
  const handlers: Record<string, ToolHandler> = { real_tool: async () => "ok" };
  const res = await dispatchTool(handlers, "toString", {});
  assert.equal(res.isError, true);
  const body = JSON.parse(res.content[0].text);
  assert.deepEqual(body, { status: "error", error: "unknown tool 'toString'" });
});

test("dispatchTool rejects an unknown tool name", async () => {
  const handlers: Record<string, ToolHandler> = { real_tool: async () => "ok" };
  const res = await dispatchTool(handlers, "no_such_tool", {});
  assert.equal(res.isError, true);
  const body = JSON.parse(res.content[0].text);
  assert.deepEqual(body, { status: "error", error: "unknown tool 'no_such_tool'" });
});

test("dispatchTool wraps a throwing handler as an isError JSON envelope", async () => {
  const handlers: Record<string, ToolHandler> = {
    boom: async () => { throw new Error("boom"); },
  };
  const res = await dispatchTool(handlers, "boom", {});
  assert.equal(res.isError, true);
  const body = JSON.parse(res.content[0].text);
  assert.deepEqual(body, { status: "error", error: "boom" });
});

test("dispatchTool happy path returns handler text with no isError", async () => {
  const handlers: Record<string, ToolHandler> = { stub: async () => "ok" };
  const res = await dispatchTool(handlers, "stub", {});
  assert.equal(res.isError, undefined);
  assert.equal(res.content[0].text, "ok");
});

test("render_html rejects a block with an extra unknown key (nested strict schema)", async () => {
  const h = makeHandlers();
  await assert.rejects(() => h.render_html({
    output_path: "out.html",
    blocks: [{ type: "mermaid", source: "g", bogus: 1 }],
  }));
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
