import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  mermaidPageHtml,
  svgPageHtml
} from "./chunk-USVSPPCS.mjs";
import {
  MERMAID_CDN_URL,
  MERMAID_FILE,
  MERMAID_SHA256
} from "./chunk-UDEV2G2S.mjs";
import {
  renderHtmlPage
} from "./chunk-R4B2RV3A.mjs";
import {
  blockedWarnings,
  browserPathOf
} from "./chunk-UPVXRGH6.mjs";
import {
  readAsset
} from "./chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/browser.js
import { createHash } from "node:crypto";
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
