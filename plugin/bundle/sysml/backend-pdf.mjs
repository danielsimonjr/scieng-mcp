import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  renderSysmlSvg
} from "../chunk-BLAZV7IL.mjs";
import "../chunk-NP4BMKGN.mjs";
import {
  sourceText
} from "../chunk-C4DREIKQ.mjs";
import {
  drawSvgToPdf
} from "../chunk-MDEIADB2.mjs";
import "../chunk-USVSPPCS.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-FOTRRLDZ.mjs";
import "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/sysml/backend-pdf.js
async function render(request) {
  const svg = await renderSysmlSvg(sourceText(request.source), request.options);
  const draw = await drawSvgToPdf(svg.svg, request.settings);
  return { bytes: draw.bytes, warnings: [...svg.warnings, ...draw.warnings] };
}
export {
  render
};
