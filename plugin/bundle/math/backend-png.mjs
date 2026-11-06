import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readScale,
  svgDocumentToPng
} from "../chunk-RQRGXFRN.mjs";
import "../chunk-JMQU2M3R.mjs";
import "../chunk-NP4BMKGN.mjs";
import "../chunk-C4DREIKQ.mjs";
import "../chunk-SUGXCK3Q.mjs";
import {
  mathToSvg
} from "../chunk-QEZUA5ZX.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/math/backend-png.js
async function render(request) {
  for (const key of Object.keys(request.options)) {
    if (key !== "scale") {
      throw new RenderError("E_INPUT", "math to png takes no option " + key);
    }
  }
  const scale = readScale(request.options);
  const svg = await mathToSvg(String(request.source), { display: true });
  return svgDocumentToPng(svg, request, scale);
}
export {
  render
};
