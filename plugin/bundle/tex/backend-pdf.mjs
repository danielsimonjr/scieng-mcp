import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  renderTikzSvg
} from "../chunk-WJAWGOMO.mjs";
import "../chunk-VHCRZQSZ.mjs";
import {
  sourceText
} from "../chunk-C4DREIKQ.mjs";
import {
  drawSvgToPdf
} from "../chunk-F23FRMBB.mjs";
import "../chunk-USVSPPCS.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-QSNR6J2E.mjs";
import "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/tex/backend-pdf.js
async function render(request) {
  const svg = await renderTikzSvg(sourceText(request.source), request.options, request.settings);
  const draw = await drawSvgToPdf(svg.svg, request.settings);
  return { bytes: draw.bytes, warnings: [...svg.warnings, ...draw.warnings] };
}
export {
  render
};
