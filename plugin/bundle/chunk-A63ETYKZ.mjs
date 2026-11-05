import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-JFFRTQ6A.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/glb.js
var MAGIC = 1179937895;
var VERSION = 2;
var CHUNK_JSON = 1313821514;
var CHUNK_BIN = 5130562;
var COMPONENT_UINT32 = 5125;
var COMPONENT_FLOAT32 = 5126;
var MODE_TRIANGLES = 4;
var DEFAULT_COLOUR = [0.8, 0.8, 0.8];
function triangleGroups(mesh) {
  const triangles = mesh.indices.length / 3;
  const keyOf = new Array(triangles).fill("default");
  for (const face of mesh.faces) {
    if (face.color === null)
      continue;
    const key = face.color.join(",");
    for (let t = face.first; t <= face.last && t < triangles; t++)
      keyOf[t] = key;
  }
  const groups = /* @__PURE__ */ new Map();
  for (let t = 0; t < triangles; t++) {
    const key = keyOf[t];
    const list = groups.get(key);
    if (list === void 0)
      groups.set(key, [t]);
    else
      list.push(t);
  }
  return groups;
}
function bytesOf(array) {
  return new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
}
function pad4(bytes, fill) {
  const padded = bytes.byteLength + 3 & ~3;
  if (padded === bytes.byteLength)
    return bytes;
  const out = new Uint8Array(padded).fill(fill);
  out.set(bytes);
  return out;
}
function writeGlb(meshes) {
  const materials = [];
  const materialIndex = /* @__PURE__ */ new Map();
  const materialOf = (key) => {
    let index = materialIndex.get(key);
    if (index === void 0) {
      index = materials.length;
      const colour = key === "default" ? DEFAULT_COLOUR : key.split(",").map(Number);
      materials.push({ name: key === "default" ? "default" : `face ${key}`, colour });
      materialIndex.set(key, index);
    }
    return index;
  };
  const accessors = [];
  const addAccessor = (accessor) => {
    accessors.push(accessor);
    return accessors.length - 1;
  };
  const gltfMeshes = [];
  const nodes = [];
  for (const mesh of meshes) {
    const groups = triangleGroups(mesh);
    if (groups.size === 0)
      continue;
    const positions = Float32Array.from(mesh.positions);
    const vertexCount = positions.length / 3;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i++) {
      const k = i % 3;
      min[k] = Math.min(min[k], positions[i]);
      max[k] = Math.max(max[k], positions[i]);
    }
    const attributes = {
      POSITION: addAccessor({ bytes: bytesOf(positions), componentType: COMPONENT_FLOAT32, type: "VEC3", count: vertexCount, min, max })
    };
    if (mesh.normals !== void 0) {
      const normals = Float32Array.from(mesh.normals);
      attributes.NORMAL = addAccessor({ bytes: bytesOf(normals), componentType: COMPONENT_FLOAT32, type: "VEC3", count: normals.length / 3 });
    }
    const primitives = [];
    for (const [key, triangles] of groups) {
      const indices = new Uint32Array(triangles.length * 3);
      triangles.forEach((t, n) => {
        indices[n * 3] = mesh.indices[t * 3];
        indices[n * 3 + 1] = mesh.indices[t * 3 + 1];
        indices[n * 3 + 2] = mesh.indices[t * 3 + 2];
      });
      const indexAccessor = addAccessor({ bytes: bytesOf(indices), componentType: COMPONENT_UINT32, type: "SCALAR", count: indices.length });
      primitives.push({ attributes, indices: indexAccessor, material: materialOf(key), mode: MODE_TRIANGLES });
    }
    nodes.push({ mesh: gltfMeshes.length, name: mesh.name });
    gltfMeshes.push({ name: mesh.name, primitives });
  }
  if (gltfMeshes.length === 0) {
    throw new RenderError("E_INPUT", "the meshes hold no triangles");
  }
  const views = [];
  const chunks = [];
  let total = 0;
  for (const accessor of accessors) {
    chunks.push(accessor.bytes);
    views.push({ byteOffset: total, byteLength: accessor.bytes.byteLength });
    total += accessor.bytes.byteLength;
  }
  const bin = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    bin.set(chunk, cursor);
    cursor += chunk.byteLength;
  }
  const json = {
    asset: { version: "2.0", generator: "sciengjs" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: gltfMeshes,
    materials: materials.map((m) => ({
      name: m.name,
      pbrMetallicRoughness: { baseColorFactor: [...m.colour, 1], metallicFactor: 0, roughnessFactor: 1 }
    })),
    accessors: accessors.map((a, i) => ({
      bufferView: i,
      byteOffset: 0,
      componentType: a.componentType,
      count: a.count,
      type: a.type,
      ...a.min !== void 0 ? { min: a.min, max: a.max } : {}
    })),
    bufferViews: views.map((v) => ({ buffer: 0, byteOffset: v.byteOffset, byteLength: v.byteLength })),
    buffers: [{ byteLength: total }]
  };
  const jsonBytes = pad4(new TextEncoder().encode(JSON.stringify(json)), 32);
  const binBytes = pad4(bin, 0);
  const length = 12 + 8 + jsonBytes.byteLength + 8 + binBytes.byteLength;
  const out = new Uint8Array(length);
  const view = new DataView(out.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint32(4, VERSION, true);
  view.setUint32(8, length, true);
  view.setUint32(12, jsonBytes.byteLength, true);
  view.setUint32(16, CHUNK_JSON, true);
  out.set(jsonBytes, 20);
  const binHeader = 20 + jsonBytes.byteLength;
  view.setUint32(binHeader, binBytes.byteLength, true);
  view.setUint32(binHeader + 4, CHUNK_BIN, true);
  out.set(binBytes, binHeader + 8);
  return out;
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/read.js
var READER = {
  step: "ReadStepFile",
  iges: "ReadIgesFile",
  brep: "ReadBrepFile"
};
var occtPromise;
function loadOcct() {
  if (occtPromise === void 0) {
    const started = import("./occt-import-js-EBKP3I3D.mjs").then((mod) => mod.default({ print: () => {
    }, printErr: () => {
    } }));
    occtPromise = started;
    started.catch(() => {
      if (occtPromise === started)
        occtPromise = void 0;
    });
  }
  return occtPromise;
}
function toCadMesh(mesh) {
  return {
    name: mesh.name,
    positions: Float32Array.from(mesh.attributes.position.array),
    normals: mesh.attributes.normal === void 0 ? void 0 : Float32Array.from(mesh.attributes.normal.array),
    indices: Uint32Array.from(mesh.index.array),
    faces: mesh.brep_faces.map((f) => ({
      first: f.first,
      last: f.last,
      color: f.color === null ? null : [f.color[0], f.color[1], f.color[2]]
    }))
  };
}
async function readCad(format, bytes, linearUnit = "millimeter") {
  const occt = await loadOcct();
  const read = occt[READER[format]];
  const params = format === "brep" ? null : { linearUnit };
  let result;
  try {
    result = read(bytes, params);
  } catch (error) {
    throw new RenderError("E_INPUT", `the ${format} reader failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!result.success) {
    throw new RenderError("E_INPUT", `the ${format} reader did not accept the file`);
  }
  return result.meshes.map(toCadMesh);
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-glb.js
var LINEAR_UNITS = ["millimeter", "meter"];
var DEFAULT_LINEAR_UNIT = "millimeter";
var GLB_COPIES = 4;
var MAX_GLB_BYTES = 4294967295;
function geometryBytes(meshes) {
  return meshes.reduce((n, m) => n + 4 * (m.positions.length + (m.normals?.length ?? 0) + m.indices.length), 0);
}
function estimateGlbBytes(meshes) {
  return geometryBytes(meshes) * GLB_COPIES;
}
function checkGlbLimit(meshes, maxMemoryMb) {
  const limitBytes = maxMemoryMb * 1048576;
  const needed = estimateGlbBytes(meshes);
  if (needed > limitBytes) {
    throw new RenderError("E_LIMIT", "the glb output needs " + needed + " bytes; the limit is " + limitBytes + " bytes");
  }
  const single = geometryBytes(meshes);
  if (single > MAX_GLB_BYTES) {
    throw new RenderError("E_LIMIT", "the glb geometry has " + single + " bytes; a glb file holds at most " + MAX_GLB_BYTES + " bytes");
  }
}
var FORMATS = ["step", "iges", "brep"];
function readMeshOptions(format, options) {
  for (const key of Object.keys(options)) {
    if (format === "brep" || key !== "linearUnit") {
      throw new RenderError("E_INPUT", `${format} to glb takes no option ${key}`);
    }
  }
  const unit = options.linearUnit ?? DEFAULT_LINEAR_UNIT;
  if (!LINEAR_UNITS.includes(unit)) {
    throw new RenderError("E_INPUT", "option linearUnit must be millimeter or meter");
  }
  return { linearUnit: unit };
}
async function render(request, deps = { readCad }) {
  const format = request.type;
  if (!FORMATS.includes(format)) {
    throw new RenderError("E_INPUT", `${request.type} is not a mesh input`);
  }
  if (!(request.source instanceof Uint8Array)) {
    throw new RenderError("E_INPUT", `${format} takes bytes, not text`);
  }
  const { linearUnit } = readMeshOptions(format, request.options);
  const meshes = await deps.readCad(format, request.source, linearUnit);
  const triangles = meshes.reduce((n, m) => n + m.indices.length / 3, 0);
  if (triangles === 0) {
    throw new RenderError("E_INPUT", `the ${format} file holds no triangles`);
  }
  checkGlbLimit(meshes, request.settings.maxMemoryMb);
  return { bytes: writeGlb(meshes) };
}

export {
  GLB_COPIES,
  estimateGlbBytes,
  readMeshOptions,
  render
};
