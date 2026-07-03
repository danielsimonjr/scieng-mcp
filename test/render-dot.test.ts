import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderDot } from "../src/render-dot.ts";

test("renderDot POSTs DOT and writes returned SVG", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dot-"));
  const inp = join(dir, "g.dot");
  const out = join(dir, "g.svg");
  writeFileSync(inp, "digraph{A->B}");
  let sentBody = "";
  const fake: typeof fetch = async (_u, init) => {
    sentBody = String(init?.body ?? "");
    return new Response("<svg>graph</svg>", { status: 200 });
  };
  const svg = await renderDot(inp, out, fake);
  assert.match(svg, /<svg>/);
  assert.equal(readFileSync(out, "utf-8"), "<svg>graph</svg>");
  assert.match(sentBody, /digraph/);
  assert.match(sentBody, /"layout":"dot"/);
});

test("renderDot throws when response has no SVG", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dot-"));
  const inp = join(dir, "g.dot");
  writeFileSync(inp, "digraph{}");
  const fake: typeof fetch = async () => new Response("nope", { status: 200 });
  await assert.rejects(() => renderDot(inp, join(dir, "g.svg"), fake), /no SVG/);
});
