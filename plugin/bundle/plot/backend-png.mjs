import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readScale,
  svgDocumentToPng
} from "../chunk-HWMJVRWM.mjs";
import "../chunk-KFEKUXKW.mjs";
import "../chunk-6VQDK4UZ.mjs";
import "../chunk-T5W7ILUB.mjs";
import {
  plotToSvg,
  readPlotOptions
} from "../chunk-Z4UEFC4G.mjs";
import "../chunk-JFFRTQ6A.mjs";
import "../chunk-OP543J2H.mjs";

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
