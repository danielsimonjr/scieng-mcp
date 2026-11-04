import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-JFFRTQ6A.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/assets.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
var BUNDLED_FONT_FILE = "fonts/LiberationSerif-Regular.ttf";
var RESVG_WASM_FILE = "index_bg.wasm";
function checkAssetsUrl(value, label) {
  if (typeof value !== "string") {
    throw new RenderError("E_CONFIG", label + " must be a string holding a file: URL, but got " + typeof value);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new RenderError("E_CONFIG", label + " is not a valid URL: " + JSON.stringify(value));
  }
  if (url.protocol !== "file:") {
    throw new RenderError("E_CONFIG", label + " must be a file: URL, but got protocol " + url.protocol);
  }
  if (url.hostname !== "") {
    throw new RenderError("E_CONFIG", label + " must be a file: URL with no host or with the host localhost: " + JSON.stringify(value));
  }
  if (/[?#]/.test(value)) {
    throw new RenderError("E_CONFIG", label + " must be a folder URL with no query and no fragment: " + JSON.stringify(value));
  }
  if (/%2F|%5C/i.test(url.pathname)) {
    throw new RenderError("E_CONFIG", label + " must not hold an encoded slash or backslash in its path: " + JSON.stringify(value));
  }
  if (!url.pathname.endsWith("/"))
    url.pathname += "/";
  return url.href;
}
function assetFile(assetsUrl, file) {
  const base = checkAssetsUrl(assetsUrl, "assetsUrl");
  try {
    return fileURLToPath(new URL(file, base));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new RenderError("E_CONFIG", "assetsUrl cannot be opened as a folder on this system: " + JSON.stringify(assetsUrl) + ": " + message);
  }
}
function bundledFontPathIn(assetsUrl) {
  return assetFile(assetsUrl, BUNDLED_FONT_FILE);
}
function readAsset(assetsUrl, file) {
  const path = assetFile(assetsUrl, file);
  try {
    return readFileSync(path);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new RenderError("E_STAGE_MISSING", file + " cannot be read: " + path + ": " + message);
  }
}

export {
  RESVG_WASM_FILE,
  checkAssetsUrl,
  bundledFontPathIn,
  readAsset
};
