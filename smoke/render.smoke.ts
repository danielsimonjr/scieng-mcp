#!/usr/bin/env node
/**
 * Live-API smoke test — NOT part of the `node --test` unit suite.
 *
 * Run on demand: `node render.smoke.ts`
 * Requires network access. Hits the real mermaid.ink and latex.codecogs.com
 * APIs (no fetch mocking). The DOT case renders through the local engine. It asserts each renderer
 * returns a response containing "<svg". Intentionally named `*.smoke.ts`
 * (not `*.test.ts`) so Node's test runner skips it and it is never run in
 * CI.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderDotSource } from "../src/render-dot.ts";
import { renderMermaid } from "../src/render-mermaid.ts";
import { renderLatex } from "../src/render-latex.ts";

async function main(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "scieng-smoke-"));
  const cases: { name: string; run: () => Promise<string> }[] = [
    {
      name: "renderDot (local engine)",
      run: async () => {
        const out = join(dir, "g.svg");
        await renderDotSource("digraph G { A -> B; }", out, "svg");
        return readFileSync(out, "utf-8");
      },
    },
    {
      name: "renderMermaid (mermaid.ink)",
      run: () => {
        const inp = join(dir, "d.mmd");
        writeFileSync(inp, "graph TD\n A-->B");
        return renderMermaid(inp, join(dir, "d.svg"));
      },
    },
    {
      name: "renderLatex (latex.codecogs.com)",
      run: () => {
        const inp = join(dir, "e.tex");
        writeFileSync(inp, "E = mc^2");
        return renderLatex(inp, join(dir, "e.svg"));
      },
    },
  ];

  let failures = 0;
  for (const { name, run } of cases) {
    try {
      const svg = await run();
      if (!svg.includes("<svg")) throw new Error("response did not contain <svg");
      console.log(`PASS  ${name}`);
    } catch (err) {
      failures++;
      console.error(`FAIL  ${name}: ${(err as Error).message}`);
    }
  }

  if (failures > 0) {
    console.error(`${failures}/${cases.length} live smoke checks failed`);
    process.exit(1);
  }
  console.log(`${cases.length}/${cases.length} live smoke checks passed`);
}

main();
