import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readLenient,
  renderMermaidSvg,
  routesToBrowser
} from "../chunk-DNBSXUFS.mjs";
import {
  readScale,
  svgDocumentToPng
} from "../chunk-JYGQE4QP.mjs";
import "../chunk-2PW5RXKP.mjs";
import "../chunk-NP4BMKGN.mjs";
import {
  sourceText
} from "../chunk-C4DREIKQ.mjs";
import {
  drawMermaidInBrowser
} from "../chunk-PKPSVKBK.mjs";
import "../chunk-USVSPPCS.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-2WUEJW2H.mjs";
import {
  MAX_SCALE
} from "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
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
