import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  drawSvgToPdf
} from "../chunk-K6Q3O3PL.mjs";
import "../chunk-7NNWVETH.mjs";
import "../chunk-L2HFCXZ4.mjs";
import "../chunk-T5W7ILUB.mjs";
import {
  mathToSvg
} from "../chunk-CMTOCTXS.mjs";
import {
  RenderError
} from "../chunk-JFFRTQ6A.mjs";
import "../chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/math/backend-pdf.js
async function render(request) {
  const names = Object.keys(request.options);
  if (names.length > 0) {
    throw new RenderError("E_INPUT", "math to pdf takes no options; got " + names.join(", "));
  }
  const svg = await mathToSvg(String(request.source), { display: true });
  const draw = await drawSvgToPdf(svg, request.settings);
  return { bytes: draw.bytes, warnings: draw.warnings, backend: "math/mathjax+browser/chromium" };
}
export {
  render
};
