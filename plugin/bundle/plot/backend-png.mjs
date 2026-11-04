import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readScale,
  svgDocumentToPng
} from "../chunk-HA7QSW4O.mjs";
import "../chunk-A3MBHSDV.mjs";
import "../chunk-4KI3PA2R.mjs";
import "../chunk-T5W7ILUB.mjs";
import {
  plotToSvg,
  readPlotOptions
} from "../chunk-Z4UEFC4G.mjs";
import "../chunk-JFFRTQ6A.mjs";
import "../chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/plot/backend-png.js
async function render(request) {
  const { lenient } = readPlotOptions(request.options, ["lenient", "scale"]);
  const scale = readScale(request.options);
  const result = plotToSvg(String(request.source), { lenient });
  const png = await svgDocumentToPng(result.svg, request, scale);
  return { bytes: png.bytes, warnings: [...result.warnings, ...png.warnings ?? []] };
}
export {
  render
};
