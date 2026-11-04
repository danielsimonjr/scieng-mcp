import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-JFFRTQ6A.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/plot/reader.js
var SHAPES_SPEC = "shapes";
var ENUM_PREFIX = "enum:";
var AXIS_KEY_PATTERN = /^(x|y)axis([2-9]|[1-9]\d+)?$/;
var AXIS_ID_PATTERN = /^[xy]([2-9]|[1-9]\d+)?$/;
var TICKFORMAT_PATTERN = /^\.(\d|1\d|20)f$/;
var TOP_LEVEL_KEYS = ["data", "layout"];
var TRACE_SPECS = /* @__PURE__ */ new Map([
  ["type", "enum:scatter"],
  ["mode", "enum:lines|markers|lines+markers|markers+text|text"],
  ["x", "numberArray"],
  ["y", "numberArray"],
  ["name", "string"],
  ["text", "stringOrStringArray"],
  [
    "textposition",
    "enum:top left|top center|top right|middle left|middle center|middle right|bottom left|bottom center|bottom right"
  ],
  ["line.color", "string"],
  ["line.width", "number"],
  ["line.dash", "enum:solid|dot|dash|longdash|dashdot"],
  ["marker.size", "number"],
  ["marker.color", "string"],
  ["marker.symbol", "enum:circle|square|diamond|cross|x|triangle-up"],
  ["xaxis", "axisId:x"],
  ["yaxis", "axisId:y"],
  ["showlegend", "boolean"]
]);
var LAYOUT_SPECS = /* @__PURE__ */ new Map([
  ["title.text", "string"],
  ["width", "positiveNumber"],
  ["height", "positiveNumber"],
  ["paper_bgcolor", "string"],
  ["plot_bgcolor", "string"],
  ["font.color", "string"],
  ["font.size", "number"],
  ["showlegend", "boolean"],
  ["grid.rows", "int"],
  ["grid.columns", "int"],
  ["grid.pattern", "enum:independent|coupled"],
  ["shapes", SHAPES_SPEC]
]);
var AXIS_SPECS = /* @__PURE__ */ new Map([
  ["type", "enum:linear|log"],
  ["title.text", "string"],
  ["range", "pair"],
  ["dtick", "positiveNumber"],
  ["tickformat", "tickformat"],
  ["gridcolor", "string"],
  ["zeroline", "boolean"],
  ["zerolinecolor", "string"],
  ["matches", "axisId"]
]);
var SHAPE_SPECS = /* @__PURE__ */ new Map([
  ["type", "enum:line|rect"],
  ["xref", "string"],
  ["yref", "string"],
  ["x0", "number"],
  ["x1", "number"],
  ["y0", "number"],
  ["y1", "number"],
  ["line.color", "string"],
  ["line.width", "number"],
  ["fillcolor", "string"]
]);
function inputError(message) {
  return new RenderError("E_INPUT", message);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function validateValue(value, spec, path) {
  switch (spec) {
    case "string":
      if (typeof value !== "string")
        throw inputError(`${path} must be a string`);
      return;
    case "number":
      if (!isNumber(value))
        throw inputError(`${path} must be a number`);
      return;
    case "positiveNumber":
      if (!isNumber(value) || value <= 0)
        throw inputError(`${path} must be a number above zero`);
      return;
    case "tickformat":
      if (typeof value !== "string" || !TICKFORMAT_PATTERN.test(value)) {
        throw inputError(`${path} must be ".Nf" with N from 0 to 20 (got ${String(value)})`);
      }
      return;
    case "axisId":
      if (typeof value !== "string" || !AXIS_ID_PATTERN.test(value)) {
        throw inputError(`${path} must be an axis id such as x, y or x2 (got ${String(value)})`);
      }
      return;
    case "axisId:x":
    case "axisId:y":
      if (typeof value !== "string" || !AXIS_ID_PATTERN.test(value) || value[0] !== spec.slice(-1)) {
        throw inputError(`${path} must be an axis id such as ${spec.slice(-1)} or ${spec.slice(-1)}2 (got ${String(value)})`);
      }
      return;
    case "boolean":
      if (typeof value !== "boolean")
        throw inputError(`${path} must be a boolean`);
      return;
    case "int":
      if (!isNumber(value) || !Number.isInteger(value) || value <= 0) {
        throw inputError(`${path} must be a positive integer`);
      }
      return;
    case "numberArray":
      if (!Array.isArray(value))
        throw inputError(`${path} must be an array of numbers`);
      for (let index = 0; index < value.length; index += 1) {
        if (!isNumber(value[index]))
          throw inputError(`${path}[${index}] must be a finite number`);
      }
      return;
    case "stringOrStringArray":
      if (typeof value === "string")
        return;
      if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
        throw inputError(`${path} must be a string or an array of strings`);
      }
      return;
    case "pair":
      if (!Array.isArray(value) || value.length !== 2 || !value.every(isNumber)) {
        throw inputError(`${path} must be an array of exactly two numbers`);
      }
      return;
    default:
      if (spec.startsWith(ENUM_PREFIX)) {
        const allowed = spec.slice(ENUM_PREFIX.length).split("|");
        if (typeof value !== "string" || !allowed.includes(value)) {
          throw inputError(`${path} must be one of ${allowed.join(", ")}`);
        }
        return;
      }
      throw inputError(`${path} has unsupported validation spec`);
  }
}
function readLevel(source, path, specs, lenient, warnings) {
  const leafSpecs = /* @__PURE__ */ new Map();
  const childSpecs = /* @__PURE__ */ new Map();
  for (const [dottedKey, spec] of specs) {
    const separator = dottedKey.indexOf(".");
    if (separator >= 0) {
      const head = dottedKey.slice(0, separator);
      let child = childSpecs.get(head);
      if (child === void 0) {
        child = /* @__PURE__ */ new Map();
        childSpecs.set(head, child);
      }
      child.set(dottedKey.slice(separator + 1), spec);
    } else {
      leafSpecs.set(dottedKey, spec);
    }
  }
  const result = {};
  for (const key of Object.keys(source)) {
    const value = source[key];
    const keyPath = `${path}.${key}`;
    const leafSpec = leafSpecs.get(key);
    if (leafSpec !== void 0) {
      if (leafSpec === SHAPES_SPEC) {
        result[key] = readShapes(value, keyPath, lenient, warnings);
      } else {
        validateValue(value, leafSpec, keyPath);
        result[key] = value;
      }
      continue;
    }
    const childSpec = childSpecs.get(key);
    if (childSpec !== void 0) {
      if (!isRecord(value))
        throw inputError(`${keyPath} must be an object`);
      result[key] = readLevel(value, keyPath, childSpec, lenient, warnings);
      continue;
    }
    const message = `unknown plot figure key ${keyPath}`;
    if (lenient) {
      warnings.push(message);
    } else {
      throw inputError(message);
    }
  }
  return result;
}
function readShapes(value, path, lenient, warnings) {
  if (!Array.isArray(value))
    throw inputError(`${path} must be an array of shape objects`);
  const shapes = [];
  for (let index = 0; index < value.length; index += 1) {
    const element = value[index];
    const elementPath = `${path}[${index}]`;
    if (!isRecord(element))
      throw inputError(`${elementPath} must be an object`);
    shapes.push(readLevel(element, elementPath, SHAPE_SPECS, lenient, warnings));
  }
  return shapes;
}
function buildLayoutSpecs(layout) {
  const specs = new Map(LAYOUT_SPECS);
  for (const key of Object.keys(layout)) {
    if (!AXIS_KEY_PATTERN.test(key))
      continue;
    for (const [subKey, subSpec] of AXIS_SPECS)
      specs.set(`${key}.${subKey}`, subSpec);
  }
  return specs;
}
function readPlotFigure(input, options) {
  const lenient = options?.lenient === true;
  const warnings = [];
  let parsed = input;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw inputError(`plot figure is not valid JSON text: ${detail}`);
    }
  }
  if (!isRecord(parsed))
    throw inputError('plot figure must be an object with "data" and "layout" keys');
  if (!Array.isArray(parsed.data))
    throw inputError('plot figure "data" must be an array of traces');
  for (const key of Object.keys(parsed)) {
    if (TOP_LEVEL_KEYS.includes(key))
      continue;
    const message = `unknown plot figure key ${key}: a figure holds only data and layout`;
    if (lenient)
      warnings.push(message);
    else
      throw inputError(message);
  }
  const layoutSource = parsed.layout;
  if (layoutSource !== void 0 && layoutSource !== null && !isRecord(layoutSource)) {
    throw inputError('plot figure "layout" must be an object');
  }
  const rawTraces = parsed.data;
  const data = [];
  for (let index = 0; index < rawTraces.length; index += 1) {
    const trace = rawTraces[index];
    if (!isRecord(trace))
      throw inputError(`data[${index}] must be an object`);
    data.push(readLevel(trace, `data[${index}]`, TRACE_SPECS, lenient, warnings));
  }
  const layoutRoot = isRecord(layoutSource) ? layoutSource : {};
  const layout = readLevel(layoutRoot, "layout", buildLayoutSpecs(layoutRoot), lenient, warnings);
  return { figure: { data, layout }, warnings };
}

