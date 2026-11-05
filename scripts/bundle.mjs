// Builds the plugin bundle into plugin/bundle/: the MCP server as index.mjs, the engine worker and its
// two backends beside it, and the engine assets in assets/. Run from the repository root.
import { build } from "esbuild";
import { chmodSync, cpSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "plugin", "bundle");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

// The engine loads its worker and its backends by URL, from the folder of the module that holds the
// URL. A single-file bundle has no such files, so each one is emitted here at the path the engine
// computes: entry.mjs beside index.mjs, and graph/backend-*.mjs below it.
const engineRoot = dirname(createRequire(import.meta.url).resolve("@danielsimonjr/sciengjs/package.json"));
const engineDist = join(engineRoot, "dist");

// The backends come from the engine's own registry, so the bundle always includes each new backend.
const { DEFAULT_REGISTRY } = await import(pathToFileURL(join(engineDist, "registry.js")).href);
const backendEntries = Object.fromEntries(
  Object.values(DEFAULT_REGISTRY).map(({ moduleUrl }) => {
    const rel = relative(engineDist, fileURLToPath(moduleUrl)).replace(/\.js$/, "");
    return [rel.split(sep).join("/"), join(engineDist, rel + ".js")];
  }),
);

// ESM banner shim: bundled CJS deps need require/__filename/__dirname.
const banner =
  "import { createRequire as __createRequire } from 'node:module';" +
  "import { fileURLToPath as __fileURLToPath } from 'node:url';" +
  "import { dirname as __dirnameOf } from 'node:path';" +
  "const require = __createRequire(import.meta.url);" +
  "const __filename = __fileURLToPath(import.meta.url);" +
  "const __dirname = __dirnameOf(__filename);";

// The bundle is generated. Remove the old files first, so that no stale module stays behind.
rmSync(OUT, { recursive: true, force: true });

await build({
  entryPoints: {
    index: join(ROOT, "src", "index.ts"),
    entry: join(engineDist, "worker", "entry.js"),
    ...backendEntries,
  },
  bundle: true,
  splitting: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: OUT,
  outExtension: { ".js": ".mjs" },
  banner: { js: banner },
  // Compile-time version: serverInfo was a hardcoded literal, so it reported a stale
  // number no matter what the manifests said - the one version a client can see, lying.
  // __SCIENG_BUNDLED__ makes src/engine-config.ts send the assets folder beside index.mjs.
  define: { __PKG_VERSION__: JSON.stringify(pkg.version), __SCIENG_BUNDLED__: "true" },
  logLevel: "warning",
});

// The engine assets: the bundled font, the licence texts and the WASM file of the raster stage.
cpSync(join(engineRoot, "assets"), join(OUT, "assets"), { recursive: true });

// The mesh stage reads its WASM file from the folder of the bundled module, beside index.mjs. The licence texts
// of occt-import-js (LGPL-2.1) and of OCCT go beside it. The engine resolves the package; the bundle resolves it the same way.
const occtDist = join(dirname(createRequire(join(engineRoot, "package.json")).resolve("occt-import-js")));
for (const [from, to] of [["occt-import-js.wasm", "occt-import-js.wasm"], ["license.occt-import-js.txt", "occt-import-js.LICENSE.txt"], ["license.occt.txt", "occt.LICENSE.txt"]]) {
  cpSync(join(occtDist, from), join(OUT, to));
}

// The CAD solid operations read manifold.wasm from the folder of the bundled module too. The Apache-2.0 licence of
// manifold-3d goes beside it.
const manifoldDist = dirname(createRequire(join(engineRoot, "package.json")).resolve("manifold-3d"));
for (const [from, to] of [["manifold.wasm", "manifold.wasm"], ["LICENSE", "manifold-3d.LICENSE.txt"]]) {
  cpSync(join(manifoldDist, from), join(OUT, to));
}

// Git stores each bundle file with mode 0644. This loop sets that mode on every file that the build writes.
for (const rel of readdirSync(OUT, { recursive: true })) {
  if (statSync(join(OUT, rel)).isFile()) chmodSync(join(OUT, rel), 0o644);
}
console.log("bundled -> plugin/bundle/");
