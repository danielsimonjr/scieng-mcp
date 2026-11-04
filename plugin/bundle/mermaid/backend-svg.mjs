import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readLenient,
  renderMermaidSvg,
  routesToBrowser,
  sourceText
} from "../chunk-MXHEZA6Z.mjs";
import "../chunk-4KI3PA2R.mjs";
import {
  drawMermaidInBrowser
} from "../chunk-K6Q3O3PL.mjs";
import "../chunk-7NNWVETH.mjs";
import "../chunk-L2HFCXZ4.mjs";
import "../chunk-T5W7ILUB.mjs";
import "../chunk-JFFRTQ6A.mjs";
import "../chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/backend-svg.js
async function render(request) {
  const source = sourceText(request.source);
  if (routesToBrowser(source)) {
    readLenient(request.options, []);
    const out = await drawMermaidInBrowser(source, "svg", request.settings);
    return { bytes: out.bytes, warnings: out.warnings, backend: out.backend };
  }
  const result = await renderMermaidSvg(source, request.options);
  return { bytes: new TextEncoder().encode(result.svg), warnings: result.warnings };
}
export {
  render
};
