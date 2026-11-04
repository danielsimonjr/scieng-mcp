import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (...p: string[]): string => readFileSync(join(import.meta.dirname, "..", ...p), "utf-8");

test("the docs describe render_latex with format and scale, and dpi only as a deprecated alias", () => {
  const readme = read("README.md").split("\n").find((l) => l.startsWith("| `render_latex`")) ?? "";
  assert.match(readme, /`format`, `scale`, `dpi` \(deprecated\)/);
  for (const f of ["API.md", "DATAFLOW.md", "COMPONENTS.md"]) {
    const text = read("docs", "architecture", f);
    assert.doesNotMatch(text, /The default is 200|dpi\?: number|fetchImpl\?: FetchLike \} = \{\}|makeHandlers\(fetchImpl/, `${f} still describes dpi or fetchImpl`);
  }
  assert.match(read("docs", "architecture", "API.md"), /`dpi` is a deprecated alias/);
});

test("the skill says the default render keeps the source on this machine", () => {
  const skill = read("plugin", "skills", "scieng", "SKILL.md");
  assert.match(skill, /The default render of mermaid, dot and latex keeps the source on this machine\. `--local` makes an HTML page that loads pinned CDN files and renders in the browser\./);
});
