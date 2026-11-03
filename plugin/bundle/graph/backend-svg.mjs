import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  dotSourceText,
  dotToSvg
} from "../chunk-4KI3PA2R.mjs";
import {
  RenderError
} from "../chunk-JFFRTQ6A.mjs";
import "../chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/graph/backend-svg.js
async function render(request) {
  const names = Object.keys(request.options);
  if (names.length > 0) {
    throw new RenderError("E_INPUT", `dot to svg takes no options; got ${names.join(", ")}`);
  }
  const result = await dotToSvg(dotSourceText(request.source));
  return { bytes: new TextEncoder().encode(result.svg), warnings: result.warnings };
}
export {
  render
};
