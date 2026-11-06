import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  viewerPageHtml
} from "../chunk-EYA6V7TC.mjs";
import {
  render
} from "../chunk-LTNURLCF.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-html.js
async function render2(request) {
  const glb = await render(request);
  const html = viewerPageHtml(glb.bytes, { title: `${request.type} model`, controls: true });
  return { bytes: new TextEncoder().encode(html), warnings: glb.warnings };
}
export {
  render2 as render
};
