import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The child runs under the Node permission model with every permission except --allow-net.
// A network call in a render path then fails, and the child exits with a non-zero code.
const PERMISSIONS = [
  "--permission",
  "--allow-fs-read=*",
  "--allow-fs-write=*",
  "--allow-worker",
  "--allow-child-process",
  "--allow-wasi",
];

test("render_latex, render_mermaid and render_dot render svg with no network permission", () => {
  const dir = mkdtempSync(join(tmpdir(), "nonet-"));
  const tools = pathToFileURL(join(import.meta.dirname, "..", "src", "tools.ts")).href;
  const script = join(dir, "child.mts");
  writeFileSync(script, [
    `import { makeHandlers } from ${JSON.stringify(tools)};`,
    `const h = makeHandlers();`,
    `const dir = ${JSON.stringify(dir)};`,
    `const out = [];`,
    `out.push(JSON.parse(await h.render_latex({ source: "E=mc^2", output_path: dir + "/l.svg" })).path);`,
    `out.push(JSON.parse(await h.render_mermaid({ source: "classDiagram\\nclass A", output_path: dir + "/m.svg" })).path);`,
    `out.push(JSON.parse(await h.render_dot({ source: "digraph { a -> b }", output_path: dir + "/d.svg" })).path);`,
    `console.log(JSON.stringify(out));`,
  ].join("\n"));
  const r = spawnSync(process.execPath, [...PERMISSIONS, script], { encoding: "utf-8", timeout: 120_000 });
  assert.equal(r.status, 0, `child failed (status ${r.status}):\n${r.stderr}`);
  const paths = JSON.parse(r.stdout.trim().split("\n").pop() ?? "[]") as string[];
  assert.equal(paths.length, 3);
  for (const p of paths) assert.match(readFileSync(p, "utf-8"), /<svg/);
});
