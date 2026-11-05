import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  dotToSvg
} from "../chunk-NP4BMKGN.mjs";
import {
  sourceText
} from "../chunk-C4DREIKQ.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/graph/backend-svg.js
async function render(request) {
  const names = Object.keys(request.options);
  if (names.length > 0) {
    throw new RenderError("E_INPUT", `dot to svg takes no options; got ${names.join(", ")}`);
  }
  const result = await dotToSvg(sourceText(request.source));
  return { bytes: new TextEncoder().encode(result.svg), warnings: result.warnings };
}
export {
  render
};
