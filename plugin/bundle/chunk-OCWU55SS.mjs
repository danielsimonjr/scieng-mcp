import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);

// node_modules/@danielsimonjr/sciengjs/dist/browser/page.js
var PAGE_STYLE = "html,body{margin:0;background:#fff}#sciengjs-diagram svg{display:block}";
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
  plotlyPageHtml,
  svgPageHtml,
  mermaidPageHtml
};
