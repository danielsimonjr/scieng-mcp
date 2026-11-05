import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/browser/input.js
var DEFAULT_WIDTH = 800;
var DEFAULT_HEIGHT = 600;
var DEFAULT_SCALE = 1;
var MAX_SIDE = 16384;
var MAX_SCALE = 8;
var MAX_DEVICE_PIXELS = 64 * 1024 * 1024;
var MAX_BLOCKED_WARNINGS = 50;
var MAX_WARNING_URL_CHARS = 200;
function rejectUnknownKeys(options, allowed, pair) {
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) {
      throw new RenderError("E_INPUT", `${pair} takes no option ${key}`);
    }
  }
}
function positiveInteger(options, key, fallback) {
  if (!(key in options))
    return fallback;
  const value = options[key];
  if (typeof value === "number" && Number.isInteger(value) && value > 0)
    return value;
  throw new RenderError("E_INPUT", `option ${key} must be a whole number greater than 0`);
}
function positiveNumber(options, key, fallback) {
  if (!(key in options))
    return fallback;
  const value = options[key];
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  throw new RenderError("E_INPUT", `option ${key} must be a finite number greater than 0`);
}
function parsePngOptions(options) {
  rejectUnknownKeys(options, ["width", "height", "scale"], "html to png");
  const width = positiveInteger(options, "width", DEFAULT_WIDTH);
  const height = positiveInteger(options, "height", DEFAULT_HEIGHT);
  const scale = positiveNumber(options, "scale", DEFAULT_SCALE);
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw new RenderError("E_INPUT", `options width and height must not be more than ${MAX_SIDE}`);
  }
  if (scale > MAX_SCALE) {
    throw new RenderError("E_INPUT", `option scale must not be more than ${MAX_SCALE}`);
  }
  if (width * scale * (height * scale) > MAX_DEVICE_PIXELS) {
    throw new RenderError("E_INPUT", `the png must not have more than ${MAX_DEVICE_PIXELS} device pixels`);
  }
  return { width, height, scale };
}
function parsePdfOptions(options) {
  rejectUnknownKeys(options, [], "html to pdf");
}
function htmlSource(source) {
  if (typeof source !== "string") {
    throw new RenderError("E_INPUT", "html takes text, not bytes");
  }
  return source;
}
function browserPathOf(browser) {
  if (browser === void 0 || browser === "") {
    throw new RenderError("E_STAGE_MISSING", "the browser stage needs SCIENG_BROWSER or the browser configuration key");
  }
  return browser;
}
function escapeControls(text) {
  return text.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
function blockedWarnings(blocked) {
  const warnings = blocked.slice(0, MAX_BLOCKED_WARNINGS).map((url) => {
    const cut = url.length > MAX_WARNING_URL_CHARS ? `${url.slice(0, MAX_WARNING_URL_CHARS)}...` : url;
    return `the page requested ${escapeControls(cut)}; the browser stage refused the request`;
  });
  if (blocked.length > MAX_BLOCKED_WARNINGS) {
    warnings.push(`the browser stage refused ${blocked.length - MAX_BLOCKED_WARNINGS} more requests`);
  }
  return warnings;
}

export {
  MAX_SCALE,
  MAX_DEVICE_PIXELS,
  parsePngOptions,
  parsePdfOptions,
  htmlSource,
  browserPathOf,
  blockedWarnings
};
