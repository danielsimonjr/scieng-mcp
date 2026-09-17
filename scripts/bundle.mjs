import { build } from "esbuild";
import { readFileSync } from "node:fs";
const __pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

// ESM banner shim: bundled CJS deps need require/__filename/__dirname.
const banner =
  "import { createRequire as __createRequire } from 'node:module';" +
  "import { fileURLToPath as __fileURLToPath } from 'node:url';" +
  "import { dirname as __dirnameOf } from 'node:path';" +
  "const require = __createRequire(import.meta.url);" +
  "const __filename = __fileURLToPath(import.meta.url);" +
  "const __dirname = __dirnameOf(__filename);";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  banner: { js: banner },
  outfile: "plugin/bundle/index.mjs",
  // Compile-time version: serverInfo was a hardcoded literal, so it reported a stale
  // number no matter what the manifests said - the one version a client can see, lying.
  define: { __PKG_VERSION__: JSON.stringify(__pkg.version) },
  logLevel: "warning",
});
console.log("bundled -> plugin/bundle/index.mjs");
