// Checks the shipped prose of the plugin against the code: the slash commands, the skill and the
// reference files that they name. A command that names a tool or a file that does not exist fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { STDIO_DEFAULT_MAX_BUFFER_SIZE } from "@modelcontextprotocol/server";
import { TOOLS } from "../src/tools.ts";

const ROOT = join(import.meta.dirname, "..");
const PLUGIN = join(ROOT, "plugin");
const COMMANDS = join(PLUGIN, "commands");
const SKILL_DIR = join(PLUGIN, "skills", "scieng");
const EXPECTED = ["circuit", "dot", "latex", "mermaid", "playground", "plot", "wavedrom"];
const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));

/** Splits a Markdown file into its YAML frontmatter keys and its body. */
function parse(file: string): { meta: Record<string, string>; body: string } {
  const text = readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  assert.ok(m, `${file}: no frontmatter`);
  const meta: Record<string, string> = {};
  for (const line of m[1]!.split("\n")) {
    const kv = /^([a-z-]+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]!] = kv[2]!.replace(/^"(.*)"$/, "$1");
  }
  return { meta, body: m[2]! };
}

const commandFiles = (): string[] =>
  existsSync(COMMANDS) ? readdirSync(COMMANDS).filter((f) => f.endsWith(".md")).sort() : [];

test("the plugin ships one command per diagram type, and no other", () => {
  assert.deepEqual(commandFiles().map((f) => f.replace(/\.md$/, "")), EXPECTED);
});

test("each command has a description, an argument hint and a body that reads $ARGUMENTS", () => {
  for (const f of commandFiles()) {
    const { meta, body } = parse(join(COMMANDS, f));
    assert.ok(meta["description"] && meta["description"].length <= 200, `${f}: description missing or too long`);
    assert.ok(meta["argument-hint"], `${f}: argument-hint missing`);
    assert.match(body, /\$ARGUMENTS/, `${f}: the body does not read $ARGUMENTS`);
  }
});

test("each tool name that a command or the skill names is a real tool", () => {
  const files = [...commandFiles().map((f) => join(COMMANDS, f)), join(SKILL_DIR, "SKILL.md")];
  for (const file of files) {
    for (const name of readFileSync(file, "utf-8").match(/\b(?:render|ooxml)_[a-z]+\b/g) ?? []) {
      assert.ok(TOOL_NAMES.has(name), `${file}: names ${name}, which is not a tool`);
    }
  }
});

test("each reference file that a command or the skill names exists in the skill folder", () => {
  const files = [...commandFiles().map((f) => join(COMMANDS, f)), join(SKILL_DIR, "SKILL.md")];
  for (const file of files) {
    for (const ref of readFileSync(file, "utf-8").match(/\b[A-Z][A-Z-]+\.md\b/g) ?? []) {
      if (ref === "SKILL.md" || ref === "AGENTS.md" || ref === "README.md") continue;
      assert.ok(existsSync(join(SKILL_DIR, ref)), `${file}: names ${ref}, which is not in the skill folder`);
    }
  }
});

test("the remote commands name the service that receives the source, and offer --local", () => {
  const remote: Record<string, string> = { mermaid: "mermaid.ink", latex: "codecogs.com" };
  for (const [cmd, host] of Object.entries(remote)) {
    const { meta, body } = parse(join(COMMANDS, `${cmd}.md`));
    assert.ok(body.includes(host), `${cmd}: does not name ${host}`);
    assert.ok(meta["argument-hint"]!.includes("--local") && body.includes("--local"), `${cmd}: no --local`);
  }
});

test("the dot command renders locally and names no remote service", () => {
  const { body } = parse(join(COMMANDS, "dot.md"));
  assert.doesNotMatch(body, /quickchart/i);
  assert.match(body, /locally|the engine/i);
});

test("no shipped file of the plugin names quickchart", () => {
  for (const f of readdirSync(PLUGIN, { recursive: true }) as string[]) {
    if (!/\.(md|mjs|js|json|ts)$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(join(PLUGIN, f), "utf-8"), /quickchart/i, `${f} names quickchart`);
  }
});

test("the skill keeps its name and its trigger stays inside the frontmatter limits", () => {
  const { meta, body } = parse(join(SKILL_DIR, "SKILL.md"));
  assert.equal(meta["name"], "scieng");
  const d = meta["description"]!;
  assert.ok(d.length > 0 && d.length <= 1024, `description is ${d.length} characters`);
  assert.ok(!/[<>]/.test(d), "description holds < or >");
  for (const cmd of EXPECTED) assert.ok(body.includes(`/scieng-mcp:${cmd}`), `the skill does not list /scieng-mcp:${cmd}`);
});

test("each script that the skill says is in this skill directory exists there", () => {
  const files = readdirSync(SKILL_DIR).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const text = readFileSync(join(SKILL_DIR, f), "utf-8");
    for (const m of text.matchAll(/`([\w.-]+\.(?:ts|mjs|js|py))`[^\n]*?in this skill directory/g)) {
      assert.ok(existsSync(join(SKILL_DIR, m[1]!)), `${f}: names ${m[1]} in this skill directory, which does not exist`);
    }
  }
});

test("the plugin README states the Node.js version that package.json declares", () => {
  const { engines } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { engines: { node: string } };
  const major = /\d+/.exec(engines.node)?.[0];
  assert.ok(major, `package.json declares engines.node ${engines.node}`);
  assert.match(readFileSync(join(PLUGIN, "README.md"), "utf-8"), new RegExp(`Node\\.js ${major} or later`));
});

test("the plugin README states the stdio message limit of the MCP SDK", () => {
  const limit = String(STDIO_DEFAULT_MAX_BUFFER_SIZE).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  assert.ok(readFileSync(join(PLUGIN, "README.md"), "utf-8").includes(`${limit} bytes`), `the README does not state ${limit} bytes`);
});

test("the plugin README has a Third-party assets section that names every bundled engine asset", () => {
  const assets = join(PLUGIN, "bundle", "assets");
  const readme = readFileSync(join(PLUGIN, "README.md"), "utf-8");
  assert.match(readme, /^## Third-party assets$/m);
  const files = (readdirSync(assets, { recursive: true }) as string[]).filter((f) => statSync(join(assets, f)).isFile());
  assert.ok(files.length > 0, "no engine assets are bundled");
  for (const f of files) assert.ok(readme.includes(basename(f)), `the README does not name ${basename(f)}`);
});

test("the circuit command and SCIENG.md forbid a wire that crosses a part", () => {
  const rule = /never draw a wire across a part/i;
  assert.match(parse(join(COMMANDS, "circuit.md")).body, rule, "circuit.md");
  assert.match(readFileSync(join(SKILL_DIR, "SCIENG.md"), "utf-8"), rule, "SCIENG.md");
});
