import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  blockedWarnings,
  browserPathOf,
  renderHtmlPage
} from "./chunk-566V4Y3S.mjs";
import {
  readAsset
} from "./chunk-T5W7ILUB.mjs";
import {
  RenderError
} from "./chunk-JFFRTQ6A.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/browser.js
import { createHash } from "node:crypto";

// node_modules/@danielsimonjr/sciengjs/dist/browser/pinned.js
var MERMAID_VERSION = "11.17.2";
var MERMAID_SHA256 = "581ed7d74bd9048d0e3a91363927d72ef22942d7722546b27f7cc29e35390eb8";
var MERMAID_FILE = "mermaid.min.js";
var MERMAID_CDN_URL = `https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js`;

// node_modules/@danielsimonjr/sciengjs/dist/browser/page.js
var PAGE_STYLE = "html,body{margin:0;background:#fff}";
function scriptJson(text) {
  return JSON.stringify(text).replace(/[<>&\u2028\u2029]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}
function svgPageHtml(svg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PAGE_STYLE}</style></head><body><div id="sciengjs-diagram">${svg}</div></body></html>`;
}
function mermaidPageHtml(source, cdnUrl) {
  const render = `if (typeof mermaid === "undefined") { window.__sciengDone = { ok: false, internal: true, message: "the pinned Mermaid build did not load" }; return; } try { mermaid.initialize({ startOnLoad: false, securityLevel: "strict" }); const { svg } = await mermaid.render("sciengjs-render", ${scriptJson(source)}); const host = document.getElementById("sciengjs-diagram"); host.innerHTML = svg; const el = host.querySelector("svg"); const vb = el && el.viewBox && el.viewBox.baseVal; if (vb && vb.width > 0 && vb.height > 0) { el.setAttribute("width", String(Math.ceil(vb.width))); el.setAttribute("height", String(Math.ceil(vb.height))); el.style.removeProperty("max-width"); } const out = el ? new XMLSerializer().serializeToString(el) : svg; window.__sciengDone = { ok: true, svg: out }; } catch (err) { window.__sciengDone = { ok: false, message: String((err && err.message) || err) }; }`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PAGE_STYLE}</style></head><body><div id="sciengjs-diagram"></div><script src="${cdnUrl}"></script><script>(async () => { ${render} })();</script></body></html>`;
}

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/browser.js
var MERMAID_BROWSER_BACKEND = "mermaid/browser/chromium";
var MERMAID_NATIVE_PDF_BACKEND = "mermaid/native+browser/chromium";
async function drawMermaidInBrowser(source, format, settings, scale = 1) {
  const browser = browserPathOf(settings.browser);
  const base = {
    html: mermaidPageHtml(source, MERMAID_CDN_URL),
    browser,
    timeoutMs: settings.timeoutMs,
    pinned: pinnedMermaid(settings.assetsUrl),
    awaitDone: true
  };
  const request = format === "png" ? { ...base, format: "png", width: 0, height: 0, scale } : format === "pdf" ? { ...base, format: "pdf" } : { ...base, format: "svg" };
  const out = await renderHtmlPage(request);
  return { bytes: out.bytes, warnings: blockedWarnings(out.blocked), backend: MERMAID_BROWSER_BACKEND };
}
async function drawSvgToPdf(svg, settings) {
  const browser = browserPathOf(settings.browser);
  const out = await renderHtmlPage({ html: svgPageHtml(svg), format: "pdf", browser, timeoutMs: settings.timeoutMs });
  return { bytes: out.bytes, warnings: blockedWarnings(out.blocked) };
}
function pinnedMermaid(assetsUrl) {
  const bytes = readAsset(assetsUrl, MERMAID_FILE);
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== MERMAID_SHA256) {
    throw new RenderError("E_INTEGRITY", `${MERMAID_FILE} has the SHA-256 ${hash}, not the pinned ${MERMAID_SHA256}`);
  }
  return /* @__PURE__ */ new Map([[MERMAID_CDN_URL, { bytes, mime: "application/javascript" }]]);
}

export {
  MERMAID_NATIVE_PDF_BACKEND,
  drawMermaidInBrowser,
  drawSvgToPdf
};
