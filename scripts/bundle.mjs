// Builds the plugin bundle into plugin/bundle/: the MCP server as index.mjs, the engine worker and its
// two backends beside it, and the engine assets in assets/. Run from the repository root.
import { build } from "esbuild";
import { cpSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "plugin", "bundle");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

// The engine loads its worker and its backends by URL, from the folder of the module that holds the
// URL. A single-file bundle has no such files, so each one is emitted here at the path the engine
// computes: entry.mjs beside index.mjs, and graph/backend-*.mjs below it.
const engineRoot = dirname(createRequire(import.meta.url).resolve("@danielsimonjr/sciengjs/package.json"));

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
    entry: join(engineRoot, "dist", "worker", "entry.js"),
    "graph/backend-svg": join(engineRoot, "dist", "graph", "backend-svg.js"),
    "graph/backend-png": join(engineRoot, "dist", "graph", "backend-png.js"),
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
console.log("bundled -> plugin/bundle/");
