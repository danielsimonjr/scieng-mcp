import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  escapeXml
} from "../chunk-L76FZCQ3.mjs";
import {
  drawCadViews,
  readCadRequest
} from "../chunk-JV7ODNEK.mjs";
import {
  drawSvgToPdf
} from "../chunk-OSBRHWEZ.mjs";
import "../chunk-OCWU55SS.mjs";
import "../chunk-UDEV2G2S.mjs";
import "../chunk-2WUEJW2H.mjs";
import "../chunk-UPVXRGH6.mjs";
import "../chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/drawing.js
var SHEET = { width: 297, height: 210, margin: 10, gap: 15, title: { width: 90, height: 24 } };
var SCALES = [10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
var DRAWING_AREA = {
  width: SHEET.width - 2 * SHEET.margin,
  height: SHEET.height - 2 * SHEET.margin - SHEET.title.height
};
var DIMENSION_OFFSET = 6;
var DIMENSION_ROOM = { below: 12, right: 20 };
var STROKE = 0.35;
var TEXT_SIZE = 3.5;
function chooseScale(width, depth, height) {
  for (const scale of SCALES) {
    const fitsWidth = (width + depth) * scale + SHEET.gap + DIMENSION_ROOM.right <= DRAWING_AREA.width;
    const fitsHeight = (height + depth) * scale + SHEET.gap + DIMENSION_ROOM.below <= DRAWING_AREA.height;
    if (fitsWidth && fitsHeight)
      return { scale, fits: true };
  }
  return { scale: SCALES[SCALES.length - 1], fits: false };
}
function layoutViews(views) {
  const size = [views.max[0] - views.min[0], views.max[1] - views.min[1], views.max[2] - views.min[2]];
  const [width, depth, height] = size;
  const { scale, fits } = chooseScale(width, depth, height);
  const frontLeft = SHEET.margin + (DRAWING_AREA.width - ((width + depth) * scale + SHEET.gap + DIMENSION_ROOM.right)) / 2;
  const frontBottom = SHEET.margin + DRAWING_AREA.height - DIMENSION_ROOM.below;
  const frontTop = frontBottom - height * scale;
  const frontRight = frontLeft + width * scale;
  return {
    scale,
    fits,
    frontLeft,
    frontBottom,
    rightLeft: frontRight + SHEET.gap,
    topBottom: frontTop - SHEET.gap,
    min: [views.min[0], views.min[1], views.min[2]],
    size
  };
}
var BYTES_PER_POINT = 32;
var BYTES_PER_CONTOUR = 64;
var FIXED_BYTES = 4096;
function drawingByteLength(views) {
  let points = 0;
  let contours = 0;
  for (const group of [views.top, views.front, views.right]) {
    for (const contour of group) {
      contours++;
      points += contour.length;
    }
  }
  return points * BYTES_PER_POINT + contours * BYTES_PER_CONTOUR + FIXED_BYTES;
}
var coordinate = (value) => value.toFixed(3);
var dimensionText = (value) => String(Number(value.toFixed(2)));
function contourPath(contour, map) {
  const parts = contour.map((point, i) => {
    const [x, y] = map(point);
    return `${i === 0 ? "M" : "L"} ${coordinate(x)} ${coordinate(y)}`;
  });
  return `<path d="${parts.join(" ")} Z"/>`;
}
function viewGroup(id, contours, map) {
  const paths = contours.map((contour) => `  ${contourPath(contour, map)}`);
  return `<g id="${id}">
${paths.join("\n")}
</g>`;
}
function dimensionGroup(id, from, to, text, label) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const line = `<path d="M ${coordinate(x1)} ${coordinate(y1)} L ${coordinate(x2)} ${coordinate(y2)}"/>`;
  const number = `<text x="${coordinate(label[0])}" y="${coordinate(label[1])}" font-size="${TEXT_SIZE}" font-family="sans-serif" text-anchor="middle" fill="#000" stroke="none">${text}</text>`;
  return `<g id="${id}">
  ${line}
  ${number}
</g>`;
}
function scaleText(scale) {
  return scale >= 1 ? `scale ${scale}:1` : `scale 1:${Math.round(1 / scale)}`;
}
var TITLE_SIZE = 4.5;
var TITLE_INSET = 3;
var GLYPH_ADVANCE = 0.75;
function titleSize(title) {
  const room = SHEET.title.width - 2 * TITLE_INSET;
  const width = Array.from(title).length * GLYPH_ADVANCE * TITLE_SIZE;
  if (width <= room)
    return TITLE_SIZE;
  return TITLE_SIZE * room / width;
}
function titleBlock(title, scale) {
  const left = SHEET.width - SHEET.margin - SHEET.title.width;
  const top = SHEET.height - SHEET.margin - SHEET.title.height;
  const room = SHEET.title.width - 2 * TITLE_INSET;
  const lines = [title, scaleText(scale), "units mm", "third angle"];
  const texts = lines.map((line, i) => {
    const size = i === 0 ? titleSize(line) : TEXT_SIZE;
    const fit = i === 0 && size < TITLE_SIZE ? ` textLength="${room}" lengthAdjust="spacingAndGlyphs"` : "";
    return `  <text x="${coordinate(left + TITLE_INSET)}" y="${coordinate(top + 7 + i * 5.5)}" font-size="${Number(size.toFixed(3))}"${fit} font-family="sans-serif" fill="#000" stroke="none">${escapeXml(line)}</text>`;
  });
  const frame = `<rect x="${coordinate(left)}" y="${coordinate(top)}" width="${SHEET.title.width}" height="${SHEET.title.height}"/>`;
  return `<g id="title-block">
  ${frame}
${texts.join("\n")}
</g>`;
}
function writeCadDrawingSvg(views, options) {
  const layout = layoutViews(views);
  const { scale, frontLeft, frontBottom, rightLeft, topBottom, min, size } = layout;
  const [width, depth, height] = size;
  const frontRight = frontLeft + width * scale;
  const frontTop = frontBottom - height * scale;
  const rightRight = rightLeft + depth * scale;
  const front = (p) => [frontLeft + (p[0] - min[0]) * scale, frontBottom - (p[1] - min[2]) * scale];
  const top = (p) => [frontLeft + (p[0] - min[0]) * scale, topBottom - (p[1] - min[1]) * scale];
  const right = (p) => [rightLeft + (p[0] - min[1]) * scale, frontBottom - (p[1] - min[2]) * scale];
  const dimWidth = dimensionGroup("dim-width", [frontLeft, frontBottom + DIMENSION_OFFSET], [frontRight, frontBottom + DIMENSION_OFFSET], dimensionText(width), [(frontLeft + frontRight) / 2, frontBottom + DIMENSION_OFFSET + 4]);
  const topTop = topBottom - depth * scale;
  const dimDepth = dimensionGroup("dim-depth", [frontRight + DIMENSION_OFFSET, topBottom], [frontRight + DIMENSION_OFFSET, topTop], dimensionText(depth), [frontRight + DIMENSION_OFFSET + 3, (topBottom + topTop) / 2]);
  const dimHeight = dimensionGroup("dim-height", [rightRight + DIMENSION_OFFSET, frontBottom], [rightRight + DIMENSION_OFFSET, frontTop], dimensionText(height), [rightRight + DIMENSION_OFFSET + 3, (frontBottom + frontTop) / 2]);
  const body = [
    viewGroup("view-top", views.top, top),
    viewGroup("view-front", views.front, front),
    viewGroup("view-right", views.right, right),
    dimWidth,
    dimDepth,
    dimHeight,
    titleBlock(options.title, scale)
  ].join("\n");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET.width}mm" height="${SHEET.height}mm" viewBox="0 0 ${SHEET.width} ${SHEET.height}">`,
    `<g fill="none" stroke="#000" stroke-width="${STROKE}">`,
    body,
    "</g>",
    "</svg>",
    ""
  ].join("\n");
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-pdf.js
var TITLE_MAX = 80;
function readTitle(options, fallback) {
  for (const key of Object.keys(options)) {
    if (key !== "title")
      throw new RenderError("E_INPUT", `cad to pdf takes no option ${key}`);
  }
  const title = options.title;
  if (title === void 0)
    return fallback;
  if (typeof title !== "string" || title.length < 1 || title.length > TITLE_MAX) {
    throw new RenderError("E_INPUT", `option title must be a string of 1 to ${TITLE_MAX} characters`);
  }
  return title;
}
async function cadDrawingSvg(request) {
  const document = readCadRequest(request);
  const title = readTitle(request.options, document.model.name ?? "model");
  const views = await drawCadViews(document, request.settings.maxCadFacets);
  if (views.top.length === 0)
    throw new RenderError("E_INPUT", "the drawing holds no contour");
  const needed = drawingByteLength(views);
  const limitBytes = Math.floor(request.settings.maxMemoryMb * 1048576);
  if (needed > limitBytes) {
    throw new RenderError("E_LIMIT", "the pdf output needs " + needed + " bytes; the limit is " + limitBytes + " bytes");
  }
  const svg = writeCadDrawingSvg(views, { title });
  const warnings = [];
  if (!layoutViews(views).fits)
    warnings.push("the model does not fit the sheet at 1:100");
  if (views.colored)
    warnings.push("pdf holds no colour; the colours of the model are dropped");
  return { svg, warnings };
}
async function render(request) {
  const { svg, warnings } = await cadDrawingSvg(request);
  const draw = await drawSvgToPdf(svg, request.settings);
  return { bytes: draw.bytes, warnings: [...warnings, ...draw.warnings] };
}
export {
  cadDrawingSvg,
  render
};
