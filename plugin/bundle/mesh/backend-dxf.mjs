import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  drawCad,
  drawMeshes,
  readCadRequest,
  readMeshes
} from "../chunk-JV7ODNEK.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/dxf.js
var BOUND = { point: 120, contour: 200, fixed: 1024 };
var coordinate = (value) => String(Number(value.toPrecision(10)));
var group = (code, value) => `${String(code).padStart(3)}\r
${value}\r
`;
function dxfByteLength(contours) {
  return contours.reduce((n, c) => n + BOUND.contour + BOUND.point * c.length, BOUND.fixed);
}
function writeDxf(contours) {
  const parts = [group(0, "SECTION"), group(2, "HEADER"), group(9, "$ACADVER"), group(1, "AC1009"), group(0, "ENDSEC")];
  parts.push(group(0, "SECTION"), group(2, "ENTITIES"));
  for (const contour of contours) {
    parts.push(group(0, "POLYLINE"), group(8, "0"), group(66, "1"), group(10, "0"), group(20, "0"), group(30, "0"), group(70, "1"));
    for (const [x, y] of contour) {
      parts.push(group(0, "VERTEX"), group(8, "0"), group(10, coordinate(x)), group(20, coordinate(y)), group(30, "0"));
    }
    parts.push(group(0, "SEQEND"), group(8, "0"));
  }
  parts.push(group(0, "ENDSEC"), group(0, "EOF"));
  return new TextEncoder().encode(parts.join(""));
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-dxf.js
function readZ(type, options) {
  for (const key of Object.keys(options)) {
    if (key !== "z")
      throw new RenderError("E_INPUT", `${type} to dxf takes no option ${key}`);
  }
  const z = options.z;
  if (z !== void 0 && (typeof z !== "number" || !Number.isFinite(z))) {
    throw new RenderError("E_INPUT", "option z must be a finite number");
  }
  return z;
}
async function render(request, deps = {}) {
  const z = readZ(request.type, request.options);
  const { maxCadFacets } = request.settings;
  const { contours, colored } = request.type === "cad" ? await drawCad(readCadRequest(request), maxCadFacets, z) : await drawMeshes(await readMeshes({ ...request, options: {} }, deps), maxCadFacets, z);
  if (contours.length === 0) {
    throw new RenderError("E_INPUT", z === void 0 ? "the outline holds no contour" : `the drawing at z = ${z} holds no contour`);
  }
  const needed = dxfByteLength(contours);
  const limitBytes = Math.floor(request.settings.maxMemoryMb * 1048576);
  if (needed > limitBytes) {
    throw new RenderError("E_LIMIT", "the dxf output needs " + needed + " bytes; the limit is " + limitBytes + " bytes");
  }
  return {
    bytes: writeDxf(contours),
    warnings: colored ? ["dxf holds no colour and no name; the colours of the model are dropped"] : void 0
  };
}
export {
  render
};
