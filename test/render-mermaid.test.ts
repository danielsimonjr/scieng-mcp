import { test } from "node:test";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodePako, renderMermaid } from "../src/render-mermaid.ts";

test("encodePako round-trips through pako base64url", () => {
  const enc = encodePako("graph TD\n A-->B");
  const json = JSON.parse(inflateSync(Buffer.from(enc, "base64url")).toString("utf-8"));
  assert.equal(json.code, "graph TD\n A-->B");
  assert.equal(json.mermaid.theme, "default");
});

test("renderMermaid GETs pako URL and writes SVG", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mmd-"));
  const inp = join(dir, "d.mmd");
  const out = join(dir, "d.svg");
  writeFileSync(inp, "graph TD\n A-->B");
  let calledUrl = "";
  const fake: typeof fetch = async (u) => { calledUrl = String(u); return new Response("<svg id='mermaid'/>", { status: 200 }); };
  const svg = await renderMermaid(inp, out, fake);
  assert.match(calledUrl, /^https:\/\/mermaid\.ink\/svg\/pako:/);
  assert.match(svg, /<svg/);
  assert.match(readFileSync(out, "utf-8"), /<svg/);
});
