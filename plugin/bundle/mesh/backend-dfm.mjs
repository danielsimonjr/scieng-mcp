import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  WALL_SECTIONS,
  measureCad,
  readCadRequest
} from "../chunk-LTNURLCF.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/dfm.js
var DFM_DEFAULTS = { overhang: 45, minWall: 0.8 };
var LISTED_SECTIONS = 10;
function supportArea(positions, triangles, minZ, overhang) {
  const limit = -Math.sin(overhang * Math.PI / 180);
  const bed = minZ + 1e-6 * Math.max(1, Math.abs(minZ));
  let total = 0;
  for (let t = 0; t < triangles.length; t += 3) {
    const a = triangles[t] * 3;
    const b = triangles[t + 1] * 3;
    const c = triangles[t + 2] * 3;
    if (positions[a + 2] <= bed && positions[b + 2] <= bed && positions[c + 2] <= bed)
      continue;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz);
    if (length > 0 && nz / length < limit)
      total += length / 2;
  }
  return total;
}
function fixed(value) {
  const rounded = Number(value.toFixed(3));
  return String(rounded === 0 ? 0 : rounded);
}
function writeDfmReport(measures, options) {
  const size = measures.max.map((high, i) => fixed(high - measures.min[i])).join(" x ");
  const support = supportArea(measures.positions, measures.triangles, measures.min[2], options.overhang);
  const supportText = fixed(support);
  const sections = 3 * WALL_SECTIONS;
  const lines = [
    "# Design for manufacture",
    "",
    "| Measure | Value |",
    "| --- | --- |",
    `| Size (X x Y x Z) | ${size} mm |`,
    `| Volume | ${fixed(measures.volume)} mm\xB3 |`,
    `| Surface area | ${fixed(measures.area)} mm\xB2 |`,
    "",
    "| Check | Result | Value | Limit |",
    "| --- | --- | --- | --- |",
    `| Overhang | ${support > 0 ? "fail" : "pass"} | ${supportText} mm\xB2 needs support | ${fixed(options.overhang)}\xB0 from the vertical |`,
    `| Minimum wall | ${measures.thin.length === 0 ? "pass" : "fail"} | ${measures.thin.length} of ${sections} sections have a thin region | ${fixed(options.minWall)} mm |`
  ];
  if (measures.thin.length > 0) {
    lines.push("", "## Thin walls", "");
    for (const axis of ["X", "Y", "Z"]) {
      const onAxis = measures.thin.filter((section) => section.axis === axis);
      for (const s of onAxis.slice(0, LISTED_SECTIONS))
        lines.push(`- ${axis} = ${fixed(s.at)} mm: ${fixed(s.area)} mm\xB2 thin`);
      if (onAxis.length > LISTED_SECTIONS)
        lines.push(`- and ${onAxis.length - LISTED_SECTIONS} more sections on ${axis}`);
    }
  }
  return new TextEncoder().encode(lines.join("\n") + "\n");
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-dfm.js
function readDfmOptions(options) {
  for (const key of Object.keys(options)) {
    if (key !== "overhang" && key !== "minWall")
      throw new RenderError("E_INPUT", `cad to md takes no option ${key}`);
  }
  const { overhang = DFM_DEFAULTS.overhang, minWall = DFM_DEFAULTS.minWall } = options;
  if (typeof overhang !== "number" || !(overhang > 0 && overhang < 90)) {
    throw new RenderError("E_INPUT", "option overhang must be a number larger than 0 and smaller than 90");
  }
  if (typeof minWall !== "number" || !Number.isFinite(minWall) || minWall <= 0) {
    throw new RenderError("E_INPUT", "option minWall must be a finite number larger than 0");
  }
  return { overhang, minWall };
}
async function render(request) {
  const options = readDfmOptions(request.options);
  const measures = await measureCad(readCadRequest(request), request.settings.maxCadFacets, options.minWall);
  return { bytes: writeDfmReport(measures, options) };
}
export {
  render
};
