import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readLenient,
  renderMermaidSvg,
  routesToBrowser,
  sourceText
} from "../chunk-IZFBC4OM.mjs";
import {
  readScale,
  svgDocumentToPng
} from "../chunk-BCOPDUWL.mjs";
import "../chunk-4AHA64HQ.mjs";
import "../chunk-6VQDK4UZ.mjs";
import {
  drawMermaidInBrowser
} from "../chunk-EH5H6JDM.mjs";
import "../chunk-USVSPPCS.mjs";
import "../chunk-UDEV2G2S.mjs";
import {
  MAX_SCALE
} from "../chunk-RPY43LZL.mjs";
import "../chunk-T5W7ILUB.mjs";
import {
  RenderError
} from "../chunk-JFFRTQ6A.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/backend-png.js
async function render(request) {
  const source = sourceText(request.source);
  const { scale: _scale, ...rest } = request.options;
  const scale = readScale(request.options);
  if (scale > MAX_SCALE)
    throw new RenderError("E_INPUT", `option scale must not be more than ${MAX_SCALE}`);
  if (routesToBrowser(source)) {
    readLenient(rest, []);
    const out = await drawMermaidInBrowser(source, "png", request.settings, scale);
    return { bytes: out.bytes, warnings: out.warnings, backend: out.backend };
  }
  const svg = await renderMermaidSvg(source, rest);
  const png = await svgDocumentToPng(svg.svg, request, scale);
  return { bytes: png.bytes, warnings: [...svg.warnings, ...png.warnings ?? []] };
}
export {
  render
};
