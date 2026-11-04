import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);

// node_modules/@danielsimonjr/sciengjs/dist/browser/pinned.js
var MERMAID_VERSION = "11.17.2";
var MERMAID_SHA256 = "581ed7d74bd9048d0e3a91363927d72ef22942d7722546b27f7cc29e35390eb8";
var MERMAID_FILE = "mermaid.min.js";
var MERMAID_CDN_URL = `https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js`;
var PLOTLY_VERSION = "4.2.0";
var PLOTLY_SRI = "sha256-/ek5ZKdRG/pUxXRcSbXQ5BcVy94Mxevq4/mgLeA5bK4=";
var PLOTLY_CDN_URL = `https://cdn.jsdelivr.net/npm/plotly.js-dist-min@${PLOTLY_VERSION}/plotly.min.js`;

// node_modules/@danielsimonjr/sciengjs/dist/browser/page.js
var PAGE_STYLE = "html,body{margin:0;background:#fff}";
function scriptJson(text) {
  return escapeScriptText(JSON.stringify(text));
}
function scriptData(value) {
  return escapeScriptText(JSON.stringify(value));
}
function escapeScriptText(text) {
  return text.replace(/[<>&\u2028\u2029]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}
function escapeHtmlText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function plotlyPageHtml(figure, cdnUrl, sri, title = "plot") {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtmlText(title)}</title><style>${PAGE_STYLE}</style></head><body><div id="sciengjs-diagram"></div><script src="${cdnUrl}" integrity="${sri}" crossorigin="anonymous"></script><script>(function () { const fig = ${scriptData(figure)}; Plotly.newPlot(document.getElementById("sciengjs-diagram"), fig.data, fig.layout, { responsive: false }); })();</script></body></html>`;
}
function svgPageHtml(svg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PAGE_STYLE}</style></head><body><div id="sciengjs-diagram">${svg}</div></body></html>`;
}
function mermaidPageHtml(source, cdnUrl) {
  const render = `if (typeof mermaid === "undefined") { window.__sciengDone = { ok: false, internal: true, message: "the pinned Mermaid build did not load" }; return; } try { mermaid.initialize({ startOnLoad: false, securityLevel: "strict" }); const { svg } = await mermaid.render("sciengjs-render", ${scriptJson(source)}); const host = document.getElementById("sciengjs-diagram"); host.innerHTML = svg; const el = host.querySelector("svg"); const vb = el && el.viewBox && el.viewBox.baseVal; if (vb && vb.width > 0 && vb.height > 0) { el.setAttribute("width", String(Math.ceil(vb.width))); el.setAttribute("height", String(Math.ceil(vb.height))); el.style.removeProperty("max-width"); } const out = el ? new XMLSerializer().serializeToString(el) : svg; window.__sciengDone = { ok: true, svg: out }; } catch (err) { window.__sciengDone = { ok: false, message: String((err && err.message) || err) }; }`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PAGE_STYLE}</style></head><body><div id="sciengjs-diagram"></div><script src="${cdnUrl}"></script><script>(async () => { ${render} })();</script></body></html>`;
}

export {
  MERMAID_SHA256,
  MERMAID_FILE,
  MERMAID_CDN_URL,
  PLOTLY_SRI,
  PLOTLY_CDN_URL,
  plotlyPageHtml,
  svgPageHtml,
  mermaidPageHtml
};
