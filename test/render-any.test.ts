import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderAny } from "../src/render-any.ts";

const scratch = (): string => mkdtempSync(join(tmpdir(), "any-"));

test("renderAny writes a DOT SVG and reports the engine metadata", async () => {
  const out = join(scratch(), "g.svg");
  const res = await renderAny("dot", "svg", "digraph { a -> b }", out);
  assert.equal(res.path, out);
  assert.equal(res.bytes, readFileSync(out).length);
  assert.equal(res.mime, "image/svg+xml");
  assert.equal(res.backend, "graph/viz");
  assert.match(readFileSync(out, "utf-8"), /<svg/);
});

test("renderAny passes per-type options to the engine", async () => {
  const out = join(scratch(), "m.svg");
  const res = await renderAny("mermaid", "svg", "classDiagram\nclass A", out, { lenient: true });
  assert.match(readFileSync(out, "utf-8"), /<svg/);
  assert.ok(Array.isArray(res.warnings));
});

test("renderAny propagates the engine error code for an unsupported pair", async () => {
  await assert.rejects(renderAny("tikz", "svg", "x", join(scratch(), "x.svg")), (err: unknown) => {
    assert.equal((err as { code?: string }).code, "E_UNSUPPORTED");
    return true;
  });
});

const PLOT = JSON.stringify({ data: [{ x: [1, 2, 3], y: [1, 4, 9], type: "scatter" }], layout: { title: { text: "t" } } });

test("renderAny draws a plot source as svg, png and html (engine plot stage)", async () => {
  const dir = scratch();
  const svg = await renderAny("plot", "svg", PLOT, join(dir, "p.svg"));
  assert.equal(svg.mime, "image/svg+xml");
  assert.match(readFileSync(join(dir, "p.svg"), "utf-8"), /<svg/);
  const png = await renderAny("plot", "png", PLOT, join(dir, "p.png"));
  assert.equal(png.mime, "image/png");
  assert.equal(readFileSync(join(dir, "p.png")).subarray(1, 4).toString("ascii"), "PNG");
  const html = await renderAny("plot", "html", PLOT, join(dir, "p.html"));
  assert.match(html.mime, /text\/html/);
});
