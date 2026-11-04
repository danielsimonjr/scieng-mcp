import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  drawSvgToPdf
} from "../chunk-Q5BBJJYJ.mjs";
import "../chunk-566V4Y3S.mjs";
import "../chunk-T5W7ILUB.mjs";
import {
  dotSourceText,
  dotToSvg
} from "../chunk-4KI3PA2R.mjs";
import {
  RenderError
} from "../chunk-JFFRTQ6A.mjs";
import "../chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/graph/backend-pdf.js
async function render(request) {
  const names = Object.keys(request.options ?? {});
  if (names.length > 0) {
    throw new RenderError("E_INPUT", `dot to pdf takes no options; got ${names.join(", ")}`);
  }
  const dot = await dotToSvg(dotSourceText(request.source));
  const draw = await drawSvgToPdf(dot.svg, request.settings);
  return { bytes: draw.bytes, warnings: [...dot.warnings, ...draw.warnings], backend: "graph/viz+browser/chromium" };
}
export {
  render
};
