// Checks the shipped prose of the plugin against the code: the slash commands, the skill and the
// reference files that they name. A command that names a tool or a file that does not exist fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOLS } from "../src/tools.ts";

const PLUGIN = join(import.meta.dirname, "..", "plugin");
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
  const remote: Record<string, string> = { mermaid: "mermaid.ink", dot: "quickchart.io", latex: "codecogs.com" };
  for (const [cmd, host] of Object.entries(remote)) {
    const { meta, body } = parse(join(COMMANDS, `${cmd}.md`));
    assert.ok(body.includes(host), `${cmd}: does not name ${host}`);
    assert.ok(meta["argument-hint"]!.includes("--local") && body.includes("--local"), `${cmd}: no --local`);
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
