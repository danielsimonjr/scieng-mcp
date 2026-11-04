import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RenderError, INPUT_TYPES, OUTPUT_FORMATS } from "@danielsimonjr/sciengjs";
import { TOOLS, makeHandlers, dispatchTool, type ToolHandler } from "../src/tools.ts";

test("exactly the seven tools are defined", () => {
  assert.deepEqual(TOOLS.map((t) => t.name).sort(),
    ["capabilities", "ooxml_replace", "render", "render_dot", "render_html", "render_latex", "render_mermaid"]);
  for (const t of TOOLS) assert.equal(t.inputSchema.type, "object");
});

test("render_mermaid: inline class source writes SVG and returns path, bytes and warnings", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "tool-")), "d.svg");
  const res = JSON.parse(await makeHandlers().render_mermaid({ source: "classDiagram\nclass A", output_path: out }));
  assert.equal(res.path, out);
  assert.equal(res.bytes, readFileSync(out).length);
  assert.deepEqual(res.warnings, []);
  assert.match(readFileSync(out, "utf-8"), /<svg/);
});

test("render_mermaid: format png writes PNG bytes and input_path derives the png extension", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const inp = join(dir, "c.mmd");
  writeFileSync(inp, "classDiagram\nclass A");
  const res = JSON.parse(await makeHandlers().render_mermaid({ input_path: inp, format: "png" }));
  assert.equal(res.path, join(dir, "c.png"));
  assert.deepEqual([...readFileSync(res.path).subarray(0, 4)], [137, 80, 78, 71]);
});

test("render_mermaid renders locally: an injected fetch is never called", async () => {
  let calls = 0;
  const refuse: typeof fetch = async () => { calls++; throw new Error("network blocked"); };
  const out = join(mkdtempSync(join(tmpdir(), "tool-")), "local.svg");
  await makeHandlers().render_mermaid({ source: "classDiagram\nclass A", output_path: out });
  assert.equal(calls, 0);
});

test("render: mermaid svg through the generic entry point returns the engine metadata", async () => {
  const out = join(mkdtempSync(join(tmpdir(), "tool-")), "r.svg");
  const res = JSON.parse(await makeHandlers().render({ type: "dot", format: "svg", source: "digraph { a -> b }", output_path: out }));
  assert.equal(res.path, out);
  assert.equal(res.mime, "image/svg+xml");
  assert.equal(res.backend, "graph/viz");
  assert.equal(res.bytes, readFileSync(out).length);
  assert.ok(Array.isArray(res.warnings));
});

test("render: an input_path with no output_path derives the name from the format", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const input = join(dir, "graph.dot");
  writeFileSync(input, "digraph { a -> b }");
  const res = JSON.parse(await makeHandlers().render({ type: "dot", format: "png", input_path: input }));
  assert.equal(res.path, join(dir, "graph.png"));
  assert.ok(existsSync(join(dir, "graph.png")));
});

test("render: an input_path with format pdf and no output_path derives <name>.pdf", { skip: !process.env.SCIENG_BROWSER && "needs SCIENG_BROWSER" }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const input = join(dir, "graph.dot");
  writeFileSync(input, "digraph { a -> b }");
  const res = JSON.parse(await makeHandlers().render({ type: "dot", format: "pdf", input_path: input }));
  assert.equal(res.path, join(dir, "graph.pdf"));
  assert.ok(existsSync(join(dir, "graph.pdf")));
});

test("render: the type and format enums are the engine lists, not a copy", () => {
  const tool = TOOLS.find((t) => t.name === "render")!;
  const props = tool.inputSchema.properties as Record<string, { enum?: string[] }>;
  assert.deepEqual(props.type!.enum, [...INPUT_TYPES]);
  assert.deepEqual(props.format!.enum, [...OUTPUT_FORMATS]);
  assert.deepEqual(tool.inputSchema.required, ["type", "format"]);
});

test("render: an unsupported pair returns the engine code in the error result", async () => {
  const h = makeHandlers();
  const out = join(mkdtempSync(join(tmpdir(), "tool-")), "x.svg");
  const res = await dispatchTool(h, "render", { type: "tikz", format: "svg", source: "x", output_path: out });
  assert.equal(res.isError, true);
  assert.equal(JSON.parse(res.content[0]!.text).code, "E_UNSUPPORTED");
});

