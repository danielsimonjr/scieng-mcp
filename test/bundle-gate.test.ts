// The gate of the built bundle. The bundle starts with no shell, in a folder that has no node_modules,
// with every network request refused. It must render DOT to SVG and PNG through the engine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isBuiltin } from "node:module";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE = join(REPO, "plugin", "bundle");
const PRELOAD = join(REPO, "scripts", "block-network.mjs");
const STEP_FIXTURE = join(REPO, "test", "fixtures", "mesh", "red_cube_blue_cylinder.step");
const VIEWER_PAGE_SPECIFIERS = ["three", "@@ORBIT@@", "@@GLTF@@"];
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const TEST_TIMEOUT_MS = 120_000;
const REQUEST_TIMEOUT_MS = 60_000;
const PACKAGE_ASSETS = join(dirname(createRequire(import.meta.url).resolve("@danielsimonjr/sciengjs/package.json")), "assets");

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
  assert.ok(existsSync(join(BUNDLE, "assets", "index_bg.wasm")), "plugin/bundle/assets/index_bg.wasm is missing");
});

test("every import of the bundle, static or dynamic, names a builtin or a file of the bundle", () => {
  let seen = 0;
  for (const f of modulesOf(BUNDLE)) {
    const specs = importSpecifiers(join(BUNDLE, f));
    seen += specs.length;
    // The mesh viewer page is text inside a module. Its browser import map names three and two placeholders. The page
    // gets them from the pinned files in assets/, not from node_modules. The exception holds only in the module of that page.
    const pageText = readFileSync(join(BUNDLE, f), "utf-8").includes("GLB_BASE64") ? VIEWER_PAGE_SPECIFIERS : [];
    const packages = specs.filter((s) => !isBuiltin(s) && !s.startsWith(".") && !pageText.includes(s));
    assert.deepEqual(packages, [], `plugin/bundle/${f} imports a package`);
  }
  assert.ok(seen > 0, "the scan found no import in the bundle, so it proves nothing");
});

