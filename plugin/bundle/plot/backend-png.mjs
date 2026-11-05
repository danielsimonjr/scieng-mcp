import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readScale,
  svgDocumentToPng
} from "../chunk-7I3BCADK.mjs";
import "../chunk-GCGCODTU.mjs";
import "../chunk-NP4BMKGN.mjs";
import "../chunk-C4DREIKQ.mjs";
import "../chunk-SUGXCK3Q.mjs";
import {
  plotToSvg,
  readPlotOptions
} from "../chunk-TQ56VOOR.mjs";
import "../chunk-WYJQ7P44.mjs";
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
