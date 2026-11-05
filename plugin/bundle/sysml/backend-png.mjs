import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  renderSysmlSvg
} from "../chunk-YJZFM6Y7.mjs";
import {
  readScale,
  svgDocumentToPng
} from "../chunk-L2F2SPKX.mjs";
import "../chunk-HO75XVEK.mjs";
import {
  sourceText
} from "../chunk-4MDRDRCG.mjs";
import {
  MAX_SCALE
} from "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/sysml/backend-png.js
async function render(request) {
  const { scale: _scale, ...rest } = request.options;
  const scale = readScale(request.options);
  if (scale > MAX_SCALE)
    throw new RenderError("E_INPUT", `option scale must not be more than ${MAX_SCALE}`);
  const svg = await renderSysmlSvg(sourceText(request.source), rest);
  const png = await svgDocumentToPng(svg.svg, request, scale);
  return { bytes: png.bytes, warnings: [...svg.warnings, ...png.warnings ?? []] };
}
export {
  render
};
