import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  renderTikzSvg
} from "../chunk-WFLGETN6.mjs";
import {
  sourceText
} from "../chunk-C4DREIKQ.mjs";
import "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/tex/backend-svg.js
async function render(request) {
  const result = await renderTikzSvg(sourceText(request.source), request.options, request.settings);
  return { bytes: new TextEncoder().encode(result.svg), warnings: result.warnings };
}
export {
  render
};
