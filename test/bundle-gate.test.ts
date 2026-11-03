// The gate of the built bundle. The bundle starts with no shell, in a folder that has no node_modules,
// with every network request refused. It must render DOT to SVG and PNG through the engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE = join(REPO, "plugin", "bundle");
const PRELOAD = join(REPO, "scripts", "block-network.mjs");
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const TEST_TIMEOUT_MS = 120_000;
const REQUEST_TIMEOUT_MS = 60_000;

/** The JavaScript files of a folder, relative to the folder. */
const modulesOf = (folder: string): string[] =>
  (readdirSync(folder, { recursive: true }) as string[]).filter((f) => f.endsWith(".mjs"));

/**
 * The import specifiers of a module: each static import or export that names a module (the statement may span
 * lines), each side-effect import, and each dynamic import(). A line inside a string does not start a statement.
 */
function importSpecifiers(file: string): string[] {
  const text = readFileSync(file, "utf-8");
  const statements = [...text.matchAll(/^(?:import|export)\b[^;'"]*?\bfrom\s*["']([^"']+)["']|^import\s*["']([^"']+)["']/gm)];
  const dynamic = [...text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)];
  return [...statements, ...dynamic].map((m) => (m[1] ?? m[2])!);
}

/** A JSON-RPC session over the stdio of the server process. */
function session(child: ChildProcessWithoutNullStreams) {
  let buffer = "";
  const waiting = new Map<number, (msg: { id: number; result?: any; error?: unknown }) => void>();
  child.stdout.setEncoding("utf-8");
  child.stdout.on("data", (chunk: string) => {
    buffer += chunk;
    let end = buffer.indexOf("\n");
    while (end >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (line !== "") {
        const msg = JSON.parse(line) as { id: number; result?: any; error?: unknown };
        waiting.get(msg.id)?.(msg);
        waiting.delete(msg.id);
      }
      end = buffer.indexOf("\n");
    }
  });
  return {
    request(id: number, method: string, params: unknown): Promise<{ id: number; result?: any; error?: unknown }> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`no response to ${method} within ${REQUEST_TIMEOUT_MS} ms`)), REQUEST_TIMEOUT_MS);
        waiting.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      });
    },
    notify(method: string, params: unknown): void {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
    },
  };
}

/** Runs one tool call and returns the parsed JSON text of its result. */
async function callTool(s: ReturnType<typeof session>, id: number, name: string, args: unknown): Promise<any> {
  const msg = await s.request(id, "tools/call", { name, arguments: args });
  const text = msg.result?.content?.[0]?.text;
  assert.equal(typeof text, "string", `${name}: no text in the result`);
  assert.notEqual(msg.result?.isError, true, `${name} failed: ${text}`);
  return JSON.parse(text);
}

test("the bundle holds the worker entry, the two backends and the assets beside index.mjs", () => {
  for (const f of ["index.mjs", "entry.mjs", join("graph", "backend-svg.mjs"), join("graph", "backend-png.mjs")]) {
    assert.ok(existsSync(join(BUNDLE, f)), `plugin/bundle/${f} is missing`);
  }
  assert.ok(existsSync(join(BUNDLE, "assets", "fonts", "LiberationSerif-Regular.ttf")), "the bundled font is missing");
  const wasm = (readdirSync(join(BUNDLE, "assets"), { recursive: true }) as string[]).filter((f) => f.endsWith(".wasm"));
  assert.ok(wasm.length > 0, "plugin/bundle/assets holds no .wasm file");
});

test("every import of the bundle, static or dynamic, names a builtin or a file of the bundle", () => {
  let seen = 0;
  for (const f of modulesOf(BUNDLE)) {
    const specs = importSpecifiers(join(BUNDLE, f));
    seen += specs.length;
    const packages = specs.filter((s) => !s.startsWith("node:") && !s.startsWith("."));
    assert.deepEqual(packages, [], `plugin/bundle/${f} imports a package`);
  }
  assert.ok(seen > 0, "the scan found no import in the bundle, so it proves nothing");
});

test("render_dot and capabilities run from the built bundle, offline, with no node_modules", { timeout: TEST_TIMEOUT_MS }, async () => {
  const root = mkdtempSync(join(tmpdir(), "bundle-gate-"));
  const dir = join(root, "fresh");
  const netLog = join(root, "network.log");
  cpSync(BUNDLE, join(dir, "bundle"), { recursive: true });
  assert.equal(existsSync(join(dir, "node_modules")), false, "the fresh folder holds node_modules");

  const child = spawn(process.execPath, ["--import", pathToFileURL(PRELOAD).href, join(dir, "bundle", "index.mjs")], {
    cwd: dir,
    env: { ...process.env, SCIENG_TEST_NET_LOG: netLog },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf-8");
  child.stderr.on("data", (d: string) => { stderr += d; });
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));

  try {
    const s = session(child);
    const init = await s.request(1, "initialize", {
      protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "bundle-gate", version: "0" },
    });
    assert.ok(init.result?.serverInfo, `no serverInfo; stderr: ${stderr}`);
    s.notify("notifications/initialized", {});

    const caps = await callTool(s, 2, "capabilities", {});
    const dotSvg = caps.capabilities.find((c: { type: string; format: string }) => c.type === "dot" && c.format === "svg");
    assert.equal(dotSvg?.ready, true, "dot to svg is not ready in the bundle");

    const svgPath = join(dir, "g.svg");
    await callTool(s, 3, "render_dot", { source: "digraph { a -> b }", output_path: svgPath });
    assert.match(readFileSync(svgPath, "utf-8"), /<svg/);

    const pngPath = join(dir, "g.png");
    await callTool(s, 4, "render_dot", { source: "digraph { a -> b }", output_path: pngPath, format: "png" });
    assert.deepEqual([...readFileSync(pngPath).subarray(0, 8)], PNG_SIGNATURE);

    const img = await callTool(s, 5, "render_dot", {
      source: 'digraph { a [image="/tmp/x.png"] }', output_path: join(dir, "i.svg"),
    });
    assert.ok(img.warnings.some((w: string) => /image attribute/.test(w)), JSON.stringify(img.warnings));
  } finally {
    child.kill();
    await exited;
  }

  const log = existsSync(netLog) ? readFileSync(netLog, "utf-8") : "";
  assert.equal(log, "", "the bundle attempted a network request");
  rmSync(root, { recursive: true, force: true });
});
