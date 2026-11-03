// Checks the repository metadata that ships with the package: the licence file, the licence
// field of package.json, and the version that package.json and the plugin manifest share.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const readJson = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(ROOT, file), "utf-8")) as Record<string, unknown>;

test("the repository root has a LICENSE file with the MIT text and the copyright line", () => {
  const file = join(ROOT, "LICENSE");
  assert.ok(existsSync(file), "LICENSE is missing at the repository root");
  const text = readFileSync(file, "utf-8");
  assert.ok(text.startsWith("MIT License\n\nCopyright (c) 2026 Daniel Simon Jr.\n"), "LICENSE does not start with the MIT header");
  assert.match(text, /Permission is hereby granted, free of charge, to any person obtaining a copy/);
});

test("package.json declares the MIT licence", () => {
  assert.equal(readJson("package.json").license, "MIT");
});

test("package.json and plugin/.claude-plugin/plugin.json declare the same version", () => {
  const pkg = readJson("package.json").version;
  const plugin = readJson("plugin/.claude-plugin/plugin.json").version;
  assert.equal(typeof pkg, "string");
  assert.equal(plugin, pkg, `package.json has ${String(pkg)} and plugin.json has ${String(plugin)}`);
});

test("the README has a Quick Start section with the marketplace command and one example command", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  assert.match(readme, /^## Quick Start$/m);
  const section = readme.slice(readme.search(/^## Quick Start$/m));
  assert.match(section, /\/plugin marketplace add danielsimonjr\/skills/);
  assert.match(section, /\/scieng-mcp:mermaid /);
});

test("the README has a License section that links LICENSE and names the third-party assets table", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  assert.match(readme, /^## License$/m);
  const section = readme.slice(readme.search(/^## License$/m));
  assert.match(section, /\[LICENSE\]\(LICENSE\)/);
  assert.match(section, /plugin\/README\.md/);
  assert.match(section, /Third-party assets/);
});
