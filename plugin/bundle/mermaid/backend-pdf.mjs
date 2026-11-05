import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readLenient,
  renderMermaidSvg,
  routesToBrowser
} from "../chunk-DNBSXUFS.mjs";
import "../chunk-NP4BMKGN.mjs";
import {
  sourceText
} from "../chunk-C4DREIKQ.mjs";
import {
  MERMAID_NATIVE_PDF_BACKEND,
  drawMermaidInBrowser,
  drawSvgToPdf
} from "../chunk-IS2UACOH.mjs";
import "../chunk-USVSPPCS.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-R4B2RV3A.mjs";
import "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

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