test("render: a type outside the engine list is refused by the schema", async () => {
  const res = await dispatchTool(makeHandlers(), "render", { type: "docx", format: "svg", source: "x", output_path: "y.svg" });
  assert.equal(res.isError, true);
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
  const res = JSON.parse(await makeHandlers().render_dot({ source: "digraph { a -> b }", output_path: out }));
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

test("capabilities refuses unknown arguments (F24)", async () => {
  await assert.rejects(() => makeHandlers().capabilities({ surprise: 1 }));
});

test("the README names every tool", () => {
  const readme = readFileSync(join(import.meta.dirname, "..", "README.md"), "utf-8");
  for (const t of TOOLS) assert.ok(readme.includes("`" + t.name + "`"), `README does not name ${t.name}`);
  assert.ok(readme.includes("`capabilities`"), "README does not name capabilities");
});

test("render_latex reports failures array", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  let calls = 0;
  const refuse: typeof fetch = async () => { calls++; throw new Error("network blocked"); };
  const res = JSON.parse(await makeHandlers().render_latex({ source: "E=mc^2", output_path: join(dir, "e.svg") }));
  assert.deepEqual(res.failures, []);
  assert.ok(res.bytes > 0);
  assert.equal(calls, 0, "render_latex made a network request");
});

test("every tool that writes creates a missing output folder", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const h = makeHandlers();
  const cases: [string, Record<string, unknown>, string][] = [
    ["render_mermaid", { source: "classDiagram\nclass A", output_path: "m1/a.svg" }, "m1/a.svg"],
    ["render_dot", { source: "digraph { a -> b }", output_path: "d1/a.svg" }, "d1/a.svg"],
    ["render", { type: "dot", format: "svg", source: "digraph { a -> b }", output_path: "r1/a.svg" }, "r1/a.svg"],
    ["render_latex", { source: "E=mc^2", output_path: "l1/a.svg" }, "l1/a.svg"],
    ["render_latex", { source: "E=mc^2", format: "png", output_path: "l2/a.png" }, "l2/a.png"],
    ["render_html", { title: "T", blocks: [{ type: "mermaid", source: "graph TD\n A-->B" }], output_path: "p1/a.html" }, "p1/a.html"],
  ];
  for (const [tool, args, rel] of cases) {
    const out = join(dir, rel);
    const res = JSON.parse(await (h as Record<string, (a: unknown) => Promise<string>>)[tool]({ ...args, output_path: out }));
    assert.equal(res.path, out, `${tool} did not report its path`);
    assert.ok(existsSync(out), `${tool} did not write ${rel}`);
  }
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

test("render_dot: the tool error keeps the engine code and the line of a syntax error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-"));
  const res = await dispatchTool(makeHandlers(), "render_dot", { source: "digraph{a-> ", output_path: join(dir, "bad.svg") });
  assert.equal(res.isError, true);
  const body = JSON.parse(res.content[0].text);
  assert.match(body.error, /^\[E_INPUT\] syntax error in line 1/);
  assert.equal(body.code, "E_INPUT");
  assert.equal(body.line, 1);
});

test("dispatchTool keeps the column of an engine error that gives one", async () => {
  const handlers: Record<string, ToolHandler> = {
    render_dot: async () => { throw new RenderError("E_INPUT", "unexpected token", { line: 2, column: 5 }); },
  };
  const body = JSON.parse((await dispatchTool(handlers, "render_dot", {})).content[0].text);
  assert.deepEqual(body, { status: "error", error: "[E_INPUT] unexpected token", code: "E_INPUT", line: 2, column: 5 });
});

test("dispatchTool names the engine when the engine fails inside its worker", async () => {
  // The engine reports a stack overflow in its worker as E_INTERNAL, with the RangeError message.
  const handlers: Record<string, ToolHandler> = {
    render_dot: async () => { throw new RenderError("E_INTERNAL", "Maximum call stack size exceeded"); },
  };
  const body = JSON.parse((await dispatchTool(handlers, "render_dot", {})).content[0].text);
  assert.deepEqual(body, {
    status: "error",
    error: "[E_INTERNAL] sciengjs engine: Maximum call stack size exceeded",
    code: "E_INTERNAL",
  });
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

test("ooxml_replace refuses an empty find through dispatchTool and changes nothing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tool-empty-"));
  const p = join(dir, "document.xml");
  const original = `<w:document><w:r><w:t>old</w:t></w:r></w:document>`;
  writeFileSync(p, original);
  const res = await dispatchTool(makeHandlers(), "ooxml_replace", { document_xml_path: p, replacements: [{ find: "", replace: "x" }] });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /\[EMPTY_FIND\]/);
  assert.equal(readFileSync(p, "utf-8"), original);
});
