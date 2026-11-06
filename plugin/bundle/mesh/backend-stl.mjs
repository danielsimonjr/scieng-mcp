import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  readMeshes
} from "../chunk-LTNURLCF.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/stl.js
var HEADER_BYTES = 80;
var FACET_BYTES = 50;
var HEADER_TEXT = "binary STL from sciengjs";
function stlFacetCount(meshes) {
  return meshes.reduce((n, m) => n + m.indices.length / 3, 0);
}
function stlByteLength(meshes) {
  return HEADER_BYTES + 4 + FACET_BYTES * stlFacetCount(meshes);
}
function writeStl(meshes) {
  const bytes = new Uint8Array(stlByteLength(meshes));
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode(HEADER_TEXT));
  view.setUint32(HEADER_BYTES, stlFacetCount(meshes), true);
  let at = HEADER_BYTES + 4;
  for (const mesh of meshes) {
    const p = mesh.positions;
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t] * 3, mesh.indices[t + 1] * 3, mesh.indices[t + 2] * 3];
      const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
      const v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const length = Math.hypot(n[0], n[1], n[2]) || 1;
      for (const value of [n[0] / length, n[1] / length, n[2] / length]) {
        view.setFloat32(at, value, true);
        at += 4;
      }
      for (const vertex of [a, b, c]) {
        for (let k = 0; k < 3; k++) {
          view.setFloat32(at, p[vertex + k], true);
          at += 4;
        }
      }
      view.setUint16(at, 0, true);
      at += 2;
    }
  }
  return bytes;
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-stl.js
async function render(request) {
  const meshes = await readMeshes(request);
  const needed = stlByteLength(meshes);
  const limitBytes = request.settings.maxMemoryMb * 1048576;
  if (needed > limitBytes) {
    throw new RenderError("E_LIMIT", "the stl output needs " + needed + " bytes; the limit is " + limitBytes + " bytes");
  }
  const colored = meshes.some((m) => m.faces.some((f) => f.color !== null));
  return { bytes: writeStl(meshes), warnings: colored ? ["stl holds no colour; the colours of the model are dropped"] : void 0 };
}
export {
  render
};
