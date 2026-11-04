import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { RenderError } from "@danielsimonjr/sciengjs";
import * as mermaidModule from "../src/render-mermaid.ts";
import { renderMermaidSource } from "../src/render-mermaid.ts";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CLASS_SOURCE = "classDiagram\nclass Animal\nAnimal : +int age";
const FLOW_SOURCE = "flowchart TD\n A-->B";
const scratch = (): string => mkdtempSync(join(tmpdir(), "mmd-"));

test("the module holds no remote path: no encoder, no mermaid.ink, no fetch", () => {
  assert.equal("encodePako" in mermaidModule, false);
  const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "src", "render-mermaid.ts"), "utf-8");
  assert.doesNotMatch(text, /mermaid\.ink|pako|fetch|httpText/);
});

test("a class diagram renders to an SVG file locally", async () => {
  const out = join(scratch(), "c.svg");
  const res = await renderMermaidSource(CLASS_SOURCE, out, "svg");
  const bytes = readFileSync(out);
  assert.match(bytes.toString("utf-8"), /<svg/);
  assert.equal(res.bytes, bytes.length);
  assert.deepEqual(res.warnings, []);
});

test("a class diagram renders to a PNG file", async () => {
  const out = join(scratch(), "c.png");
  await renderMermaidSource(CLASS_SOURCE, out, "png");
  assert.deepEqual([...readFileSync(out).subarray(0, 8)], PNG_SIGNATURE);
});

test("a flowchart without SCIENG_BROWSER rejects with E_STAGE_MISSING from the engine", { skip: Boolean(process.env.SCIENG_BROWSER) && "browser configured" }, async () => {
  await assert.rejects(renderMermaidSource(FLOW_SOURCE, join(scratch(), "f.svg"), "svg"), (err: unknown) => {
    assert.ok(err instanceof RenderError, "the error is not the engine's RenderError");
    assert.equal(err.code, "E_STAGE_MISSING");
    return true;
  });
});

test("a flowchart renders to SVG when SCIENG_BROWSER is set", { skip: !process.env.SCIENG_BROWSER && "no SCIENG_BROWSER" }, async () => {
  const out = join(scratch(), "f.svg");
  await renderMermaidSource(FLOW_SOURCE, out, "svg");
  assert.match(readFileSync(out, "utf-8"), /<svg/);
});

test("a class diagram renders to a PDF when SCIENG_BROWSER is set", { skip: !process.env.SCIENG_BROWSER && "no SCIENG_BROWSER" }, async () => {
  const out = join(scratch(), "c.pdf");
  await renderMermaidSource(CLASS_SOURCE, out, "pdf");
  assert.equal(readFileSync(out, "utf-8").slice(0, 5), "%PDF-");
});
