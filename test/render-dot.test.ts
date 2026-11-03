import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderDotSource } from "../src/render-dot.ts";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const scratch = (): string => mkdtempSync(join(tmpdir(), "dot-"));

test("renderDotSource draws an SVG file with the engine", async () => {
  const out = join(scratch(), "g.svg");
  const res = await renderDotSource("digraph { a -> b }", out, "svg");
  const bytes = readFileSync(out);
  assert.match(bytes.toString("utf-8"), /<svg/);
  assert.equal(res.bytes, bytes.length);
  assert.deepEqual(res.warnings, []);
});

test("renderDotSource draws a PNG file with the raster stage", async () => {
  const out = join(scratch(), "g.png");
  const res = await renderDotSource("digraph { a -> b }", out, "png");
  const bytes = readFileSync(out);
  assert.deepEqual([...bytes.subarray(0, 8)], PNG_SIGNATURE);
  assert.equal(res.bytes, bytes.length);
});

test("renderDotSource removes an image attribute and reports a warning", async () => {
  const out = join(scratch(), "i.svg");
  const res = await renderDotSource('digraph { a [image="/tmp/x.png"] }', out, "svg");
  assert.ok(res.warnings.some((w) => /image attribute/.test(w)), JSON.stringify(res.warnings));
  assert.doesNotMatch(readFileSync(out, "utf-8"), /x\.png/);
});

test("renderDotSource makes no network request", async () => {
  const calls: unknown[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: unknown) => {
    calls.push(input);
    throw new Error("network blocked");
  }) as typeof fetch;
  try {
    await renderDotSource("digraph { a -> b }", join(scratch(), "n.svg"), "svg");
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(calls.length, 0);
});

test("renderDotSource rejects DOT that Graphviz cannot read, with E_INPUT", async () => {
  await assert.rejects(
    () => renderDotSource("digraph {", join(scratch(), "bad.svg"), "svg"),
    (err: unknown) => (err as { code?: string }).code === "E_INPUT",
  );
});
