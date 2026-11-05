import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  DEFAULT_ASSETS_URL
} from "./chunk-63AMPACY.mjs";
import {
  dotToSvg
} from "./chunk-NP4BMKGN.mjs";
import {
  sourceText
} from "./chunk-C4DREIKQ.mjs";
import {
  RESVG_WASM_FILE,
  bundledFontPathIn,
  readAsset
} from "./chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/graph/backend-png.js
import { readFileSync } from "node:fs";

// node_modules/@resvg/resvg-wasm/index.mjs
var wasm;
var heap = new Array(128).fill(void 0);
heap.push(void 0, null, true, false);
var heap_next = heap.length;
function addHeapObject(obj) {
  if (heap_next === heap.length)
    heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
function getObject(idx) {
  return heap[idx];
}
function dropObject(idx) {
  if (idx < 132)
    return;
  heap[idx] = heap_next;
  heap_next = idx;
}
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
var WASM_VECTOR_LEN = 0;
var cachedUint8Memory0 = null;
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}
var cachedTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} };
var encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8Memory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127)
      break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
var cachedInt32Memory0 = null;
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}
var cachedTextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
if (typeof TextDecoder !== "undefined") {
  cachedTextDecoder.decode();
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
var BBoxFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_bbox_free(ptr >>> 0));
var BBox = class _BBox {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_BBox.prototype);
    obj.__wbg_ptr = ptr;
    BBoxFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    BBoxFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_bbox_free(ptr);
  }
  /**
  * @returns {number}
  */
  get x() {
    const ret = wasm.__wbg_get_bbox_x(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set x(arg0) {
    wasm.__wbg_set_bbox_x(this.__wbg_ptr, arg0);
  }
  /**
  * @returns {number}
  */
  get y() {
    const ret = wasm.__wbg_get_bbox_y(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set y(arg0) {
    wasm.__wbg_set_bbox_y(this.__wbg_ptr, arg0);
  }
  /**
  * @returns {number}
  */
  get width() {
    const ret = wasm.__wbg_get_bbox_width(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set width(arg0) {
    wasm.__wbg_set_bbox_width(this.__wbg_ptr, arg0);
  }
  /**
  * @returns {number}
  */
  get height() {
    const ret = wasm.__wbg_get_bbox_height(this.__wbg_ptr);
    return ret;
  }
  /**
  * @param {number} arg0
  */
  set height(arg0) {
    wasm.__wbg_set_bbox_height(this.__wbg_ptr, arg0);
  }
};
var RenderedImageFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_renderedimage_free(ptr >>> 0));
var RenderedImage = class _RenderedImage {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_RenderedImage.prototype);
    obj.__wbg_ptr = ptr;
    RenderedImageFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    RenderedImageFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_renderedimage_free(ptr);
  }
  /**
  * Get the PNG width
  * @returns {number}
  */
  get width() {
    const ret = wasm.renderedimage_width(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
  * Get the PNG height
  * @returns {number}
  */
  get height() {
    const ret = wasm.renderedimage_height(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
  * Write the image data to Uint8Array
  * @returns {Uint8Array}
  */
  asPng() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.renderedimage_asPng(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * Get the RGBA pixels of the image
  * @returns {Uint8Array}
  */
  get pixels() {
    const ret = wasm.renderedimage_pixels(this.__wbg_ptr);
    return takeObject(ret);
  }
};
var ResvgFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_resvg_free(ptr >>> 0));
var Resvg = class {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    ResvgFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_resvg_free(ptr);
  }
  /**
  * @param {Uint8Array | string} svg
  * @param {string | undefined} [options]
  * @param {Array<any> | undefined} [custom_font_buffers]
  */
  constructor(svg, options, custom_font_buffers) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = isLikeNone(options) ? 0 : passStringToWasm0(options, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.resvg_new(retptr, addHeapObject(svg), ptr0, len0, isLikeNone(custom_font_buffers) ? 0 : addHeapObject(custom_font_buffers));
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      this.__wbg_ptr = r0 >>> 0;
      return this;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * Get the SVG width
  * @returns {number}
  */
  get width() {
    const ret = wasm.resvg_width(this.__wbg_ptr);
    return ret;
  }
  /**
  * Get the SVG height
  * @returns {number}
  */
  get height() {
    const ret = wasm.resvg_height(this.__wbg_ptr);
    return ret;
  }
  /**
  * Renders an SVG in Wasm
  * @returns {RenderedImage}
  */
  render() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.resvg_render(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return RenderedImage.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * Output usvg-simplified SVG string
  * @returns {string}
  */
  toString() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.resvg_toString(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
  * Calculate a maximum bounding box of all visible elements in this SVG.
  *
  * Note: path bounding box are approx values.
  * @returns {BBox | undefined}
  */
  innerBBox() {
    const ret = wasm.resvg_innerBBox(this.__wbg_ptr);
    return ret === 0 ? void 0 : BBox.__wrap(ret);
  }
  /**
  * Calculate a maximum bounding box of all visible elements in this SVG.
  * This will first apply transform.
  * Similar to `SVGGraphicsElement.getBBox()` DOM API.
  * @returns {BBox | undefined}
  */
  getBBox() {
    const ret = wasm.resvg_getBBox(this.__wbg_ptr);
    return ret === 0 ? void 0 : BBox.__wrap(ret);
  }
  /**
  * Use a given `BBox` to crop the svg. Currently this method simply changes
  * the viewbox/size of the svg and do not move the elements for simplicity
  * @param {BBox} bbox
  */
  cropByBBox(bbox) {
    _assertClass(bbox, BBox);
    wasm.resvg_cropByBBox(this.__wbg_ptr, bbox.__wbg_ptr);
  }
  /**
  * @returns {Array<any>}
  */
  imagesToResolve() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.resvg_imagesToResolve(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {string} href
  * @param {Uint8Array} buffer
  */
  resolveImage(href, buffer) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(href, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      wasm.resvg_resolveImage(retptr, this.__wbg_ptr, ptr0, len0, addHeapObject(buffer));
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      if (r1) {
        throw takeObject(r0);
      }
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
};
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get("Content-Type") != "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}
function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbg_new_28c511d9baebfa89 = function(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_memory = function() {
    const ret = wasm.memory;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_buffer_12d079cc21e14bdb = function(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_newwithbyteoffsetandlength_aa4a17c33a06e5cb = function(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
  };
  imports.wbg.__wbg_new_63b92bc8671ed464 = function(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_values_839f3396d5aac002 = function(arg0) {
    const ret = getObject(arg0).values();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_next_196c84450b364254 = function() {
    return handleError(function(arg0) {
      const ret = getObject(arg0).next();
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_done_298b57d23c0fc80c = function(arg0) {
    const ret = getObject(arg0).done;
    return ret;
  };
  imports.wbg.__wbg_value_d93c65011f51a456 = function(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_instanceof_Uint8Array_2b3bbecd033d19f6 = function(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof obj === "string" ? obj : void 0;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_new_16b304a2cfa7ff4a = function() {
    const ret = new Array();
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_push_a5b05aedc7234f9f = function(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
  };
  imports.wbg.__wbg_length_c20a40f15020d68a = function(arg0) {
    const ret = getObject(arg0).length;
    return ret;
  };
  imports.wbg.__wbg_set_a47bac70306a19a7 = function(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
  };
  imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };
  return imports;
}
function __wbg_init_memory(imports, maybe_memory) {
}
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module;
  cachedInt32Memory0 = null;
  cachedUint8Memory0 = null;
  return wasm;
}
async function __wbg_init(input) {
  if (wasm !== void 0)
    return wasm;
  if (typeof input === "undefined") {
    input = new URL("index_bg.wasm", void 0);
  }
  const imports = __wbg_get_imports();
  if (typeof input === "string" || typeof Request === "function" && input instanceof Request || typeof URL === "function" && input instanceof URL) {
    input = fetch(input);
  }
  __wbg_init_memory(imports);
  const { instance, module } = await __wbg_load(await input, imports);
  return __wbg_finalize_init(instance, module);
}
var dist_default = __wbg_init;
var initialized = false;
var initWasm = async (module_or_path) => {
  if (initialized) {
    throw new Error("Already initialized. The `initWasm()` function can be used only once.");
  }
  await dist_default(await module_or_path);
  initialized = true;
};
var Resvg2 = class extends Resvg {
  /**
   * @param {Uint8Array | string} svg
   * @param {ResvgRenderOptions | undefined} options
   */
  constructor(svg, options) {
    if (!initialized)
      throw new Error("Wasm has not been initialized. Call `initWasm()` function.");
    const font = options?.font;
    if (!!font && isCustomFontsOptions(font)) {
      const serializableOptions = {
        ...options,
        font: {
          ...font,
          fontBuffers: void 0
        }
      };
      super(svg, JSON.stringify(serializableOptions), font.fontBuffers);
    } else {
      super(svg, JSON.stringify(options));
    }
  }
};
function isCustomFontsOptions(value) {
  return Object.prototype.hasOwnProperty.call(value, "fontBuffers");
}

// node_modules/@danielsimonjr/sciengjs/dist/raster/index.js
var MAX_PNG_PIXEL_MB = 1024;
var wasmPromise;
function ensureWasm(readWasm) {
  if (wasmPromise === void 0) {
    const started = (async () => {
      const bytes = readWasm();
      try {
        await initWasm(bytes);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new RenderError("E_STAGE_MISSING", RESVG_WASM_FILE + " is not a usable WebAssembly module: " + message);
      }
    })();
    wasmPromise = started;
    started.catch(() => {
      if (wasmPromise === started) {
        wasmPromise = void 0;
      }
    });
  }
  return wasmPromise;
}
async function svgToPng(svg, options) {
  const assetsUrl = options.assetsUrl ?? DEFAULT_ASSETS_URL;
  await ensureWasm(options.readWasm ?? (() => readAsset(assetsUrl, RESVG_WASM_FILE)));
  let resvg;
  try {
    resvg = new Resvg2(svg, {
      fitTo: { mode: "zoom", value: options.scale },
      dpi: 72,
      font: { loadSystemFonts: false, fontBuffers: options.font ? [options.font] : [] }
    });
  } catch (err) {
    throw new RenderError("E_INPUT", "resvg cannot read the SVG: " + (err instanceof Error ? err.message : String(err)));
  }
  try {
    const limitMb = Math.min(options.maxMemoryMb, MAX_PNG_PIXEL_MB);
    const limitBytes = limitMb * 1048576;
    const needed = Math.ceil(resvg.width * options.scale) * Math.ceil(resvg.height * options.scale) * 4;
    if (needed > limitBytes) {
      throw new RenderError("E_LIMIT", "the PNG needs " + needed + " bytes of pixels; the limit is " + limitBytes + " bytes");
    }
    return resvg.render().asPng();
  } finally {
    resvg.free();
  }
}
function isFontFile(bytes) {
  if (bytes.length < 4) {
    return false;
  }
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  if (b0 === 0 && b1 === 1 && b2 === 0 && b3 === 0) {
    return true;
  }
  if (b0 === 79 && b1 === 84 && b2 === 84 && b3 === 79) {
    return true;
  }
  if (b0 === 116 && b1 === 114 && b2 === 117 && b3 === 101) {
    return true;
  }
  return false;
}

// node_modules/@danielsimonjr/sciengjs/dist/raster/warnings.js
function tableOf(view, tag) {
  if (view.byteLength < 12) {
    return void 0;
  }
  const count = view.getUint16(4);
  for (let i = 0; i < count; i++) {
    const entry = 12 + i * 16;
    if (entry + 16 > view.byteLength) {
      return void 0;
    }
    let name = "";
    for (let k = 0; k < 4; k++) {
      name += String.fromCharCode(view.getUint8(entry + k));
    }
    if (name === tag) {
      return { offset: view.getUint32(entry + 8), length: view.getUint32(entry + 12) };
    }
  }
  return void 0;
}
function format4(view, start) {
  const segments = view.getUint16(start + 6) / 2;
  const ends = start + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const ranges = deltas + segments * 2;
  return (cp) => {
    if (cp > 65535) {
      return false;
    }
    for (let s = 0; s < segments; s++) {
      if (cp > view.getUint16(ends + s * 2)) {
        continue;
      }
      const first = view.getUint16(starts + s * 2);
      if (cp < first) {
        return false;
      }
      const offset = view.getUint16(ranges + s * 2);
      let glyph;
      if (offset === 0) {
        glyph = cp + view.getUint16(deltas + s * 2) & 65535;
      } else {
        const at = ranges + s * 2 + offset + (cp - first) * 2;
        if (at + 2 > view.byteLength) {
          return false;
        }
        glyph = view.getUint16(at);
        if (glyph !== 0) {
          glyph = glyph + view.getUint16(deltas + s * 2) & 65535;
        }
      }
      return glyph !== 0;
    }
    return false;
  };
}
function format12(view, start) {
  const groups = view.getUint32(start + 12);
  return (cp) => {
    for (let g = 0; g < groups; g++) {
      const at = start + 16 + g * 12;
      if (at + 12 > view.byteLength) {
        return false;
      }
      if (cp >= view.getUint32(at) && cp <= view.getUint32(at + 4)) {
        return true;
      }
    }
    return false;
  };
}
function fontCovers(font) {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  try {
    const cmap = tableOf(view, "cmap");
    if (cmap === void 0) {
      return void 0;
    }
    const tests = [];
    const count = view.getUint16(cmap.offset + 2);
    for (let i = 0; i < count; i++) {
      const record = cmap.offset + 4 + i * 8;
      const platform = view.getUint16(record);
      const encoding = view.getUint16(record + 2);
      const unicode = platform === 0 || platform === 3 && (encoding === 1 || encoding === 10);
      if (!unicode) {
        continue;
      }
      const sub = cmap.offset + view.getUint32(record + 4);
      const format = view.getUint16(sub);
      if (format === 4) {
        tests.push(format4(view, sub));
      } else if (format === 12) {
        tests.push(format12(view, sub));
      }
    }
    if (tests.length === 0) {
      return void 0;
    }
    return (cp) => tests.some((test) => test(cp));
  } catch {
    return void 0;
  }
}
function decodeEntities(text) {
  return text.replace(/&#(x[0-9a-fA-F]+|[0-9]+);/g, (whole, body) => {
    const value = body.startsWith("x") ? parseInt(body.slice(1), 16) : parseInt(body, 10);
    return value <= 1114111 ? String.fromCodePoint(value) : whole;
  });
}
function isBold(weight) {
  const value = weight.trim().toLowerCase();
  return value === "bold" || value === "bolder" || /^[0-9]+$/.test(value) && Number(value) >= 600;
}
function textOf(markup) {
  return decodeEntities(markup.replace(/<[^>]*>/g, ""));
}
function rasterWarnings(svg, font) {
  const covers = fontCovers(font);
  let bold = 0;
  let italic = 0;
  const missing = /* @__PURE__ */ new Set();
  for (const match of svg.matchAll(/<(?:text|tspan)\b([^>]*)>/g)) {
    const attributes = match[1];
    const weight = /\sfont-weight="([^"]*)"/.exec(attributes);
    if (weight !== null && isBold(weight[1])) {
      bold++;
    }
    const style = /\sfont-style="([^"]*)"/.exec(attributes);
    if (style !== null && (style[1] === "italic" || style[1] === "oblique")) {
      italic++;
    }
  }
  if (covers !== void 0) {
    for (const match of svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
      for (const ch of textOf(match[1])) {
        const cp = ch.codePointAt(0);
        if (cp > 32 && cp !== 160 && !(cp >= 127 && cp < 160) && !covers(cp)) {
          missing.add(cp);
        }
      }
    }
  }
  const warnings = [];
  if (covers === void 0 && /<text\b/.test(svg)) {
    warnings.push("the raster font has no readable character map, so the render cannot check which characters it draws");
  }
  if (bold > 0) {
    warnings.push(`${bold} bold text element(s) draw in the one face of the raster font`);
  }
  if (italic > 0) {
    warnings.push(`${italic} italic text element(s) draw in the one face of the raster font`);
  }
  if (missing.size > 0) {
    const first = [...missing][0];
    const code = "U+" + first.toString(16).toUpperCase().padStart(4, "0");
    warnings.push(`${missing.size} character(s) have no glyph in the raster font and draw blank (first: ${code})`);
  }
  return warnings;
}

// node_modules/@danielsimonjr/sciengjs/dist/graph/backend-png.js
function readFont(path, bundled) {
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    throw bundled ? new RenderError("E_STAGE_MISSING", "the bundled raster font is missing: " + path) : new RenderError("E_CONFIG", "rasterFont cannot be read: " + path);
  }
  if (!isFontFile(bytes)) {
    throw bundled ? new RenderError("E_STAGE_MISSING", "the bundled raster font is not a font: " + path) : new RenderError("E_CONFIG", "rasterFont is not a TrueType or OpenType font: " + path);
  }
  return bytes;
}
function fontOf(settings, bundledFontPath) {
  const rasterFont = settings.rasterFont;
  return readFont(rasterFont ?? bundledFontPath, rasterFont === void 0);
}
function readScale(options) {
  const value = options.scale;
  if (value === void 0)
    return 1;
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  throw new RenderError("E_INPUT", "option scale must be a finite number greater than 0");
}
async function render(request) {
  return renderPng(request, bundledFontPathIn(request.settings.assetsUrl));
}
async function renderPng(request, bundledFontPath) {
  const options = request.options;
  for (const key of Object.keys(options)) {
    if (key !== "scale") {
      throw new RenderError("E_INPUT", "dot to png takes no option " + key);
    }
  }
  const scale = readScale(options);
  const font = fontOf(request.settings, bundledFontPath);
  const dot = await dotToSvg(sourceText(request.source));
  const bytes = await svgToPng(dot.svg, {
    scale,
    maxMemoryMb: request.settings.maxMemoryMb,
    font,
    assetsUrl: request.settings.assetsUrl
  });
  return { bytes, warnings: [...dot.warnings, ...rasterWarnings(dot.svg, font)] };
}
async function svgDocumentToPng(svg, request, scale = 1) {
  const font = fontOf(request.settings, bundledFontPathIn(request.settings.assetsUrl));
  const bytes = await svgToPng(svg, {
    scale,
    maxMemoryMb: request.settings.maxMemoryMb,
    font,
    assetsUrl: request.settings.assetsUrl
  });
  return { bytes, warnings: rasterWarnings(svg, font) };
}

export {
  readScale,
  render,
  renderPng,
  svgDocumentToPng
};
