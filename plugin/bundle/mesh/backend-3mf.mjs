import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  threemfByteLength,
  write3mf
} from "../chunk-L76FZCQ3.mjs";
import {
  readMeshes
} from "../chunk-JV7ODNEK.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-3mf.js
async function render(request) {
  const meshes = await readMeshes(request);
  const needed = threemfByteLength(meshes);
  const limitBytes = Math.floor(request.settings.maxMemoryMb * 1048576);
  if (needed > limitBytes) {
    throw new RenderError("E_LIMIT", "the 3mf output needs " + needed + " bytes; the limit is " + limitBytes + " bytes");
  }
  return { bytes: write3mf(meshes) };
}
export {
  render
};
