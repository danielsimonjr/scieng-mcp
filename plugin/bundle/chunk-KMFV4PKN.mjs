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
  const path2 = assetFile(assetsUrl, file);
  try {
    return readFileSync(path2);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new RenderError("E_STAGE_MISSING", file + " cannot be read: " + path2 + ": " + message);
  }
}

// node_modules/@danielsimonjr/sciengjs/dist/config.js
import { homedir as osHomedir } from "node:os";
import { readFile as fsReadFile } from "node:fs/promises";
import path from "node:path";

// node_modules/@danielsimonjr/sciengjs/dist/version.js
var ENGINE_VERSION = "0.2.0";

// node_modules/@danielsimonjr/sciengjs/dist/config.js
var DEFAULT_ASSETS_URL = new URL("../assets/", import.meta.url).href;
var ENV = {
  configFile: "SCIENG_CONFIG",
  browser: "SCIENG_BROWSER",
  cacheDir: "SCIENG_CACHE_DIR",
  texBundleUrl: "SCIENG_TEX_BUNDLE_URL",
  timeoutMs: "SCIENG_TIMEOUT_MS",
  maxSourceBytes: "SCIENG_MAX_SOURCE_BYTES",
  maxMemoryMb: "SCIENG_MAX_MEMORY_MB",
  allowNetwork: "SCIENG_ALLOW_NETWORK",
  assetsUrl: "SCIENG_ASSETS_URL",
  rasterFont: "SCIENG_RASTER_FONT"
};
var RELEASE_URL_BASE = "https://github.com/danielsimonjr/sciengjs/releases/download";
var NETWORK_POLICIES = ["none", "tex-bundles", "tex-bundles,images"];
var CONFIG_FILE_NAME = "config.json";
var APP_FOLDER = "scieng";
function configBaseDir(d) {
  if (d.platform === "win32")
    return requireVar(d.env, "APPDATA", "Windows");
  if (d.platform === "darwin")
    return path.posix.join(d.homedir, "Library", "Application Support");
  return nonEmpty(d.env.XDG_CONFIG_HOME) ?? path.posix.join(d.homedir, ".config");
}
function cacheBaseDir(d) {
  if (d.platform === "win32")
    return requireVar(d.env, "LOCALAPPDATA", "Windows");
  if (d.platform === "darwin")
    return path.posix.join(d.homedir, "Library", "Caches");
  return nonEmpty(d.env.XDG_CACHE_HOME) ?? path.posix.join(d.homedir, ".cache");
}
function requireVar(env, name, platform) {
  const value = nonEmpty(env[name]);
  if (value === void 0) {
    throw new RenderError("E_CONFIG", `${name} is not set; ${platform} needs it for the default folders`);
  }
  return value;
}
function nonEmpty(value) {
  return value === void 0 || value === "" ? void 0 : value;
}
function defaults(engineVersion) {
  return {
    texBundleUrl: `${RELEASE_URL_BASE}/v${engineVersion}/`,
    timeoutMs: 6e4,
    maxSourceBytes: 10485760,
    maxMemoryMb: 2048,
    allowNetwork: "tex-bundles",
    assetsUrl: DEFAULT_ASSETS_URL
  };
}
function defaultConfigPath(d) {
  const p = d.platform === "win32" ? path.win32 : path.posix;
  return p.join(configBaseDir(d), APP_FOLDER, CONFIG_FILE_NAME);
}
function checkValue(key, value, source) {
  const fail = (why) => {
    throw new RenderError("E_CONFIG", `${source}: ${key} ${why}`);
  };
  switch (key) {
    case "browser":
    case "cacheDir":
    case "texBundleUrl":
    case "rasterFont":
      if (typeof value !== "string" || value === "")
        return fail("must be a non-empty string");
      return value;
    case "timeoutMs":
    case "maxSourceBytes":
    case "maxMemoryMb":
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        return fail("must be a positive integer");
      }
      return value;
    case "allowNetwork":
      if (typeof value !== "string" || !NETWORK_POLICIES.includes(value)) {
        return fail(`must be one of ${NETWORK_POLICIES.join(", ")}`);
      }
      return value;
    case "assetsUrl":
      return checkAssetsUrl(value, `${source}: ${key}`);
  }
}
function fromEnvText(key, text, envName) {
  if (key === "timeoutMs" || key === "maxSourceBytes" || key === "maxMemoryMb") {
    if (!/^\d+$/.test(text)) {
      throw new RenderError("E_CONFIG", `${envName} must be a whole number, got "${text}"`);
    }
    return checkValue(key, Number(text), envName);
  }
  return checkValue(key, text, envName);
}
var ENV_KEYS = {
  browser: ENV.browser,
  cacheDir: ENV.cacheDir,
  texBundleUrl: ENV.texBundleUrl,
  timeoutMs: ENV.timeoutMs,
  maxSourceBytes: ENV.maxSourceBytes,
  maxMemoryMb: ENV.maxMemoryMb,
  allowNetwork: ENV.allowNetwork,
  assetsUrl: ENV.assetsUrl,
  rasterFont: ENV.rasterFont
};
async function readConfigFile(filePath, explicit, d) {
  let text;
  try {
    text = await d.readFile(filePath);
  } catch (err) {
    const code = err.code;
    if (code === "ENOENT" && !explicit)
      return {};
    throw new RenderError("E_CONFIG", `cannot read config file ${filePath}: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new RenderError("E_CONFIG", `config file ${filePath} is not valid JSON: ${err.message}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new RenderError("E_CONFIG", `config file ${filePath} must hold a JSON object`);
  }
  const known = new Set(Object.keys(ENV_KEYS));
  for (const key of Object.keys(parsed)) {
    if (!known.has(key))
      throw new RenderError("E_CONFIG", `config file ${filePath} has an unknown key: ${key}`);
  }
  return parsed;
}
async function loadConfig(options = {}, deps = {}) {
  const d = {
    env: process.env,
    platform: process.platform,
    homedir: osHomedir(),
    readFile: (p) => fsReadFile(p, "utf8"),
    engineVersion: ENGINE_VERSION,
    ...deps
  };
  const explicitPath = nonEmpty(d.env[ENV.configFile]);
  const filePath = explicitPath ?? defaultConfigPath(d);
  const fromFile = await readConfigFile(filePath, explicitPath !== void 0, d);
  const base = defaults(d.engineVersion);
  const resolved = { ...base };
  for (const key of Object.keys(ENV_KEYS)) {
    const fileValue = fromFile[key];
    if (fileValue !== void 0)
      resolved[key] = checkValue(key, fileValue, filePath);
  }
  for (const key of Object.keys(ENV_KEYS)) {
    const envName = ENV_KEYS[key];
    const text = nonEmpty(d.env[envName]);
    if (text !== void 0)
      resolved[key] = fromEnvText(key, text, envName);
  }
  for (const key of Object.keys(options)) {
    const value = options[key];
    if (value !== void 0)
      resolved[key] = checkValue(key, value, "call option");
  }
  if (resolved.cacheDir === void 0) {
    const p = d.platform === "win32" ? path.win32 : path.posix;
    resolved.cacheDir = p.join(cacheBaseDir(d), APP_FOLDER);
  }
  return resolved;
}

export {
  RESVG_WASM_FILE,
  bundledFontPathIn,
  readAsset,
  DEFAULT_ASSETS_URL,
  loadConfig
};
