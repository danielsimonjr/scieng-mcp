import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-WYJQ7P44.mjs";

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
    const list2 = groups.get(key);
    if (list2 === void 0)
      groups.set(key, [t]);
    else
      list2.push(t);
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

// node_modules/@danielsimonjr/sciengjs/dist/mesh/cad-document.js
var DEFAULT_SEGMENTS = 32;
var MIN_SEGMENTS = 3;
var MAX_SEGMENTS = 1024;
var STYLE_KEYS = ["type", "name", "color"];
var NODE_KEYS = {
  cube: ["size", "center"],
  cylinder: ["height", "radius", "radius1", "radius2", "center", "segments"],
  sphere: ["radius", "segments"],
  polyhedron: ["points", "faces"],
  rectangle: ["size", "center"],
  circle: ["radius", "segments"],
  polygon: ["points"],
  extrude: ["height", "child", "twist", "scale", "divisions", "center"],
  revolve: ["child", "degrees", "segments"],
  union: ["children"],
  difference: ["children"],
  intersection: ["children"],
  translate: ["offset", "child"],
  rotate: ["angles", "child"],
  scale: ["factor", "child"],
  mirror: ["normal", "child"]
};
var PROFILE_TYPES = ["rectangle", "circle", "polygon"];
var MAX_DIVISIONS = 1024;
var fail = (path, why) => {
  throw new RenderError("E_INPUT", `${path} ${why}`);
};
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function finite(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value))
    return fail(path, "must be a finite number");
  return value;
}
function positive(value, path) {
  const n = finite(value, path);
  if (n <= 0)
    fail(path, "must be greater than 0");
  return n;
}
function nonNegative(value, path) {
  const n = finite(value, path);
  if (n < 0)
    fail(path, "must not be negative");
  return n;
}
function vector(value, length, path, check = finite) {
  if (!Array.isArray(value) || value.length !== length)
    return fail(path, `must be a list of ${length} numbers`);
  return value.map((v, i) => check(v, `${path}[${i}]`));
}
function sizeOf(value, length, path) {
  if (typeof value === "number")
    positive(value, path);
  else
    vector(value, length, path, positive);
}
function bool(value, path) {
  if (typeof value !== "boolean")
    fail(path, "must be true or false");
}
function segmentsOf(value, path) {
  const n = finite(value, path);
  if (!Number.isInteger(n) || n < MIN_SEGMENTS || n > MAX_SEGMENTS) {
    fail(path, `must be a whole number from ${MIN_SEGMENTS} to ${MAX_SEGMENTS}`);
  }
  return n;
}
function list(value, path, min) {
  if (!Array.isArray(value) || value.length < min)
    return fail(path, `must be a list of ${min} or more items`);
  return value;
}
function countNode(walk) {
  walk.nodes += 1;
  if (walk.nodes > walk.limits.maxNodes) {
    throw new RenderError("E_LIMIT", `the document has more than ${walk.limits.maxNodes} nodes`);
  }
}
function addFacets(walk, facets) {
  walk.facets += facets;
  if (walk.facets > walk.limits.maxFacets) {
    throw new RenderError("E_LIMIT", `the model needs more than ${walk.limits.maxFacets} facets`);
  }
}
function sphereFacets(segments) {
  const k = Math.ceil(segments / 4);
  return 8 * k * k;
}
function checkStyle(node, path) {
  if (node.name !== void 0 && typeof node.name !== "string")
    fail(`${path}.name`, "must be a string");
  if (node.color !== void 0) {
    vector(node.color, 3, `${path}.color`, (v, p) => {
      const n = finite(v, p);
      if (n < 0 || n > 1)
        fail(p, "must be from 0 to 1");
      return n;
    });
  }
}
function checkKeys(node, type, path) {
  const allowed = [...STYLE_KEYS, ...NODE_KEYS[type]];
  for (const key of Object.keys(node)) {
    if (!allowed.includes(key))
      fail(`${path}.${key}`, `is not a key of ${type}`);
  }
}
function required(node, key, path) {
  if (node[key] === void 0)
    fail(`${path}.${key}`, "is missing");
  return node[key];
}
function nodeSegments(node, path, walk) {
  return node.segments === void 0 ? walk.segments : segmentsOf(node.segments, `${path}.segments`);
}
function checkProfile(value, path, walk) {
  if (!isObject(value))
    return fail(path, "must be an object");
  const type = value.type;
  if (typeof type !== "string" || !PROFILE_TYPES.includes(type)) {
    return fail(`${path}.type`, "must be a 2D profile: rectangle, circle or polygon");
  }
  countNode(walk);
  checkKeys(value, type, path);
  checkStyle(value, path);
  switch (type) {
    case "rectangle":
      sizeOf(required(value, "size", path), 2, `${path}.size`);
      if (value.center !== void 0)
        bool(value.center, `${path}.center`);
      return 4;
    case "circle":
      positive(required(value, "radius", path), `${path}.radius`);
      return nodeSegments(value, path, walk);
    default: {
      const points = list(required(value, "points", path), `${path}.points`, 3);
      points.forEach((p, i) => vector(p, 2, `${path}.points[${i}]`));
      return points.length;
    }
  }
}
function checkSolid(value, path, walk) {
  if (!isObject(value))
    return fail(path, "must be an object");
  const type = value.type;
  if (typeof type !== "string" || !Object.hasOwn(NODE_KEYS, type))
    return fail(`${path}.type`, "is not a node type");
  if (PROFILE_TYPES.includes(type))
    return fail(`${path}.type`, `${type} is a 2D profile; use it as the child of extrude or revolve`);
  countNode(walk);
  checkKeys(value, type, path);
  checkStyle(value, path);
  const childOf = () => checkSolid(required(value, "child", path), `${path}.child`, walk);
  switch (type) {
    case "cube":
      sizeOf(required(value, "size", path), 3, `${path}.size`);
      if (value.center !== void 0)
        bool(value.center, `${path}.center`);
      addFacets(walk, 12);
      return;
    case "cylinder": {
      positive(required(value, "height", path), `${path}.height`);
      if (value.radius !== void 0) {
        if (value.radius1 !== void 0 || value.radius2 !== void 0)
          fail(`${path}.radius`, "excludes radius1 and radius2");
        positive(value.radius, `${path}.radius`);
      } else {
        const r1 = nonNegative(required(value, "radius1", path), `${path}.radius1`);
        const r2 = nonNegative(required(value, "radius2", path), `${path}.radius2`);
        if (r1 === 0 && r2 === 0)
          fail(`${path}.radius1`, "and radius2 must not both be 0");
      }
      if (value.center !== void 0)
        bool(value.center, `${path}.center`);
      addFacets(walk, 4 * nodeSegments(value, path, walk));
      return;
    }
    case "sphere":
      positive(required(value, "radius", path), `${path}.radius`);
      addFacets(walk, sphereFacets(nodeSegments(value, path, walk)));
      return;
    case "polyhedron": {
      const points = list(required(value, "points", path), `${path}.points`, 4);
      points.forEach((p, i) => vector(p, 3, `${path}.points[${i}]`));
      const faces = list(required(value, "faces", path), `${path}.faces`, 4);
      let facets = 0;
      faces.forEach((f, i) => {
        const face = list(f, `${path}.faces[${i}]`, 3);
        face.forEach((v, j) => {
          if (!Number.isInteger(v) || v < 0 || v >= points.length) {
            fail(`${path}.faces[${i}][${j}]`, `must be a point index from 0 to ${points.length - 1}`);
          }
        });
        facets += face.length - 2;
      });
      addFacets(walk, facets);
      return;
    }
    case "extrude": {
      positive(required(value, "height", path), `${path}.height`);
      if (value.twist !== void 0)
        finite(value.twist, `${path}.twist`);
      if (value.scale !== void 0) {
        if (typeof value.scale === "number")
          nonNegative(value.scale, `${path}.scale`);
        else
          vector(value.scale, 2, `${path}.scale`, nonNegative);
      }
      let divisions = 0;
      if (value.divisions !== void 0) {
        divisions = finite(value.divisions, `${path}.divisions`);
        if (!Number.isInteger(divisions) || divisions < 0 || divisions > MAX_DIVISIONS) {
          fail(`${path}.divisions`, `must be a whole number from 0 to ${MAX_DIVISIONS}`);
        }
      }
      if (value.center !== void 0)
        bool(value.center, `${path}.center`);
      const edges = checkProfile(required(value, "child", path), `${path}.child`, walk);
      addFacets(walk, 2 * edges * (divisions + 1) + 2 * edges);
      return;
    }
    case "revolve": {
      if (value.degrees !== void 0) {
        const d = positive(value.degrees, `${path}.degrees`);
        if (d > 360)
          fail(`${path}.degrees`, "must not be more than 360");
      }
      const segments = nodeSegments(value, path, walk);
      const edges = checkProfile(required(value, "child", path), `${path}.child`, walk);
      addFacets(walk, 2 * edges * segments + 2 * edges);
      return;
    }
    case "union":
    case "difference":
    case "intersection": {
      const children = list(required(value, "children", path), `${path}.children`, 1);
      children.forEach((c, i) => checkSolid(c, `${path}.children[${i}]`, walk));
      return;
    }
    case "translate":
      vector(required(value, "offset", path), 3, `${path}.offset`);
      return childOf();
    case "rotate":
      vector(required(value, "angles", path), 3, `${path}.angles`);
      return childOf();
    case "scale": {
      const factor = required(value, "factor", path);
      if (typeof factor === "number")
        positive(factor, `${path}.factor`);
      else
        vector(factor, 3, `${path}.factor`, positive);
      return childOf();
    }
    default: {
      const n = vector(required(value, "normal", path), 3, `${path}.normal`);
      if (n.every((c) => c === 0))
        fail(`${path}.normal`, "must not be the zero vector");
      return childOf();
    }
  }
}
function checkCadDocument(value, limits) {
  if (!isObject(value))
    return fail("document", "must be an object");
  for (const key of Object.keys(value)) {
    if (!["version", "model", "segments"].includes(key))
      fail(key, "is not a key of the document");
  }
  if (value.version !== 1)
    fail("version", "must be 1");
  const walk = { nodes: 0, facets: 0, limits, segments: DEFAULT_SEGMENTS };
  if (value.segments !== void 0)
    walk.segments = segmentsOf(value.segments, "segments");
  checkSolid(required(value, "model", "document"), "model", walk);
  return { document: value, nodes: walk.nodes, facetEstimate: walk.facets };
}
function parseCadDocument(text, limits) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new RenderError("E_INPUT", `the CAD document is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return checkCadDocument(value, limits);
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/cad-build.js
var manifoldPromise;
function loadManifold() {
  if (manifoldPromise === void 0) {
    const started = import("./manifold-2AK4SJEA.mjs").then(async (mod) => {
      const wasm = await mod.default();
      wasm.setup();
      return wasm;
    });
    manifoldPromise = started;
    started.catch(() => {
      if (manifoldPromise === started)
        manifoldPromise = void 0;
    });
  }
  return manifoldPromise;
}
var SHARP_ANGLE = 60;
var NORMAL_CHANNEL = 0;
var NORMAL_OFFSET = 3 + NORMAL_CHANNEL;
var vec3 = (v) => typeof v === "number" ? [v, v, v] : v;
var Build = class {
  m;
  segments;
  maxFacets;
  colors = /* @__PURE__ */ new Map();
  live = [];
  constructor(m, segments, maxFacets) {
    this.m = m;
    this.segments = segments;
    this.maxFacets = maxFacets;
  }
  /** Rejects with E_LIMIT when a solid has more facets than the limit. An operation can add facets. */
  checkFacets(solid) {
    const facets = solid.numTri();
    if (facets > this.maxFacets) {
      throw new RenderError("E_LIMIT", `the model has ${facets} facets; the limit is ${this.maxFacets}`);
    }
    return solid;
  }
  /** Keeps an object for the final clean-up and returns it. */
  keep(value) {
    this.live.push(value);
    return value;
  }
  /** Frees every WASM object of the build. */
  free() {
    for (const value of this.live)
      value.delete();
    this.live.length = 0;
  }
  /** Marks a primitive as an original solid with a colour, so the faces of the result keep the colour. */
  primitive(solid, color) {
    const original = this.keep(solid.asOriginal());
    this.colors.set(original.originalID(), color);
    return original;
  }
  profile(node) {
    const { CrossSection } = this.m;
    switch (node.type) {
      case "rectangle":
        return this.keep(CrossSection.square(typeof node.size === "number" ? [node.size, node.size] : node.size, node.center ?? false));
      case "circle":
        return this.keep(CrossSection.circle(node.radius, node.segments ?? this.segments));
      default:
        return this.keep(CrossSection.ofPolygons([node.points]));
    }
  }
  solid(node, inherited) {
    const color = node.color ?? inherited;
    const { Manifold } = this.m;
    switch (node.type) {
      case "cube":
        return this.primitive(this.keep(Manifold.cube(vec3(node.size), node.center ?? false)), color);
      case "cylinder": {
        const low = node.radius ?? node.radius1;
        const high = node.radius ?? node.radius2;
        return this.primitive(this.keep(Manifold.cylinder(node.height, low, high, node.segments ?? this.segments, node.center ?? false)), color);
      }
      case "sphere":
        return this.primitive(this.keep(Manifold.sphere(node.radius, node.segments ?? this.segments)), color);
      case "polyhedron":
        return this.primitive(this.polyhedron(node.points, node.faces), color);
      case "extrude": {
        const profileColor = node.child.color ?? color;
        const scale = typeof node.scale === "number" ? [node.scale, node.scale] : node.scale ?? [1, 1];
        const solid = this.profile(node.child).extrude(node.height, node.divisions ?? 0, node.twist ?? 0, scale, node.center ?? false);
        return this.primitive(this.keep(solid), profileColor);
      }
      case "revolve": {
        const solid = this.profile(node.child).revolve(node.segments ?? this.segments, node.degrees ?? 360);
        return this.primitive(this.keep(solid), node.child.color ?? color);
      }
      case "union":
      case "difference":
      case "intersection": {
        const parts = node.children.map((child) => this.solid(child, color));
        if (parts.length === 1)
          return parts[0];
        return this.checkFacets(this.keep(Manifold[node.type](parts)));
      }
      case "translate":
        return this.keep(this.solid(node.child, color).translate(node.offset));
      case "rotate":
        return this.keep(this.solid(node.child, color).rotate(node.angles));
      case "scale":
        return this.keep(this.solid(node.child, color).scale(vec3(node.factor)));
      default:
        return this.keep(this.solid(node.child, color).mirror(node.normal));
    }
  }
  /** Builds a polyhedron. The build splits each face into a fan of triangles. */
  polyhedron(points, faces) {
    const triVerts = [];
    for (const face of faces) {
      for (let i = 1; i + 1 < face.length; i++)
        triVerts.push(face[0], face[i], face[i + 1]);
    }
    const mesh = new this.m.Mesh({ numProp: 3, vertProperties: Float32Array.from(points.flat()), triVerts: Uint32Array.from(triVerts) });
    let solid;
    try {
      solid = this.keep(this.m.Manifold.ofMesh(mesh));
    } catch (error) {
      throw new RenderError("E_INPUT", `the polyhedron is not a closed solid: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (solid.volume() < 0) {
      throw new RenderError("E_INPUT", "the polyhedron faces turn inward; give each face counter-clockwise, seen from outside");
    }
    return solid;
  }
};
function buildCad(document, maxFacets) {
  return withSolid(document, maxFacets, (solid, build) => {
    const shaded = build.keep(solid.calculateNormals(NORMAL_CHANNEL, SHARP_ANGLE));
    const out = shaded.getMesh(NORMAL_CHANNEL);
    return { mesh: toCadMesh(out, build.colors, document.model.name ?? "model"), volume: solid.volume() };
  });
}
function drawCad(document, maxFacets, z) {
  return withSolid(document, maxFacets, (solid, build) => {
    const section = build.keep(z === void 0 ? solid.project() : solid.slice(z));
    const colored = [...build.colors.values()].some((c) => c !== null);
    return { contours: section.toPolygons(), colored };
  });
}
async function withSolid(document, maxFacets, read) {
  const m = await loadManifold();
  const build = new Build(m, document.segments ?? DEFAULT_SEGMENTS, maxFacets);
  try {
    let solid;
    try {
      solid = build.solid(document.model, null);
    } catch (error) {
      if (error instanceof RenderError)
        throw error;
      throw new RenderError("E_INPUT", `the solid operations failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    const status = solid.status();
    if (status !== "NoError") {
      throw new RenderError("E_INPUT", `the solid operations failed: ${String(status)}`);
    }
    build.checkFacets(solid);
    return read(solid, build);
  } finally {
    build.free();
  }
}
function toCadMesh(out, colors, name) {
  const stride = out.numProp;
  const count = out.vertProperties.length / stride;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  for (let v = 0; v < count; v++) {
    for (let c = 0; c < 3; c++) {
      positions[v * 3 + c] = out.vertProperties[v * stride + c];
      normals[v * 3 + c] = out.vertProperties[v * stride + NORMAL_OFFSET + c];
    }
  }
  const faces = [];
  const runIndex = out.runIndex ?? Uint32Array.from([0, out.triVerts.length]);
  const runIds = out.runOriginalID ?? new Uint32Array(runIndex.length - 1);
  for (let r = 0; r + 1 < runIndex.length; r++) {
    const first = runIndex[r] / 3;
    const last = runIndex[r + 1] / 3 - 1;
    if (last < first)
      continue;
    faces.push({ first, last, color: colors.get(runIds[r]) ?? null });
  }
  return { name, positions, normals, indices: Uint32Array.from(out.triVerts), faces };
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
function toCadMesh2(mesh) {
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
  return result.meshes.map(toCadMesh2);
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
var DEFAULT_DEPS = { readCad, buildCad };
function readCadRequest(request) {
  if (typeof request.source !== "string")
    throw new RenderError("E_INPUT", "cad takes JSON text, not bytes");
  const { maxCadNodes, maxCadFacets } = request.settings;
  return parseCadDocument(request.source, { maxNodes: maxCadNodes, maxFacets: maxCadFacets }).document;
}
async function readMeshes(request, deps = {}) {
  const d = { ...DEFAULT_DEPS, ...deps };
  let meshes;
  if (request.type === "cad") {
    for (const key of Object.keys(request.options))
      throw new RenderError("E_INPUT", `cad takes no option ${key}`);
    meshes = [(await d.buildCad(readCadRequest(request), request.settings.maxCadFacets)).mesh];
  } else {
    const format = request.type;
    if (!FORMATS.includes(format)) {
      throw new RenderError("E_INPUT", `${request.type} is not a mesh input`);
    }
    if (!(request.source instanceof Uint8Array)) {
      throw new RenderError("E_INPUT", `${format} takes bytes, not text`);
    }
    const { linearUnit } = readMeshOptions(format, request.options);
    meshes = await d.readCad(format, request.source, linearUnit);
  }
  const triangles = meshes.reduce((n, m) => n + m.indices.length / 3, 0);
  if (triangles === 0) {
    throw new RenderError("E_INPUT", `the ${request.type} source holds no triangles`);
  }
  return meshes;
}
async function render(request, deps = {}) {
  const meshes = await readMeshes(request, deps);
  checkGlbLimit(meshes, request.settings.maxMemoryMb);
  return { bytes: writeGlb(meshes) };
}

export {
  DEFAULT_COLOUR,
  triangleGroups,
  drawCad,
  GLB_COPIES,
  estimateGlbBytes,
  readMeshOptions,
  readCadRequest,
  readMeshes,
  render
};
