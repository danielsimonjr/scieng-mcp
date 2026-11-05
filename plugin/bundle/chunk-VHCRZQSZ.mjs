import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/tex/bundles.js
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

// node_modules/@danielsimonjr/sciengjs/dist/tex/bundles.json
var bundles_default = [
  {
    name: "core",
    file: "scieng-tex-core.sctb",
    sha256: "20b7654bbf6da695eed7eef7895f3a59533f99e675cdb10e48f73d22ac47f43c",
    bytes: 9383293
  },
  {
    name: "diagrams",
    file: "scieng-tex-diagrams.sctb",
    sha256: "d11be2a1c7931c0d37496852adebe9b3de3deda4bcad98e5396e7eab9c56f2f7",
    bytes: 71534
  },
  {
    name: "science",
    file: "scieng-tex-science.sctb",
    sha256: "38990ecd718cf5c670c7661418b2a0e427100a8f6b1bb0fc95f21faed0bb45df",
    bytes: 90196
  },
  {
    name: "math",
    file: "scieng-tex-math.sctb",
    sha256: "ffb760bdb04aa35d4ee56e8bf9ae6a628dd7d204c6aac55d147e651f1854343e",
    bytes: 721870
  }
];

// node_modules/@danielsimonjr/sciengjs/dist/tex/bundles.js
var BUNDLES = bundles_default;
var CACHE_SUBFOLDER = "tex-bundles";
var MAGIC = "SCTB1\0\0\0";
var sha256 = (b) => createHash("sha256").update(b).digest("hex");
function cachePath(entry, settings) {
  return path.join(settings.cacheDir, CACHE_SUBFOLDER, entry.file);
}
function bundleUrl(entry, settings) {
  const base = settings.texBundleUrl;
  return `${base.endsWith("/") ? base : `${base}/`}${entry.file}`;
}
function findBundle(name, bundles = BUNDLES) {
  const entry = bundles.find((b) => b.name === name);
  if (entry === void 0)
    throw new RenderError("E_INTERNAL", `the build has no TeX bundle named ${name}`);
  return entry;
}
async function readIfThere(file) {
  try {
    return new Uint8Array(await readFile(file));
  } catch (e) {
    if (e.code === "ENOENT")
      return void 0;
    throw e;
  }
}
async function download(url, settings, entry) {
  const fail = (why) => new RenderError("E_STAGE_MISSING", `the TeX bundle ${entry.name} is not available at ${url}: ${why}`);
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new RenderError("E_CONFIG", `texBundleUrl gives the URL ${url} for the TeX bundle ${entry.name}, and it is not a URL`);
  }
  if (parsed.protocol === "file:") {
    try {
      return new Uint8Array(await readFile(fileURLToPath(parsed)));
    } catch (e) {
      throw fail(e instanceof Error ? e.message : String(e));
    }
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
    throw fail(`the protocol ${parsed.protocol} is not supported`);
  try {
    const res = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(settings.timeoutMs) });
    if (!res.ok)
      throw fail(`the server answered ${res.status}`);
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > entry.bytes)
      throw new RenderError("E_INTEGRITY", `the TeX bundle ${entry.name} from ${url} is ${length} bytes, and the pin says ${entry.bytes}`);
    return new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    if (e instanceof RenderError)
      throw e;
    throw fail(e instanceof Error ? e.message : String(e));
  }
}
async function loadBundleBytes(entry, settings) {
  const target = cachePath(entry, settings);
  const cached = await readIfThere(target);
  if (cached !== void 0) {
    if (sha256(cached) === entry.sha256)
      return cached;
    await rm(target, { force: true });
  }
  const url = bundleUrl(entry, settings);
  if (settings.allowNetwork === "none") {
    throw new RenderError("E_STAGE_MISSING", `the TeX bundle ${entry.name} is not in the cache (${target}), and the configuration does not allow the download of ${url}. Set allowNetwork to tex-bundles, or put the file ${entry.file} in the cache folder.`);
  }
  const bytes = await download(url, settings, entry);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temp, bytes);
  try {
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) {
      await rm(temp, { force: true });
      throw new RenderError("E_INTEGRITY", `the TeX bundle ${entry.name} from ${url} does not match its pin (sha256 ${entry.sha256}, ${entry.bytes} bytes). The download is deleted.`);
    }
    await rename(temp, target);
  } catch (e) {
    await rm(temp, { force: true });
    throw e;
  }
  return bytes;
}
function unpackBundle(bytes) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.length);
  if (buf.length < 8 || buf.toString("latin1", 0, 8) !== MAGIC)
    throw new RenderError("E_INTEGRITY", "a TeX bundle is not an SCTB1 container");
  let body;
  try {
    body = inflateRawSync(buf.subarray(8));
  } catch (e) {
    throw new RenderError("E_INTEGRITY", `a TeX bundle does not inflate: ${e instanceof Error ? e.message : String(e)}`);
  }
  const out = /* @__PURE__ */ new Map();
  let at = 4;
  const count = body.readUInt32LE(0);
  for (let i = 0; i < count; i++) {
    const nameLength = body.readUInt16LE(at);
    at += 2;
    const name = body.toString("utf8", at, at + nameLength);
    at += nameLength;
    const size = body.readUInt32LE(at);
    at += 4;
    out.set(name, new Uint8Array(body.buffer, body.byteOffset + at, size));
    at += size;
  }
  return out;
}
var coreFiles;
var loadCoreFiles = async (settings) => unpackBundle(await loadBundleBytes(findBundle("core"), settings));
function texCoreFiles(settings, load = loadCoreFiles) {
  const sha2562 = findBundle("core").sha256;
  if (coreFiles?.sha256 === sha2562 && coreFiles.load === load)
    return coreFiles.files;
  const files = load(settings);
  coreFiles = { sha256: sha2562, load, files };
  files.catch(() => {
    if (coreFiles?.files === files)
      coreFiles = void 0;
  });
  return files;
}
async function loadBundles(names, settings, bundles = BUNDLES) {
  const out = /* @__PURE__ */ new Map();
  for (const name of names) {
    if (out.has(name))
      continue;
    out.set(name, unpackBundle(await loadBundleBytes(findBundle(name, bundles), settings)));
  }
  return out;
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/detect.js
var BUNDLE_PACKAGES = {
  core: [
    "tikz",
    "pgf",
    "xcolor",
    "color",
    "circuitikz",
    "standalone",
    "graphicx",
    "xkeyval",
    "etoolbox",
    "ifthen",
    "array",
    "calc",
    "fontenc",
    "inputenc",
    "textcomp",
    "xspace"
  ],
  diagrams: ["tikz-cd", "tikz-3dplot", "smartdiagram"],
  science: ["chemfig", "simplekv", "mhchem", "chemgreek", "l3packages", "bussproofs"],
  math: ["amsmath", "amssymb", "amsfonts", "amsthm", "amscd", "amsbsy", "amsopn", "amstext", "amsgen", "eucal"]
};
var DIAGRAM_LIBRARIES = ["hobby", "cd"];
var GPL_REPLACEMENTS = {
  pgfplots: "the plotly input type and the plot stage",
  "pgf-umlsd": "a Mermaid sequence diagram",
  xy: "tikz-cd",
  esvect: "\\vec or \\overrightarrow",
  mathrsfs: "\\mathscr from the AMS eucal package"
};
var ENVIRONMENT_RULES = [
  ["tikzpicture", "tikz"],
  ["circuitikz", "circuitikz"],
  ["tikzcd", "tikz-cd"],
  ["prooftree", "bussproofs"],
  ["sequencediagram", "pgf-umlsd"],
  ["axis", "pgfplots"],
  ["xy", "xy"],
  ...[
    "align",
    "alignat",
    "flalign",
    "gather",
    "multline",
    "split",
    "aligned",
    "gathered",
    "subequations",
    "cases",
    "matrix",
    "pmatrix",
    "bmatrix",
    "Bmatrix",
    "vmatrix",
    "Vmatrix",
    "smallmatrix"
  ].map((name) => [name, "amsmath"])
];
var COMMAND_RULES = [
  ["tikz", "tikz"],
  ["smartdiagram", "smartdiagram"],
  ["tdplotsetmaincoords", "tikz-3dplot"],
  ["tdplotsetrotatedcoords", "tikz-3dplot"],
  ["ce", "mhchem"],
  ["chemfig", "chemfig"],
  ["addplot", "pgfplots"],
  ["xymatrix", "xy"],
  ["vv", "esvect"],
  ["mathscr", "mathrsfs"],
  ...["DisplayProof", "AxiomC", "UnaryInfC", "BinaryInfC", "TrinaryInfC", "QuaternaryInfC", "QuinaryInfC"].map((name) => [name, "bussproofs"]),
  ...["color", "textcolor", "colorbox", "pagecolor", "definecolor"].map((name) => [name, "xcolor"]),
  ...["mathbb", "mathfrak"].map((name) => [name, "amssymb"]),
  ...["text", "dfrac", "tfrac", "binom", "operatorname", "intertext", "substack"].map((name) => [name, "amsmath"])
];
var VERBATIM_BEGIN = /^\\begin\s*\{(verbatim\*?|lstlisting|minted)\}/;
var VERB = /^\\verb\*?([^A-Za-z\s*])/;
var PACKAGE_LINE = /\\(?:usepackage|RequirePackage(?:WithOptions)?)\s*(?:\[([^\]]*)\])?\s*\{([^}]*)\}/g;
var LIBRARY_LINE = /\\usetikzlibrary\s*\{([^}]*)\}/g;
var BUNDLE_OF = /* @__PURE__ */ new Map();
for (const [bundle, names] of Object.entries(BUNDLE_PACKAGES)) {
  for (const name of names) {
    BUNDLE_OF.set(name, bundle);
  }
}
var BUNDLED_ENCODING = "OT1";
function foreignEncoding(options) {
  return (options ?? "").split(",").map((option) => option.trim()).find((option) => option !== "" && option !== BUNDLED_ENCODING);
}
function blank(chars, from, to) {
  for (let k = from; k < to; k += 1) {
    if (chars[k] !== "\n") {
      chars[k] = " ";
    }
  }
}
function sanitize(source) {
  const chars = source.split("");
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === "%") {
      const end = source.indexOf("\n", i);
      const stop = end < 0 ? source.length : end;
      blank(chars, i, stop);
      i = stop;
    } else if (c === "\\") {
      const rest = source.slice(i, i + 40);
      const begin = VERBATIM_BEGIN.exec(rest);
      const verb = VERB.exec(rest);
      const next = source[i + 1];
      if (begin !== null) {
        const bodyStart = i + begin[0].length;
        const end = source.indexOf(`\\end{${begin[1]}}`, bodyStart);
        if (end >= 0) {
          blank(chars, bodyStart, end);
          i = end;
        } else {
          i = bodyStart;
        }
      } else if (verb !== null) {
        const textStart = i + verb[0].length;
        const close = source.indexOf(verb[1], textStart);
        const lineEnd = source.indexOf("\n", textStart);
        if (close >= 0 && (lineEnd < 0 || close < lineEnd)) {
          blank(chars, i, close + 1);
          i = close + 1;
        } else {
          i += verb[0].length;
        }
      } else if (next === "\\") {
        blank(chars, i, i + 2);
        i += 2;
      } else {
        i += 2;
      }
    } else {
      i += 1;
    }
  }
  return chars.join("");
}
function findPackages(text) {
  const findings = [];
  const extra = /* @__PURE__ */ new Set();
  for (const m of text.matchAll(PACKAGE_LINE)) {
    for (const part of m[2].split(",")) {
      const name = part.trim();
      if (name !== "") {
        const encoding = name === "fontenc" ? foreignEncoding(m[1]) : void 0;
        findings.push(encoding === void 0 ? { name, index: m.index } : { name, index: m.index, encoding });
      }
    }
  }
  for (const m of text.matchAll(LIBRARY_LINE)) {
    for (const part of m[1].split(",")) {
      if (DIAGRAM_LIBRARIES.includes(part.trim())) {
        extra.add("diagrams");
      }
    }
  }
  for (const [env, name] of ENVIRONMENT_RULES) {
    const hit = new RegExp(`\\\\begin\\s*\\{${env}\\*?\\}`).exec(text);
    if (hit !== null) {
      findings.push({ name, index: hit.index });
    }
  }
  for (const [command, name] of COMMAND_RULES) {
    const hit = new RegExp(`\\\\${command}(?![A-Za-z])`).exec(text);
    if (hit !== null) {
      findings.push({ name, index: hit.index });
    }
  }
  return { findings, extra };
}
function lineOf(text, index) {
  let line = 1;
  for (let k = 0; k < index; k += 1) {
    if (text[k] === "\n") {
      line += 1;
    }
  }
  return line;
}
function detectBundles(source) {
  const text = sanitize(source);
  const { findings, extra } = findPackages(text);
  findings.sort((a, b) => a.index - b.index);
  const bundles = /* @__PURE__ */ new Set(["core", ...extra]);
  const packages = /* @__PURE__ */ new Set();
  for (const { name, index, encoding } of findings) {
    if (encoding !== void 0) {
      throw new RenderError("E_UNSUPPORTED", `Font encoding "${encoding}" is not available: only the OT1 encoding is bundled, and the Latin Modern fonts that T1 needs are in no bundle. Use the OT1 encoding or remove the fontenc option.`, { line: lineOf(text, index) });
    }
    const replacement = Object.hasOwn(GPL_REPLACEMENTS, name) ? GPL_REPLACEMENTS[name] : void 0;
    const bundle = BUNDLE_OF.get(name);
    if (replacement !== void 0) {
      throw new RenderError("E_UNSUPPORTED", `TeX package "${name}" has the GPL as its only licence, so no bundle holds it. Replacement: ${replacement}.`, { line: lineOf(text, index) });
    }
    if (bundle === void 0) {
      throw new RenderError("E_UNSUPPORTED", `TeX package "${name}" is not in any bundle.`, {
        line: lineOf(text, index)
      });
    }
    bundles.add(bundle);
    packages.add(name);
  }
  const rest = [...bundles].filter((b) => b !== "core").sort();
  return { bundles: ["core", ...rest], packages: [...packages].sort() };
}

export {
  findBundle,
  loadBundleBytes,
  unpackBundle,
  texCoreFiles,
  loadBundles,
  detectBundles
};