// node_modules/@danielsimonjr/sciengjs/dist/plot/ticks.js
var MAX_TICKS = 1e3;
function paddedRange(min, max) {
  const pad = (max - min) * 0.05;
  return [min - pad, max + pad];
}
function linearTicks(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new RenderError("E_INPUT", `linearTicks: min and max must be finite with min <= max (got ${min}, ${max})`);
  }
  let lo = min;
  let hi = max;
  if (lo === hi) {
    lo = min - 1;
    hi = max + 1;
  }
  const raw = (hi - lo) / 4;
  const exp = Math.floor(Math.log10(raw));
  const mag = Math.pow(10, exp);
  const f = raw / mag;
  let nf;
  if (f < 1.5)
    nf = 1;
  else if (f < 3)
    nf = 2;
  else if (f < 7)
    nf = 5;
  else
    nf = 10;
  const step = nf * mag;
  const first = Math.ceil(lo / step);
  const last = Math.floor(hi / step);
  const den = exp < 0 ? Math.pow(10, -exp) : 1;
  const ticks = [];
  for (let k = first; k <= last; k++) {
    ticks.push(exp < 0 ? k * nf / den : k * nf * mag);
  }
  return ticks;
}
function logTicks(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || min > max) {
    throw new RenderError("E_INPUT", `logTicks: min and max must be finite, positive, with min <= max (got ${min}, ${max})`);
  }
  const firstDecade = Math.floor(Math.log10(min));
  const lastDecade = Math.ceil(Math.log10(max));
  if ((lastDecade - firstDecade + 1) * 9 > MAX_TICKS) {
    throw new RenderError("E_INPUT", `logTicks: the range ${min} to ${max} needs more than ${MAX_TICKS} ticks`);
  }
  const ticks = [];
  for (let n = firstDecade; n <= lastDecade; n++) {
    const base = Math.pow(10, Math.abs(n));
    for (let k = 1; k <= 9; k++) {
      const value = n < 0 ? k / base : k * base;
      if (value < min || value > max)
        continue;
      if (ticks.length > 0 && ticks[ticks.length - 1].value === value)
        continue;
      ticks.push({ value, major: k === 1 });
    }
  }
  return ticks;
}