test("render_dot and capabilities run from the built bundle, offline, with no node_modules", { timeout: TEST_TIMEOUT_MS }, async (t) => {
  const root = mkdtempSync(join(tmpdir(), "bundle-gate-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
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

    // A CAD file goes to the engine as bytes. The mesh stage loads its WASM reader from the bundle.
    const stepPath = join(dir, "part.step");
    cpSync(STEP_FIXTURE, stepPath);
    const glb = await callTool(s, 10, "render", { type: "step", format: "glb", input_path: stepPath, output_path: join(dir, "part.glb") });
    assert.equal(readFileSync(glb.path).subarray(0, 4).toString("latin1"), "glTF");
    const page = await callTool(s, 11, "render", { type: "step", format: "html", input_path: stepPath, output_path: join(dir, "part.html") });
    assert.match(readFileSync(page.path, "utf-8"), /GLB_BASE64/);

    // A CAD document is JSON text. The solid operations load manifold.wasm from the bundle.
    const cadSource = JSON.stringify({ version: 1, model: { type: "difference", children: [{ type: "cube", size: 2, center: true }, { type: "sphere", radius: 1.2 }] } });
    const stl = await callTool(s, 12, "render", { type: "cad", format: "stl", source: cadSource, output_path: join(dir, "part.stl") });
    const stlBytes = readFileSync(stl.path);
    const facets = stlBytes.readUInt32LE(80);
    assert.ok(facets > 0, "the stl holds no facet");
    assert.equal(stlBytes.length, 84 + 50 * facets);
    const cadGlb = await callTool(s, 13, "render", { type: "cad", format: "glb", source: cadSource, output_path: join(dir, "cad.glb") });
    assert.equal(readFileSync(cadGlb.path).subarray(0, 4).toString("latin1"), "glTF");

    // A SysML source goes through the engine parser, a view and the graph stage.
    const sysmlSource = "part def Car { part wheels : Wheel [4]; } part def Wheel;";
    const sysml = await callTool(s, 14, "render", { type: "sysml", format: "svg", source: sysmlSource, output_path: join(dir, "car.svg") });
    const sysmlSvg = readFileSync(sysml.path, "utf8");
    assert.ok(sysmlSvg.includes("<svg") && sysmlSvg.includes("wheels [4]"), "the sysml svg holds no composition label");
    const ibd = await callTool(s, 15, "render", {
      type: "sysml", format: "png", source: sysmlSource, options: { view: "ibd", root: "Car" }, output_path: join(dir, "car.png"),
    });
    assert.equal(readFileSync(ibd.path).subarray(0, 4).toString("latin1"), "\x89PNG");

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
});

/** The files under a folder, as paths relative to the folder with forward slashes, sorted. */
const filesUnder = (folder: string): string[] =>
  (readdirSync(folder, { recursive: true }) as string[])
    .filter((f) => statSync(join(folder, f)).isFile())
    .map((f) => f.split(sep).join("/"))
    .sort();

const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

/** The bytes that the index holds for a path. A checkout has the bytes of the commit in its index. */
const indexedBytes = (path: string): Buffer =>
  execFileSync("git", ["-C", REPO, "cat-file", "blob", `:${path}`], { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });

test("each committed engine asset is a byte-exact copy of the engine package", () => {
  const packaged = filesUnder(PACKAGE_ASSETS);
  const committed = execFileSync("git", ["-C", REPO, "ls-files", "--", "plugin/bundle/assets"], { encoding: "utf-8" })
    .split("\n")
    .filter((p) => p !== "")
    .map((p) => p.slice("plugin/bundle/assets/".length))
    .sort();
  assert.deepEqual(committed, packaged, "plugin/bundle/assets does not hold the files of the engine package");
  const differing = packaged.filter(
    (rel) => sha256(indexedBytes(`plugin/bundle/assets/${rel}`)) !== sha256(readFileSync(join(PACKAGE_ASSETS, rel))),
  );
  assert.deepEqual(differing, [], "these committed assets differ from the engine package");
});

test("each file of the bundle has mode 0644 on systems other than Windows", { skip: process.platform === "win32" && "Windows keeps no file mode" }, () => {
  const wrong = filesUnder(BUNDLE)
    .map((f) => ({ f, mode: statSync(join(BUNDLE, f)).mode & 0o777 }))
    .filter(({ mode }) => mode !== 0o644)
    .map(({ f, mode }) => `${f}: ${mode.toString(8)}`);
  assert.deepEqual(wrong, [], "these bundle files are not mode 0644");
});

test("every backend module of the engine registry is in the bundle", async () => {
  const dist = join(dirname(createRequire(import.meta.url).resolve("@danielsimonjr/sciengjs/package.json")), "dist");
  const { DEFAULT_REGISTRY } = await import(pathToFileURL(join(dist, "registry.js")).href) as {
    DEFAULT_REGISTRY: Record<string, { moduleUrl: string }>;
  };
  const missing = Object.entries(DEFAULT_REGISTRY)
    .map(([key, entry]) => ({ key, rel: relative(dist, fileURLToPath(entry.moduleUrl)).replace(/\.js$/, ".mjs").split(sep).join("/") }))
    .filter(({ rel }) => !existsSync(join(BUNDLE, rel)));
  assert.deepEqual(missing, [], "these registry backends are not in plugin/bundle");
});

test("tikz renders from the built bundle with the TeX bundles in a local folder, offline", { timeout: 300_000 }, async (t) => {
  // The test process fetches the release bundles of the engine version and checks each pinned hash. The server then
  // reads them from a file: URL, so the server itself makes no network request.
  const pins = JSON.parse(readFileSync(join(dirname(createRequire(import.meta.url).resolve("@danielsimonjr/sciengjs/package.json")), "dist", "tex", "bundles.json"), "utf-8")) as { name: string; file: string; sha256: string }[];
  const version = JSON.parse(readFileSync(createRequire(import.meta.url).resolve("@danielsimonjr/sciengjs/package.json"), "utf-8")).version as string;
  const root = mkdtempSync(join(tmpdir(), "bundle-gate-tikz-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const texDir = join(root, "tex");
  mkdirSync(texDir);
  const core = pins.find((p) => p.name === "core")!;
  const res = await fetch(`https://github.com/danielsimonjr/sciengjs/releases/download/v${version}/${core.file}`);
  assert.equal(res.status, 200, `the release asset ${core.file} of v${version} is not reachable`);
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.equal(sha256(bytes), core.sha256, "the release asset does not match the pinned hash of the engine");
  writeFileSync(join(texDir, core.file), bytes);

  const dir = join(root, "fresh");
  const netLog = join(root, "network.log");
  cpSync(BUNDLE, join(dir, "bundle"), { recursive: true });
  const child = spawn(process.execPath, ["--import", pathToFileURL(PRELOAD).href, join(dir, "bundle", "index.mjs")], {
    cwd: dir,
    env: { ...process.env, SCIENG_TEST_NET_LOG: netLog, SCIENG_CACHE_DIR: join(root, "cache"), SCIENG_TEX_BUNDLE_URL: pathToFileURL(texDir).href + "/" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  try {
    const s = session(child);
    await s.request(1, "initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "bundle-gate", version: "0" } });
    s.notify("notifications/initialized", {});
    const source = String.raw`\begin{tikzpicture}\draw (0,0) -- (2,1) node[right]{$x^2$};\end{tikzpicture}`;
    const out = await callTool(s, 2, "render", { type: "tikz", format: "svg", source, output_path: join(dir, "pic.svg") });
    const svg = readFileSync(out.path, "utf-8");
    assert.ok(svg.startsWith("<svg"), "the tikz output is not an SVG");
    assert.ok((svg.match(/<path/g) ?? []).length >= 3, "the tikz svg holds fewer than 3 paths");
    assert.equal((svg.match(/<text/g) ?? []).length, 0, "the tikz svg holds a <text> element");
  } finally {
    child.kill();
    await exited;
  }
  const log = existsSync(netLog) ? readFileSync(netLog, "utf-8") : "";
  assert.equal(log, "", "the bundle attempted a network request");
});
