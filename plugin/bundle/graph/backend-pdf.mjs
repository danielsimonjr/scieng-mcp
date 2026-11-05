import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  dotToSvg,
  sourceText
} from "../chunk-4MDRDRCG.mjs";
import {
  drawSvgToPdf
} from "../chunk-MDEIADB2.mjs";
import "../chunk-USVSPPCS.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-FOTRRLDZ.mjs";
import "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/graph/backend-pdf.js
async function render(request) {
  const names = Object.keys(request.options ?? {});
  if (names.length > 0) {
    throw new RenderError("E_INPUT", `dot to pdf takes no options; got ${names.join(", ")}`);
  }
  const dot = await dotToSvg(sourceText(request.source));
  const draw = await drawSvgToPdf(dot.svg, request.settings);
  return { bytes: draw.bytes, warnings: [...dot.warnings, ...draw.warnings], backend: "graph/viz+browser/chromium" };
}
export {
  render
};