// node_modules/@danielsimonjr/sciengjs/dist/plot/plotter.js
var COLORWAY = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
var defaultColor = (index) => COLORWAY[index % COLORWAY.length];
var DEFAULT_AXIS_LINE = "#444444";
var FRAME = { left: 70, right: 20, top: 20, bottom: 60, gap: 60 };
var DASH = {
  solid: "",
  dot: "2,3",
  dash: "8,4",
  longdash: "12,4",
  dashdot: "8,4,2,4"
};
function fail(message) {
  throw new RenderError("E_INPUT", message);
}
function rec(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function num(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function str(value, fallback) {
  return typeof value === "string" ? value : fallback;
}
function esc(text2) {
  return text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function fmt(value, decimals) {
  const text2 = value.toFixed(decimals);
  return /^-0(\.0*)?$/.test(text2) ? text2.slice(1) : text2;
}
var MAX_FIXED_DECIMALS = 20;
var LOG_MAJOR_TARGET = 10;
function tickLabel(value, decimals) {
  if (decimals <= MAX_FIXED_DECIMALS)
    return fmt(value, decimals);
  return value === 0 ? "0" : value.toExponential();
}
function decimalsFor(step) {
  return step > 0 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
}
function axisKey(id) {
  return id.replace(/^([xy])(\d*)$/, (_all, letter, n) => `${letter}axis${n}`);
}
function axisId(letter, n) {
  return n === 1 ? letter : `${letter}${n}`;
}
function frac(scale, value) {
  const units = scale.log ? Math.log10(value) : value;
  const t = (units - scale.lo) / (scale.hi - scale.lo);
  return scale.reversed ? 1 - t : t;
}
function text(x, y, content, style, anchor, extra = "") {
  return `<text x="${fmt(x, 2)}" y="${fmt(y, 2)}" text-anchor="${anchor}" font-family="sans-serif" font-size="${style.size}" fill="${esc(style.color)}"${extra}>${esc(content)}</text>`;
}
function line(x1, y1, x2, y2, stroke, width, extra = "") {
  return `<line x1="${fmt(x1, 2)}" y1="${fmt(y1, 2)}" x2="${fmt(x2, 2)}" y2="${fmt(y2, 2)}" stroke="${esc(stroke)}" stroke-width="${width}"${extra}/>`;
}
function numbers(value, path) {
  if (value === void 0)
    return void 0;
  if (!Array.isArray(value))
    fail(`${path} must be an array of numbers`);
  return value.map((item, index) => {
    if (typeof item !== "number" || !Number.isFinite(item))
      fail(`${path}[${index}] must be a finite number`);
    return item;
  });
}
function fixedDecimals(format, path) {
  if (format === void 0)
    return void 0;
  const match = typeof format === "string" ? /^\.(\d+)f$/.exec(format) : null;
  if (match === null)
    fail(`${path} must be ".Nf" with a whole number N (got ${String(format)})`);
  const decimals = Number(match[1]);
  if (decimals > MAX_FIXED_DECIMALS)
    fail(`${path} must have at most ${MAX_FIXED_DECIMALS} decimals (got ${decimals})`);
  return decimals;
}
function scaleOf(cfg, extent, path) {
  const log = str(cfg.type, "linear") === "log";
  if (Array.isArray(cfg.range)) {
    const [a, b] = cfg.range;
    if (a === b)
      fail(`${path}.range needs two different ends`);
    return { log, lo: Math.min(a, b), hi: Math.max(a, b), reversed: a > b };
  }
  if (extent === void 0)
    return { log, lo: 0, hi: 1, reversed: false };
  if (log) {
    let a = Math.log10(extent[0]);
    let b = Math.log10(extent[1]);
    if (a === b) {
      a -= 0.5;
      b += 0.5;
    }
    const [lo2, hi2] = paddedRange(a, b);
    return { log, lo: lo2, hi: hi2, reversed: false };
  }
  let [min, max] = extent;
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const [lo, hi] = paddedRange(min, max);
  return { log, lo, hi, reversed: false };
}
function ticksOf(scale, cfg, path) {
  const decimals = fixedDecimals(cfg.tickformat, `${path}.tickformat`);
  if (scale.log) {
    const first = Math.floor(scale.lo);
    const last = Math.ceil(scale.hi);
    if ((last - first + 1) * 9 > MAX_TICKS) {
      const stride = Math.ceil((last - first) / LOG_MAJOR_TARGET);
      const ticks = [];
      for (let n = Math.ceil(first / stride) * stride; n <= last; n += stride) {
        const value = Number(`1e${n}`);
        ticks.push({ value, label: tickLabel(value, decimals ?? decimalsFor(value)), major: true });
      }
      return ticks;
    }
    return logTicks(10 ** scale.lo, 10 ** scale.hi).map((tick) => ({
      value: tick.value,
      label: tickLabel(tick.value, decimals ?? decimalsFor(tick.value)),
      major: tick.major
    }));
  }
  let values;
  const dtick = typeof cfg.dtick === "number" && cfg.dtick > 0 ? cfg.dtick : void 0;
  if (dtick !== void 0) {
    const count = Math.floor(scale.hi / dtick) - Math.ceil(scale.lo / dtick) + 1;
    if (count > MAX_TICKS)
      fail(`${path}.dtick gives ${count} ticks over the axis range; the limit is ${MAX_TICKS}`);
    values = [];
    for (let k = Math.ceil(scale.lo / dtick); k * dtick <= scale.hi; k += 1)
      values.push(k * dtick);
  } else {
    values = linearTicks(scale.lo, scale.hi);
  }
  const step = values.length > 1 ? values[1] - values[0] : 1;
  const digits = decimals ?? decimalsFor(dtick ?? step);
  return values.map((value) => ({ value, label: tickLabel(value, digits), major: true }));
}
function refOf(ref, path) {
  if (ref === "paper")
    return { kind: "paper", axis: "" };
  const domain = ref.endsWith(" domain");
  const axis = domain ? ref.slice(0, -" domain".length) : ref;
  if (!/^[xy]\d*$/.test(axis))
    fail(`${path} must be paper, an axis such as x2, or an axis domain (got ${ref})`);
  return { kind: domain ? "domain" : "data", axis };
}
function labelSvg(x, y, label, position, radius, style) {
  const horizontal = position.includes("left") ? "end" : position.includes("right") ? "start" : "middle";
  const dx = horizontal === "end" ? -(radius + 4) : horizontal === "start" ? radius + 4 : 0;
  let dy = style.size * 0.35;
  if (position.includes("top"))
    dy = -(radius + 4);
  else if (position.includes("bottom"))
    dy = radius + 4 + style.size * 0.7;
  return text(x + dx, y + dy, label, style, horizontal);
}
function markerSvg(symbol, x, y, r, color) {
  const fill = esc(color);
  const d = (points) => `<path d="${points}" data-marker="${symbol}" fill="${fill}"/>`;
  const stroked = (points) => `<path d="${points}" data-marker="${symbol}" fill="none" stroke="${fill}" stroke-width="2"/>`;
  const p = (dx, dy) => `${fmt(x + dx, 2)} ${fmt(y + dy, 2)}`;
  switch (symbol) {
    case "square":
      return `<rect data-marker="square" x="${fmt(x - r, 2)}" y="${fmt(y - r, 2)}" width="${fmt(2 * r, 2)}" height="${fmt(2 * r, 2)}" fill="${fill}"/>`;
    case "diamond":
      return d(`M${p(0, -r)} L${p(r, 0)} L${p(0, r)} L${p(-r, 0)} Z`);
    case "triangle-up":
      return d(`M${p(0, -r)} L${p(r, r)} L${p(-r, r)} Z`);
    case "cross":
      return stroked(`M${p(-r, 0)} L${p(r, 0)} M${p(0, -r)} L${p(0, r)}`);
    case "x":
      return stroked(`M${p(-r, -r)} L${p(r, r)} M${p(-r, r)} L${p(r, -r)}`);
    default:
      return `<circle cx="${fmt(x, 2)}" cy="${fmt(y, 2)}" r="${Number(r.toFixed(2))}" fill="${fill}"/>`;
  }
}
function traceSvg(trace, ctx) {
  const raw = trace.raw;
  const panel = trace.panel;
  const xScale = ctx.scales.get(panel.xId);
  const yScale = ctx.scales.get(panel.yId);
  const px = (v) => panel.x0 + frac(xScale, v) * (panel.x1 - panel.x0);
  const py = (v) => panel.y1 - frac(yScale, v) * (panel.y1 - panel.y0);
  const points = trace.xs.map((v, j) => [px(v), py(trace.ys[j])]);
  const modes = str(raw.mode, "lines").split("+");
  const lineCfg = rec(raw.line);
  const markerCfg = rec(raw.marker);
  const parts = [];
  const labelParts = [];
  if (modes.includes("lines") && points.length > 0) {
    const d = points.map((p, j) => `${j === 0 ? "M" : "L"}${fmt(p[0], 2)} ${fmt(p[1], 2)}`).join(" ");
    const dash = DASH[str(lineCfg.dash, "solid")] ?? "";
    const dashAttr = dash === "" ? "" : ` stroke-dasharray="${dash}"`;
    parts.push(`<path d="${d}" fill="none" stroke="${esc(str(lineCfg.color, defaultColor(trace.index)))}" stroke-width="${num(lineCfg.width, 2)}"${dashAttr}/>`);
  }
  if (modes.includes("markers")) {
    const radius = num(markerCfg.size, 6) / 2;
    const color = str(markerCfg.color, defaultColor(trace.index));
    const symbol = str(markerCfg.symbol, "circle");
    for (const p of points)
      parts.push(markerSvg(symbol, p[0], p[1], radius, color));
  }
  if (modes.includes("text")) {
    const labels = typeof raw.text === "string" ? points.map(() => raw.text) : Array.isArray(raw.text) ? raw.text.map(String) : [];
    const position = str(raw.textposition, "middle center");
    const radius = num(markerCfg.size, 6) / 2;
    points.forEach((p, j) => {
      const label = labels[j];
      if (label !== void 0)
        labelParts.push(labelSvg(p[0], p[1], label, position, radius, ctx.style));
    });
  }
  return `<g clip-path="url(#clip${panel.index})">${parts.join("")}</g>${labelParts.join("")}`;
}
function shapeSvg(shape, index, ctx) {
  const path = `layout.shapes[${index}]`;
  const xr = refOf(str(shape.xref, "paper"), `${path}.xref`);
  const yr = refOf(str(shape.yref, "paper"), `${path}.yref`);
  const dataRef = xr.kind !== "paper" || yr.kind !== "paper";
  const panel = dataRef ? ctx.panels.find((p) => (xr.kind === "paper" || p.xId === xr.axis) && (yr.kind === "paper" || p.yId === yr.axis)) : void 0;
  if (dataRef && panel === void 0)
    fail(`${path} names no subplot with its axes`);
  const rectX = xr.kind === "paper" ? ctx.plot : panel;
  const rectY = yr.kind === "paper" ? ctx.plot : panel;
  const mapX = (v) => {
    const f = xr.kind === "data" ? frac(ctx.scales.get(xr.axis), v) : v;
    return rectX.x0 + f * (rectX.x1 - rectX.x0);
  };
  const mapY = (v) => {
    const f = yr.kind === "data" ? frac(ctx.scales.get(yr.axis), v) : v;
    return rectY.y1 - f * (rectY.y1 - rectY.y0);
  };
  const x0 = mapX(num(shape.x0, 0));
  const x1 = mapX(num(shape.x1, 0));
  const y0 = mapY(num(shape.y0, 0));
  const y1 = mapY(num(shape.y1, 0));
  const lineCfg = rec(shape.line);
  const stroke = str(lineCfg.color, DEFAULT_AXIS_LINE);
  const width = num(lineCfg.width, 2);
  if (shape.type === "rect") {
    const fill = str(shape.fillcolor, "none");
    return `<rect x="${fmt(Math.min(x0, x1), 2)}" y="${fmt(Math.min(y0, y1), 2)}" width="${fmt(Math.abs(x1 - x0), 2)}" height="${fmt(Math.abs(y1 - y0), 2)}" fill="${esc(fill)}" stroke="${esc(stroke)}" stroke-width="${width}"/>`;
  }
  return line(x0, y0, x1, y1, stroke, width);
}
function axesSvg(panel, ctx) {
  const out = [];
  const style = ctx.style;
  const xCfg = ctx.axisCfg(panel.xId);
  const yCfg = ctx.axisCfg(panel.yId);
  const xScale = ctx.scales.get(panel.xId);
  const yScale = ctx.scales.get(panel.yId);
  const eps = 1e-9;
  for (const tick of ctx.ticks.get(panel.xId)) {
    const f = frac(xScale, tick.value);
    if (f < -eps || f > 1 + eps)
      continue;
    const x = panel.x0 + f * (panel.x1 - panel.x0);
    if (tick.major) {
      out.push(line(x, panel.y0, x, panel.y1, str(xCfg.gridcolor, "#e5e5e5"), 1));
      out.push(text(x, panel.y1 + style.size + 6, tick.label, style, "middle"));
    } else {
      out.push(line(x, panel.y1, x, panel.y1 + 4, DEFAULT_AXIS_LINE, 1, ' class="tick-minor"'));
    }
  }
  for (const tick of ctx.ticks.get(panel.yId)) {
    const f = frac(yScale, tick.value);
    if (f < -eps || f > 1 + eps)
      continue;
    const y = panel.y1 - f * (panel.y1 - panel.y0);
    if (tick.major) {
      out.push(line(panel.x0, y, panel.x1, y, str(yCfg.gridcolor, "#e5e5e5"), 1));
      out.push(text(panel.x0 - 6, y + style.size * 0.35, tick.label, style, "end"));
    } else {
      out.push(line(panel.x0 - 4, y, panel.x0, y, DEFAULT_AXIS_LINE, 1, ' class="tick-minor"'));
    }
  }
  const zeroOn = (cfg, scale) => !scale.log && cfg.zeroline !== false && scale.lo <= 0 && scale.hi >= 0;
  if (zeroOn(xCfg, xScale)) {
    const x = panel.x0 + frac(xScale, 0) * (panel.x1 - panel.x0);
    out.push(line(x, panel.y0, x, panel.y1, str(xCfg.zerolinecolor, DEFAULT_AXIS_LINE), 1));
  }
  if (zeroOn(yCfg, yScale)) {
    const y = panel.y1 - frac(yScale, 0) * (panel.y1 - panel.y0);
    out.push(line(panel.x0, y, panel.x1, y, str(yCfg.zerolinecolor, DEFAULT_AXIS_LINE), 1));
  }
  const xTitle = str(rec(xCfg.title).text, "");
  if (xTitle !== "")
    out.push(text((panel.x0 + panel.x1) / 2, panel.y1 + style.size * 2 + 26, xTitle, style, "middle"));
  const yTitle = str(rec(yCfg.title).text, "");
  if (yTitle !== "") {
    const x = panel.x0 - 50;
    const y = (panel.y0 + panel.y1) / 2;
    out.push(text(x, y, yTitle, style, "middle", ` transform="rotate(-90 ${fmt(x, 2)} ${fmt(y, 2)})"`));
  }
  return out.join("");
}
function panelsOf(grid, plot, gap) {
  const rows = num(grid.rows, 1);
  const cols = num(grid.columns, 1);
  const coupled = str(grid.pattern, "independent") === "coupled";
  const cellW = (plot.x1 - plot.x0 - gap * (cols - 1)) / cols;
  const cellH = (plot.y1 - plot.y0 - gap * (rows - 1)) / rows;
  if (cellW <= 0 || cellH <= 0)
    fail("layout.grid is too dense for layout.width and layout.height");
  const panels = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const k = r * cols + c + 1;
      const x0 = plot.x0 + c * (cellW + gap);
      const y0 = plot.y0 + r * (cellH + gap);
      panels.push({
        index: panels.length,
        xId: coupled ? axisId("x", c + 1) : axisId("x", k),
        yId: coupled ? axisId("y", r + 1) : axisId("y", k),
        x0,
        y0,
        x1: x0 + cellW,
        y1: y0 + cellH
      });
    }
  }
  return panels;
}
function rootOf(id, axisCfg, depth = 0) {
  const target = str(axisCfg(id).matches, "");
  if (target === "" || depth > 10)
    return id;
  return rootOf(target, axisCfg, depth + 1);
}
function plotToSvg(source, options) {
  const { figure, warnings } = readPlotFigure(source, options);
  const layout = figure.layout;
  const data = figure.data;
  const width = num(layout.width, 700);
  const height = num(layout.height, 450);
  const font = rec(layout.font);
  const style = { size: num(font.size, 12), color: str(font.color, "#444444") };
  const paper = str(layout.paper_bgcolor, "#ffffff");
  const plotBg = str(layout.plot_bgcolor, "#ffffff");
  const titleText = str(rec(layout.title).text, "");
  const axisCfg = (id) => rec(layout[axisKey(id)]);
  const entries = data.map((raw, index) => ({ raw, index, name: str(raw.name, `trace ${index}`), visible: raw.showlegend !== false })).filter((entry) => entry.visible);
  const legendShown = typeof layout.showlegend === "boolean" ? layout.showlegend : data.length > 1;
  const legendWidth = legendShown && entries.length > 0 ? 40 + Math.max(...entries.map((entry) => entry.name.length)) * style.size * 0.6 : 0;
  const plot = {
    x0: FRAME.left,
    y0: FRAME.top + (titleText === "" ? 0 : style.size * 1.2 + 16),
    x1: width - FRAME.right - legendWidth,
    y1: height - FRAME.bottom
  };
  if (plot.x1 <= plot.x0 || plot.y1 <= plot.y0)
    fail("layout.width and layout.height are too small for the margins, the title and the legend");
  const panels = panelsOf(rec(layout.grid), plot, FRAME.gap);
  const traces = data.map((raw, index) => {
    const xAxis = str(raw.xaxis, "x");
    const yAxis = str(raw.yaxis, "y");
    const panel = panels.find((p) => p.xId === xAxis && p.yId === yAxis);
    if (panel === void 0)
      fail(`data[${index}].xaxis and data[${index}].yaxis name axes ${xAxis} and ${yAxis} that no subplot holds`);
    const ys = numbers(raw.y, `data[${index}].y`);
    const xs = numbers(raw.x, `data[${index}].x`);
    const n = ys?.length ?? xs?.length ?? 0;
    const xv = xs ?? Array.from({ length: n }, (_unused, j) => j + 1);
    const yv = ys ?? Array.from({ length: n }, (_unused, j) => j + 1);
    if (xv.length !== yv.length)
      fail(`data[${index}].x and data[${index}].y must have the same length`);
    return { raw, index, panel, xs: xv, ys: yv };
  });
  const axisIds = [...new Set(panels.flatMap((p) => [p.xId, p.yId]))];
  for (const key of Object.keys(layout)) {
    const id = /^([xy])axis(\d*)$/.exec(key);
    if (id !== null && !axisIds.includes(`${id[1]}${id[2]}`))
      fail(`layout.${key} names an axis that no subplot holds`);
  }
  const extent = /* @__PURE__ */ new Map();
  const addValues = (id, values, path) => {
    const log = str(axisCfg(id).type, "linear") === "log";
    values.forEach((value, j) => {
      if (log && value <= 0)
        fail(`${path}[${j}] must be above zero on a log axis`);
      const current = extent.get(id);
      extent.set(id, current === void 0 ? [value, value] : [Math.min(current[0], value), Math.max(current[1], value)]);
    });
  };
  for (const trace of traces) {
    addValues(trace.panel.xId, trace.xs, `data[${trace.index}].x`);
    addValues(trace.panel.yId, trace.ys, `data[${trace.index}].y`);
  }
  const groupExtent = /* @__PURE__ */ new Map();
  for (const id of axisIds) {
    const own = extent.get(id);
    if (own === void 0)
      continue;
    const root = rootOf(id, axisCfg);
    const current = groupExtent.get(root);
    groupExtent.set(root, current === void 0 ? [own[0], own[1]] : [Math.min(current[0], own[0]), Math.max(current[1], own[1])]);
  }
  const scales = /* @__PURE__ */ new Map();
  const ticks = /* @__PURE__ */ new Map();
  for (const id of axisIds) {
    const scale = scaleOf(axisCfg(id), groupExtent.get(rootOf(id, axisCfg)), `layout.${axisKey(id)}`);
    scales.set(id, scale);
    ticks.set(id, ticksOf(scale, axisCfg(id), `layout.${axisKey(id)}`));
  }
  const ctx = { scales, ticks, plot, style, panels, axisCfg };
  const defs = panels.map((p) => `<clipPath id="clip${p.index}"><rect x="${fmt(p.x0, 2)}" y="${fmt(p.y0, 2)}" width="${fmt(p.x1 - p.x0, 2)}" height="${fmt(p.y1 - p.y0, 2)}"/></clipPath>`).join("");
  const frames = panels.map((p) => `<rect x="${fmt(p.x0, 2)}" y="${fmt(p.y0, 2)}" width="${fmt(p.x1 - p.x0, 2)}" height="${fmt(p.y1 - p.y0, 2)}" fill="${esc(plotBg)}"/>` + axesSvg(p, ctx)).join("");
  const shapes = Array.isArray(layout.shapes) ? layout.shapes.map((shape, index) => shapeSvg(shape, index, ctx)).join("") : "";
  const body = frames + shapes + traces.map((t) => traceSvg(t, ctx)).join("");
  const title = titleText === "" ? "" : text(width / 2, FRAME.top + style.size * 1.2, titleText, { ...style, size: style.size * 1.2 }, "middle");
  let legend = "";
  if (legendShown) {
    entries.forEach((entry, k) => {
      const y = plot.y0 + 16 + k * (style.size + 10);
      const x = plot.x1 + 16;
      const swatchY = y - style.size * 0.35;
      const color = str(rec(entry.raw.line).color, defaultColor(entry.index));
      const modes = str(entry.raw.mode, "lines").split("+");
      if (modes.includes("lines"))
        legend += line(x, swatchY, x + 20, swatchY, color, 2);
      if (modes.includes("markers")) {
        const symbol = str(rec(entry.raw.marker).symbol, "circle");
        legend += markerSvg(symbol, x + 10, swatchY, num(rec(entry.raw.marker).size, 6) / 2, str(rec(entry.raw.marker).color, defaultColor(entry.index)));
      }
      legend += text(x + 28, y, entry.name, style, "start");
    });
  }
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs>${defs}</defs>`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${esc(paper)}"/>`,
    body,
    title,
    legend,
    "</svg>"
  ].join("\n");
  return { svg, warnings };
}

// node_modules/@danielsimonjr/sciengjs/dist/plot/backend-svg.js
function readPlotOptions(options, allowed) {
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key))
      throw new RenderError("E_INPUT", "plot takes no option " + key);
  }
  const lenient = options.lenient;
  if (lenient !== void 0 && typeof lenient !== "boolean") {
    throw new RenderError("E_INPUT", "option lenient must be true or false");
  }
  return { lenient: lenient === true };
}
async function render(request) {
  const { lenient } = readPlotOptions(request.options, ["lenient"]);
  const result = plotToSvg(String(request.source), { lenient });
  return { bytes: new TextEncoder().encode(result.svg), warnings: result.warnings };
}

export {
  readPlotFigure,
  plotToSvg,
  readPlotOptions,
  render
};
