import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readLenient,
  renderMermaidSvg,
  routesToBrowser,
  sourceText
} from "../chunk-MXHEZA6Z.mjs";
import "../chunk-4KI3PA2R.mjs";
import {
  MERMAID_NATIVE_PDF_BACKEND,
  drawMermaidInBrowser,
  drawSvgToPdf
} from "../chunk-Q5BBJJYJ.mjs";
import "../chunk-566V4Y3S.mjs";
import "../chunk-T5W7ILUB.mjs";
import "../chunk-JFFRTQ6A.mjs";
import "../chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/backend-pdf.js
async function render(request) {
  const source = sourceText(request.source);
  if (routesToBrowser(source)) {
    readLenient(request.options, []);
    const out = await drawMermaidInBrowser(source, "pdf", request.settings);
    return { bytes: out.bytes, warnings: out.warnings, backend: out.backend };
  }
  const svg = await renderMermaidSvg(source, request.options);
  const draw = await drawSvgToPdf(svg.svg, request.settings);
  return { bytes: draw.bytes, warnings: [...svg.warnings, ...draw.warnings], backend: MERMAID_NATIVE_PDF_BACKEND };
}
export {
  render
};
