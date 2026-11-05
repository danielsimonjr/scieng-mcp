import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  dotToSvg,
  escapeDot,
  escapeRecord,
  xmlSafe
} from "./chunk-4MDRDRCG.mjs";
import {
  RenderError,
  inputError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/common.js
var HEADERS = /* @__PURE__ */ new Map([
  ["classDiagram", "class"],
  ["classDiagram-v2", "class"],
  ["stateDiagram-v2", "state"],
  ["sequenceDiagram", "sequence"]
]);
var OTHER_TYPES = /* @__PURE__ */ new Set([
  "flowchart",
  "graph",
  "stateDiagram",
  "erDiagram",
  "gantt",
  "pie",
  "journey",
  "gitGraph",
  "mindmap",
  "timeline",
  "quadrantChart",
  "requirementDiagram",
  "C4Context",
  "C4Container",
  "C4Component",
  "C4Dynamic",
  "C4Deployment",
  "sankey-beta",
  "xychart-beta",
  "block-beta",
  "packet-beta",
  "kanban",
  "architecture-beta",
  "zenuml"
]);
function readLenient(options, extra) {
  let lenient = false;
  for (const [key, value] of Object.entries(options)) {
    if (value === void 0)
      continue;
    if (key === "lenient") {
      if (typeof value !== "boolean") {
        throw new RenderError("E_INPUT", "option lenient must be true or false");
      }
      lenient = value;
    } else if (!extra.includes(key)) {
      throw new RenderError("E_INPUT", `mermaid takes no option ${key}`);
    }
  }
  return lenient;
}
function outside(ctx, line, text, why) {
  if (!ctx.lenient) {
    throw inputError(line, `${why}: "${text}"`);
  }
  ctx.warnings.push(`line ${line}: skipped the unsupported construct "${text}"`);
}
function prepare(source, options, extra = []) {
  const ctx = { lenient: readLenient(options, extra), warnings: [] };
  const content = scanContent(source, ctx);
  return headerOf(content, ctx);
}
function routesToBrowser(source) {
  const raw = source.split(/\r?\n/);
  for (let index = 0; index < raw.length; index += 1) {
    const text = (raw[index] ?? "").trim();
    if (text === "" || text.startsWith("%%"))
      continue;
    if (text === "---") {
      const close = raw.findIndex((line, at) => at > index && line.trim() === "---");
      if (close < 0)
        return false;
      index = close;
      continue;
    }
    return OTHER_TYPES.has(text.split(/\s+/)[0] ?? "");
  }
  return false;
}
function scanContent(source, ctx) {
  const raw = source.split(/\r?\n/);
  const content = [];
  for (let index = 0; index < raw.length; index += 1) {
    const number = index + 1;
    const text = (raw[index] ?? "").trim();
    if (text === "")
      continue;
    if (content.length === 0 && text === "---") {
      const close = raw.findIndex((line, at) => at > index && line.trim() === "---");
      if (close < 0) {
        throw inputError(number, "the front matter is not closed by a line of three dashes");
      }
      outside(ctx, number, text, "the front matter is outside the supported grammar");
      index = close;
      continue;
    }
    if (text.startsWith("%%{")) {
      outside(ctx, number, text, "a directive is outside the supported grammar");
      continue;
    }
    if (text.startsWith("%%"))
      continue;
    if (xmlSafe(text) !== text) {
      ctx.warnings.push(`line ${number}: each character outside the XML 1.0 range is shown as U+FFFD`);
    }
    content.push({ number, text });
  }
  return content;
}
function headerOf(content, ctx) {
  const head = content[0];
  if (head === void 0) {
    throw new RenderError("E_INPUT", "the source names no Mermaid diagram type");
  }
  const word = head.text.split(/\s+/)[0] ?? "";
  const kind = HEADERS.get(head.text);
  if (kind !== void 0) {
    return { kind, headerLine: head.number, lines: content.slice(1), lenient: ctx.lenient, warnings: ctx.warnings };
  }
  if (OTHER_TYPES.has(word)) {
    throw new RenderError("E_UNSUPPORTED", `line ${head.number}: ${word} diagrams need the browser stage; the native layouts draw classDiagram, stateDiagram-v2 and sequenceDiagram`, { line: head.number });
  }
  if (HEADERS.has(word)) {
    throw inputError(head.number, `the header ${word} takes no other text on its line`);
  }
  throw inputError(head.number, `"${head.text}" does not name a Mermaid diagram type that this release draws`);
}

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/class.js
var ARROW_SPECS = [
  ["<|--", { dashed: false, tail: "triangle", head: "none" }],
  ["*--", { dashed: false, tail: "filled-diamond", head: "none" }],
  ["o--", { dashed: false, tail: "diamond", head: "none" }],
  ["<--", { dashed: false, tail: "arrow", head: "none" }],
  ["<|..", { dashed: true, tail: "triangle", head: "none" }],
  ["<..", { dashed: true, tail: "arrow", head: "none" }],
  ["--|>", { dashed: false, tail: "none", head: "triangle" }],
  ["--*", { dashed: false, tail: "none", head: "filled-diamond" }],
  ["--o", { dashed: false, tail: "none", head: "diamond" }],
  ["-->", { dashed: false, tail: "none", head: "arrow" }],
  ["..|>", { dashed: true, tail: "none", head: "triangle" }],
  ["..>", { dashed: true, tail: "none", head: "arrow" }],
  ["--", { dashed: false, tail: "none", head: "none" }],
  ["..", { dashed: true, tail: "none", head: "none" }]
];
var ARROW_TABLE = new Map(ARROW_SPECS);
var ARROW_PATTERN = [...ARROW_SPECS].sort((left, right) => right[0].length - left[0].length).map(([token]) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
var IDENT_SOURCE = "[A-Za-z_][A-Za-z0-9_]*";
var RELATION_PATTERN = new RegExp(`^(${IDENT_SOURCE}) +(?:"([^"]*)" )?(${ARROW_PATTERN}) +(?:"([^"]*)" )?(${IDENT_SOURCE})(?: *: *(.+))?$`);
var MEMBER_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*) *:(.*)$/;
var CLASS_PATTERN = /^class ([A-Za-z_][A-Za-z0-9_]*)(?:~([A-Za-z0-9_ ,]+)~)?( *\{)?$/;
var DIRECTION_PATTERN = /^direction (TB|BT|LR|RL)$/;
function parseClassDiagram(src) {
  let direction = "TB";
  let sawDirection = false;
  const classes = [];
  const relations = [];
  const byName = /* @__PURE__ */ new Map();
  let open;
  const ensureClass = (name, line) => {
    const existing = byName.get(name);
    if (existing !== void 0) {
      return existing;
    }
    const created = { name, generic: void 0, members: [], line };
    byName.set(name, created);
    classes.push(created);
    return created;
  };
  const lines = src.lines;
  for (const line of lines) {
    const text = line.text;
    if (open !== void 0) {
      if (text === "}") {
        open = void 0;
      } else if (text.includes("{") || text.includes("}")) {
        outside(src, line.number, text, "a brace inside a class body is outside the supported grammar");
      } else {
        byName.get(open.name).members.push(text.trim());
      }
      continue;
    }
    const relation = RELATION_PATTERN.exec(text);
    if (relation !== null) {
      const from = relation[1];
      const to = relation[5];
      const token = relation[3];
      const arrow = ARROW_TABLE.get(token);
      const rawLabel = relation[6];
      relations.push({
        from,
        to,
        token,
        arrow: { dashed: arrow.dashed, tail: arrow.tail, head: arrow.head },
        fromCardinality: relation[2],
        toCardinality: relation[4],
        label: rawLabel === void 0 ? void 0 : rawLabel.trim(),
        line: line.number
      });
      ensureClass(from, line.number);
      ensureClass(to, line.number);
      continue;
    }
    const member = MEMBER_PATTERN.exec(text);
    if (member !== null) {
      const memberText = member[2].trim();
      if (memberText !== "") {
        ensureClass(member[1], line.number).members.push(memberText);
        continue;
      }
    }
    const declaration = CLASS_PATTERN.exec(text);
    if (declaration !== null) {
      const name = declaration[1];
      const generic = declaration[2];
      const existing = byName.get(name);
      if (existing === void 0) {
        const created = { name, generic, members: [], line: line.number };
        byName.set(name, created);
        classes.push(created);
      } else if (generic !== void 0) {
        existing.generic = generic;
      }
      if (declaration[3] !== void 0) {
        open = { name, line: line.number };
      }
      continue;
    }
    const directionLine = DIRECTION_PATTERN.exec(text);
    if (directionLine !== null) {
      if (sawDirection) {
        outside(src, line.number, text, "a second direction line is outside the supported grammar");
        continue;
      }
      const value = directionLine[1];
      if (value === "TB" || value === "BT" || value === "LR" || value === "RL") {
        direction = value;
        sawDirection = true;
      }
      continue;
    }
    outside(src, line.number, text, "a construct is outside the supported grammar");
  }
  if (open !== void 0) {
    if (src.lenient) {
      src.warnings.push(`line ${open.line}: the body of class ${open.name} is not closed by a line with }; its members run to the end of the source`);
    } else {
      throw inputError(open.line, `the body of class ${open.name} is not closed by a line with }`);
    }
  }
  if (classes.length === 0 && relations.length === 0) {
    throw inputError(src.headerLine, "the diagram holds no class or relation");
  }
  return { direction, classes, relations };
}
var DOT_MARKERS = {
  none: "none",
  arrow: "normal",
  triangle: "empty",
  diamond: "odiamond",
  "filled-diamond": "diamond"
};
function memberDisplay(text) {
  return escapeRecord(text.replace(/~([^~]*)~/g, "<$1>"));
}
function classToDot(model) {
  const out = [];
  out.push("digraph classDiagram {");
  out.push(`  rankdir=${model.direction};`);
  out.push("  node [shape=record];");
  for (const cls of model.classes) {
    const display = cls.generic === void 0 ? cls.name : `${cls.name}<${cls.generic}>`;
    const label = cls.members.length === 0 ? escapeRecord(display) : `${escapeRecord(display)}|${cls.members.map((member) => `${memberDisplay(member)}\\l`).join("")}`;
    out.push(`  "${escapeDot(cls.name)}" [label="{${label}}"];`);
  }
  for (const rel of model.relations) {
    const attrs = [];
    if (rel.arrow.dashed) {
      attrs.push("style=dashed");
    }
    if (rel.arrow.tail === "none" && rel.arrow.head === "none") {
      attrs.push("dir=none");
    } else {
      attrs.push("dir=both", `arrowtail=${DOT_MARKERS[rel.arrow.tail]}`, `arrowhead=${DOT_MARKERS[rel.arrow.head]}`);
    }
    if (rel.fromCardinality !== void 0) {
      attrs.push(`taillabel="${escapeDot(rel.fromCardinality)}"`);
    }
    if (rel.toCardinality !== void 0) {
      attrs.push(`headlabel="${escapeDot(rel.toCardinality)}"`);
    }
    if (rel.label !== void 0) {
      attrs.push(`label="${escapeDot(rel.label)}"`);
    }
    out.push(`  "${escapeDot(rel.from)}" -> "${escapeDot(rel.to)}" [${attrs.join(", ")}];`);
  }
  out.push("}");
  return out.join("\n") + "\n";
}

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/sequence.js
var ID_SOURCE = "[A-Za-z_][A-Za-z0-9_]*(?:-[A-Za-z0-9_]+)*";
var PARTICIPANT_RE = new RegExp(`^(?:participant|actor)[ \\t]+(${ID_SOURCE})(?:[ \\t]+as[ \\t]+(.+))?$`);
var ACTIVATION_RE = new RegExp(`^(activate|deactivate)[ \\t]+(${ID_SOURCE})$`);
var NOTE_RE = new RegExp(`^Note[ \\t]+(left of|right of|over)[ \\t]+(${ID_SOURCE})(?:[ \\t]*,[ \\t]*(${ID_SOURCE}))?[ \\t]*:[ \\t]*(.+)$`);
var BLOCK_RE = /^(loop|alt|par)(?:[ \t]+(.*))?$/;
var BRANCH_RE = /^(else|and)(?:[ \t]+(.*))?$/;
var END_RE = /^end$/;
var UNSUPPORTED_BLOCK_RE = /^(opt|critical|break|rect)(?:[ \t]+(.*))?$/;
var MESSAGE_RE = new RegExp(`^(${ID_SOURCE})[ \\t]*(-->>|->>|-->|->)[ \\t]*([+-]?)[ \\t]*(${ID_SOURCE})[ \\t]*:[ \\t]*(.*)$`);
var ANY_BLOCK_OPENER_RE = /^(?:loop|alt|par|opt|critical|break|rect)(?:[ \t]+.*)?$/;
function parseSequenceDiagram(src) {
  const participants = [];
  const byId = /* @__PURE__ */ new Map();
  const active = /* @__PURE__ */ new Map();
  const rootEvents = [];
  const blocks = [];
  let skipDepth = 0;
  const activeOf = (id) => active.get(id) ?? 0;
  const ensure = (id, createdOn) => {
    const existing = byId.get(id);
    if (existing)
      return;
    const participant = { id, label: id, line: createdOn };
    byId.set(id, participant);
    participants.push(participant);
  };
  const container = () => {
    const top = blocks[blocks.length - 1];
    if (!top)
      return rootEvents;
    const branch = top.branches[top.branches.length - 1];
    return branch ? branch.events : rootEvents;
  };
  for (const row of src.lines) {
    const line = row.number;
    const text = row.text;
    if (skipDepth > 0) {
      if (ANY_BLOCK_OPENER_RE.test(text))
        skipDepth += 1;
      else if (text === "end")
        skipDepth -= 1;
      continue;
    }
    let m = PARTICIPANT_RE.exec(text);
    if (m) {
      const id = m[1];
      const alias = m[2];
      const existing = byId.get(id);
      if (existing) {
        if (alias !== void 0)
          existing.label = alias.trim();
      } else {
        const participant = { id, label: alias !== void 0 ? alias.trim() : id, line };
        byId.set(id, participant);
        participants.push(participant);
      }
      continue;
    }
    m = ACTIVATION_RE.exec(text);
    if (m) {
      const id = m[2];
      if (m[1] === "activate") {
        ensure(id, line);
        active.set(id, activeOf(id) + 1);
        container().push({ kind: "activate", id, line });
      } else if (activeOf(id) === 0) {
        outside(src, line, text, id + " is not active");
      } else {
        active.set(id, activeOf(id) - 1);
        container().push({ kind: "deactivate", id, line });
      }
      continue;
    }
    m = NOTE_RE.exec(text);
    if (m) {
      const where = m[1];
      const second = m[3];
      if (where !== "over" && second !== void 0) {
        outside(src, line, text, "a note on the left or right names one participant");
        continue;
      }
      const ids = [m[2]];
      if (second !== void 0)
        ids.push(second);
      for (const id of ids)
        ensure(id, line);
      container().push({
        kind: "note",
        position: where === "left of" ? "left" : where === "right of" ? "right" : "over",
        ids,
        text: m[4].trim(),
        line
      });
      continue;
    }
    m = BLOCK_RE.exec(text);
    if (m) {
      const label = (m[2] ?? "").trim();
      const block = {
        kind: "block",
        type: m[1],
        line,
        branches: [{ label, line, events: [] }]
      };
      container().push(block);
      blocks.push(block);
      continue;
    }
    m = BRANCH_RE.exec(text);
    if (m) {
      const word = m[1];
      const needed = word === "else" ? "alt" : "par";
      const top = blocks[blocks.length - 1];
      if (!top || top.type !== needed) {
        outside(src, line, text, word + " has no open " + needed + " block");
        continue;
      }
      top.branches.push({ label: (m[2] ?? "").trim(), line, events: [] });
      continue;
    }
    if (END_RE.test(text)) {
      const top = blocks[blocks.length - 1];
      if (!top) {
        outside(src, line, text, "end has no open block");
        continue;
      }
      blocks.pop();
      continue;
    }
    if (UNSUPPORTED_BLOCK_RE.test(text)) {
      outside(src, line, text, "a block is outside the supported grammar");
      skipDepth = 1;
      continue;
    }
    m = MESSAGE_RE.exec(text);
    if (m) {
      const from = m[1];
      const token = m[2];
      const marker = m[3];
      const to = m[4];
      const body = m[5].trim();
      if (body === "") {
        outside(src, line, text, "a message has no text");
        continue;
      }
      if (marker === "-" && activeOf(from) === 0) {
        outside(src, line, text, from + " is not active");
        continue;
      }
      ensure(from, line);
      ensure(to, line);
      let activateTarget = false;
      let deactivateSource = false;
      if (marker === "+") {
        active.set(to, activeOf(to) + 1);
        activateTarget = true;
      } else if (marker === "-") {
        active.set(from, activeOf(from) - 1);
        deactivateSource = true;
      }
      container().push({
        kind: "message",
        from,
        to,
        token,
        dashed: token.startsWith("--"),
        arrowhead: token.endsWith(">>"),
        text: body,
        activateTarget,
        deactivateSource,
        line
      });
      continue;
    }
    outside(src, line, text, "a construct is outside the supported grammar");
  }
  let open = blocks.pop();
  while (open) {
    if (src.lenient) {
      src.warnings.push("line " + open.line + ": the " + open.type + " block is not closed by an end line; it runs to the end of the source");
    } else {
      throw inputError(open.line, "the " + open.type + " block is not closed by an end line");
    }
    open = blocks.pop();
  }
  if (participants.length === 0) {
    throw inputError(src.headerLine, "the diagram holds no participant or message");
  }
  return { participants, events: rootEvents };
}

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/sequence-layout.js
var MARGIN = 20;
var BOX_HEIGHT = 36;
var BOX_MIN_WIDTH = 100;
var BOX_PADDING = 20;
var CHAR_WIDTH = 8;
var COLUMN_MIN_GAP = 180;
var COLUMN_EDGE_GAP = 40;
var ROW_HEIGHT = 30;
var SELF_LOOP_WIDTH = 30;
var SELF_LOOP_HEIGHT = 20;
var ACTIVATION_WIDTH = 10;
var NOTE_MIN_WIDTH = 80;
var NOTE_PADDING = 16;
var NOTE_HEIGHT = 24;
var NOTE_GAP = 10;
var NOTE_OVER_SIDE = 30;
var BLOCK_HEADER = 40;
var BLOCK_BOTTOM = 10;
var BLOCK_SIDE = 30;
var FONT_SIZE = 14;
function textWidth(value) {
  return value.length * CHAR_WIDTH;
}
function escapeXml(value) {
  return xmlSafe(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function spanX(extent, first, second) {
  const low = first <= second ? first : second;
  const high = first <= second ? second : first;
  if (low < extent.minX)
    extent.minX = low;
  if (high > extent.maxX)
    extent.maxX = high;
}
function spanText(extent, x, value, anchor) {
  const width = textWidth(value);
  if (anchor === "middle")
    spanX(extent, x - width / 2, x + width / 2);
  else
    spanX(extent, x, x + width);
}
function participantWidth(label) {
  return Math.max(BOX_MIN_WIDTH, textWidth(label) + BOX_PADDING);
}
function layoutSequence(model) {
  const centers = /* @__PURE__ */ new Map();
  let prevCenter = 0;
  let prevHalf = 0;
  for (let index = 0; index < model.participants.length; index += 1) {
    const participant = model.participants[index];
    const half = participantWidth(participant.label) / 2;
    const center = index === 0 ? MARGIN + half : prevCenter + Math.max(COLUMN_MIN_GAP, prevHalf + half + COLUMN_EDGE_GAP);
    centers.set(participant.id, center);
    prevCenter = center;
    prevHalf = half;
  }
  let minCenter = 0;
  let maxCenter = 0;
  if (model.participants.length > 0) {
    minCenter = centers.get(model.participants[0].id);
    maxCenter = minCenter;
    for (const participant of model.participants) {
      const center = centers.get(participant.id);
      if (center < minCenter)
        minCenter = center;
      if (center > maxCenter)
        maxCenter = center;
    }
  }
  const extent = { minX: Infinity, maxX: -Infinity };
  let cursor = MARGIN + BOX_HEIGHT + ROW_HEIGHT;
  let rowCount = 0;
  const stacks = /* @__PURE__ */ new Map();
  const frames = [];
  const lifelines = [];
  const activations = [];
  const notes = [];
  const messages = [];
  const boxes = [];
  function centerOf(id) {
    return centers.get(id);
  }
  function pushActivation(id, start) {
    const stack = stacks.get(id);
    if (!stack) {
      stacks.set(id, [{ start, depth: 0 }]);
      return;
    }
    stack.push({ start, depth: stack.length });
  }
  function drawActivation(id, entry, end) {
    const center = centerOf(id);
    const x = center + entry.depth * ACTIVATION_WIDTH / 2 - ACTIVATION_WIDTH / 2;
    const height = Math.max(end - entry.start, ROW_HEIGHT / 2);
    activations.push(`<rect x="${x}" y="${entry.start}" width="${ACTIVATION_WIDTH}" height="${height}" fill="#eeeeee" stroke="#000000" data-scieng-kind="activation" data-scieng-id="${escapeXml(id)}"/>`);
    spanX(extent, x, x + ACTIVATION_WIDTH);
  }
  function popActivation(id, end) {
    const stack = stacks.get(id);
    if (!stack || stack.length === 0)
      return;
    drawActivation(id, stack.pop(), end);
  }
  function drawMessage(message, y, row) {
    const dash = message.dashed ? ` stroke-dasharray="4 3"` : "";
    if (message.from !== message.to) {
      const from = centerOf(message.from);
      const to = centerOf(message.to);
      messages.push(`<line x1="${from}" y1="${y}" x2="${to}" y2="${y}" stroke="#000000"${dash} data-scieng-kind="message" data-scieng-row="${row}" data-scieng-line="${message.line}"/>`);
      spanX(extent, from, to);
      if (message.arrowhead) {
        const direction = to > from ? 1 : -1;
        const tail = to - 10 * direction;
        messages.push(`<polygon points="${to},${y} ${tail},${y - 5} ${tail},${y + 5}" fill="#000000"/>`);
        spanX(extent, to, tail);
      }
      const mid = (from + to) / 2;
      messages.push(`<text x="${mid}" y="${y - 6}" text-anchor="middle" font-size="${FONT_SIZE}">${escapeXml(message.text)}</text>`);
      spanText(extent, mid, message.text, "middle");
      return;
    }
    const center = centerOf(message.from);
    messages.push(`<path d="M ${center} ${y} H ${center + SELF_LOOP_WIDTH} V ${y + SELF_LOOP_HEIGHT} H ${center}" fill="none" stroke="#000000"${dash} data-scieng-kind="message" data-scieng-row="${row}" data-scieng-line="${message.line}"/>`);
    spanX(extent, center, center + SELF_LOOP_WIDTH);
    if (message.arrowhead) {
      messages.push(`<polygon points="${center},${y + SELF_LOOP_HEIGHT} ${center + 10},${y + SELF_LOOP_HEIGHT - 5} ${center + 10},${y + SELF_LOOP_HEIGHT + 5}" fill="#000000"/>`);
      spanX(extent, center, center + 10);
    }
    const textX = center + 36;
    messages.push(`<text x="${textX}" y="${y + 4}" text-anchor="start" font-size="${FONT_SIZE}">${escapeXml(message.text)}</text>`);
    spanText(extent, textX, message.text, "start");
  }
  function drawNote(position, ids, text, line, top) {
    let x;
    let width;
    if (position === "over" && ids.length >= 2) {
      const first = centerOf(ids[0]);
      const second = centerOf(ids[1]);
      x = Math.min(first, second) - NOTE_OVER_SIDE;
      width = Math.max(NOTE_MIN_WIDTH, Math.abs(second - first) + 2 * NOTE_OVER_SIDE);
    } else {
      width = Math.max(NOTE_MIN_WIDTH, textWidth(text) + NOTE_PADDING);
      const anchor = centerOf(ids[0]);
      if (position === "left")
        x = anchor - NOTE_GAP - width;
      else if (position === "right")
        x = anchor + NOTE_GAP;
      else
        x = anchor - width / 2;
    }
    notes.push(`<rect x="${x}" y="${top}" width="${width}" height="${NOTE_HEIGHT}" fill="#ffffcc" stroke="#000000" data-scieng-kind="note" data-scieng-line="${line}"/>`);
    spanX(extent, x, x + width);
    const textX = x + width / 2;
    notes.push(`<text x="${textX}" y="${top + 16}" text-anchor="middle" font-size="${FONT_SIZE}">${escapeXml(text)}</text>`);
    spanText(extent, textX, text, "middle");
  }
  function drawBlock(block) {
    const x = minCenter - BLOCK_SIDE;
    const width = maxCenter - minCenter + 2 * BLOCK_SIDE;
    const frameTop = cursor;
    cursor += BLOCK_HEADER;
    for (let index = 0; index < block.branches.length; index += 1) {
      const branch = block.branches[index];
      if (index > 0) {
        const dividerY = cursor;
        frames.push(`<line x1="${x}" y1="${dividerY}" x2="${x + width}" y2="${dividerY}" stroke="#000000" stroke-dasharray="6 4" data-scieng-kind="divider" data-scieng-line="${branch.line}"/>`);
        spanX(extent, x, x + width);
        const head = block.type === "alt" ? "else" : "and";
        const heading2 = branch.label.length > 0 ? `${head} ${branch.label}` : head;
        frames.push(`<text x="${x + 6}" y="${dividerY + 14}" font-size="${FONT_SIZE}">${escapeXml(heading2)}</text>`);
        spanText(extent, x + 6, heading2, "start");
        cursor += BLOCK_HEADER;
      }
      walkEvents(branch.events);
    }
    const frameBottom = cursor + BLOCK_BOTTOM;
    frames.push(`<rect x="${x}" y="${frameTop}" width="${width}" height="${frameBottom - frameTop}" fill="none" stroke="#000000" data-scieng-kind="block" data-scieng-type="${block.type}" data-scieng-line="${block.line}"/>`);
    spanX(extent, x, x + width);
    const firstBranch = block.branches[0];
    const heading = firstBranch && firstBranch.label.length > 0 ? `${block.type} ${firstBranch.label}` : block.type;
    frames.push(`<text x="${x + 6}" y="${frameTop + 14}" font-size="${FONT_SIZE}">${escapeXml(heading)}</text>`);
    spanText(extent, x + 6, heading, "start");
    cursor = frameBottom + ROW_HEIGHT;
  }
  function walkEvents(events) {
    for (const event of events) {
      if (event.kind === "message") {
        const y = cursor;
        const row = rowCount;
        rowCount += 1;
        if (event.deactivateSource)
          popActivation(event.from, y);
        if (event.activateTarget)
          pushActivation(event.to, y);
        drawMessage(event, y, row);
        cursor += event.from === event.to ? ROW_HEIGHT + SELF_LOOP_HEIGHT : ROW_HEIGHT;
      } else if (event.kind === "note") {
        drawNote(event.position, event.ids, event.text, event.line, cursor);
        cursor += ROW_HEIGHT;
      } else if (event.kind === "activate") {
        pushActivation(event.id, cursor);
      } else if (event.kind === "deactivate") {
        popActivation(event.id, cursor);
      } else {
        drawBlock(event);
      }
    }
  }
  walkEvents(model.events);
  const finalCursor = cursor;
  for (const participant of model.participants) {
    const stack = stacks.get(participant.id);
    if (!stack)
      continue;
    for (const entry of stack)
      drawActivation(participant.id, entry, finalCursor);
    stack.length = 0;
  }
  for (const participant of model.participants) {
    const center = centers.get(participant.id);
    lifelines.push(`<line x1="${center}" y1="${MARGIN + BOX_HEIGHT}" x2="${center}" y2="${finalCursor}" stroke="#888888" stroke-dasharray="4 4" data-scieng-kind="lifeline" data-scieng-id="${escapeXml(participant.id)}"/>`);
    spanX(extent, center, center);
  }
  for (const participant of model.participants) {
    const center = centers.get(participant.id);
    const width = participantWidth(participant.label);
    boxes.push(`<rect x="${center - width / 2}" y="${MARGIN}" width="${width}" height="${BOX_HEIGHT}" rx="4" fill="#ffffff" stroke="#000000" data-scieng-kind="participant" data-scieng-id="${escapeXml(participant.id)}"/>`);
    spanX(extent, center - width / 2, center + width / 2);
    boxes.push(`<text x="${center}" y="${MARGIN + 22}" text-anchor="middle" font-size="${FONT_SIZE}">${escapeXml(participant.label)}</text>`);
    spanText(extent, center, participant.label, "middle");
  }
  const minX = Number.isFinite(extent.minX) ? extent.minX : 0;
  const maxX = Number.isFinite(extent.maxX) ? extent.maxX : 0;
  const root = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX - minX + 2 * MARGIN}" height="${finalCursor + MARGIN}" viewBox="${minX - MARGIN} 0 ${maxX - minX + 2 * MARGIN} ${finalCursor + MARGIN}">`;
  const lines = [root];
  lines.push(...frames);
  lines.push(...lifelines);
  lines.push(...activations);
  lines.push(...notes);
  lines.push(...messages);
  lines.push(...boxes);
  lines.push("</svg>");
  return lines.join("\n") + "\n";
}

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/state.js
var IDENT = "[A-Za-z_][A-Za-z0-9_]*";
var MARKER = `(\\[\\*\\]|${IDENT})`;
var RESERVED_WORDS = /* @__PURE__ */ new Set(["state", "note", "direction", "classDef", "class", "style"]);
var DIRECTION_LINE = /^direction[ \t]+(TB|BT|LR|RL)$/;
var COMPOSITE_OPENER = new RegExp(`^state[ \\t]+(?:${IDENT})[ \\t]?\\{$`);
var TRANSITION_LINE = new RegExp(`^${MARKER}[ \\t]+-->[ \\t]+${MARKER}(?:[ \\t]+:[ \\t]+(.+))?$`);
var QUOTED_STATE_LINE = new RegExp(`^state[ \\t]+"([^"]+)"[ \\t]+as[ \\t]+(${IDENT})$`);
var NAMED_STATE_LINE = new RegExp(`^state[ \\t]+(${IDENT})$`);
var BARE_STATE_LINE = new RegExp(`^${IDENT}$`);
function readTransition(text) {
  const match = TRANSITION_LINE.exec(text);
  if (match === null) {
    return null;
  }
  const raw = match[3];
  if (raw !== void 0 && raw.trim().length === 0) {
    return null;
  }
  return { from: match[1], to: match[2], label: raw === void 0 ? void 0 : raw.trim() };
}
function declareState(states, id, line, label) {
  const existing = states.get(id);
  if (existing === void 0) {
    states.set(id, { id, label: label ?? id, line: line.number });
    return;
  }
  if (label !== void 0) {
    existing.label = label;
  }
}
function parseStateDiagram(src) {
  const states = /* @__PURE__ */ new Map();
  const transitions = [];
  let direction = "TB";
  let sawDirection = false;
  for (let index = 0; index < src.lines.length; index += 1) {
    const line = src.lines[index];
    const text = line.text;
    const directionMatch = DIRECTION_LINE.exec(text);
    if (directionMatch !== null) {
      if (sawDirection) {
        outside(src, line.number, text, "a second direction line is outside the supported grammar");
        continue;
      }
      direction = directionMatch[1];
      sawDirection = true;
      continue;
    }
    if (COMPOSITE_OPENER.test(text)) {
      outside(src, line.number, text, "a composite state is outside the supported grammar");
      let depth = 1;
      let cursor = index + 1;
      while (cursor < src.lines.length && depth > 0) {
        const skipped = src.lines[cursor].text;
        if (skipped.includes("{")) {
          depth += 1;
        }
        if (skipped === "}") {
          depth -= 1;
        }
        cursor += 1;
      }
      index = cursor - 1;
      continue;
    }
    const transition = readTransition(text);
    if (transition !== null) {
      if (transition.from === "[*]" && transition.to === "[*]") {
        outside(src, line.number, text, "a start marker cannot also be an end marker");
        continue;
      }
      transitions.push({ from: transition.from, to: transition.to, label: transition.label, line: line.number });
      if (transition.from !== "[*]") {
        declareState(states, transition.from, line);
      }
      if (transition.to !== "[*]") {
        declareState(states, transition.to, line);
      }
      continue;
    }
    const quoted = QUOTED_STATE_LINE.exec(text);
    if (quoted !== null) {
      declareState(states, quoted[2], line, quoted[1]);
      continue;
    }
    const named = NAMED_STATE_LINE.exec(text);
    if (named !== null) {
      declareState(states, named[1], line);
      continue;
    }
    if (BARE_STATE_LINE.test(text) && !RESERVED_WORDS.has(text)) {
      declareState(states, text, line);
      continue;
    }
    outside(src, line.number, text, "a construct is outside the supported grammar");
  }
  if (states.size === 0 && transitions.length === 0) {
    throw inputError(src.headerLine, "the diagram holds no state or transition");
  }
  return { direction, states: [...states.values()], transitions };
}
function escapeDotText(text) {
  return xmlSafe(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function stateToDot(model) {
  const lines = [
    "digraph stateDiagram {",
    `  rankdir=${model.direction};`,
    "  node [shape=box, style=rounded];"
  ];
  if (model.transitions.some((transition) => transition.from === "[*]")) {
    lines.push('  "start*" [shape=circle, style=filled, fillcolor=black, width=0.25, label=""];');
  }
  if (model.transitions.some((transition) => transition.to === "[*]")) {
    lines.push('  "end*" [shape=doublecircle, style=filled, fillcolor=black, width=0.2, label=""];');
  }
  for (const state of model.states) {
    lines.push(`  "${escapeDotText(state.id)}" [label="${escapeDotText(state.label)}"];`);
  }
  for (const transition of model.transitions) {
    const from = transition.from === "[*]" ? "start*" : transition.from;
    const to = transition.to === "[*]" ? "end*" : transition.to;
    const label = transition.label === void 0 ? "" : ` [label="${escapeDotText(transition.label)}"]`;
    lines.push(`  "${escapeDotText(from)}" -> "${escapeDotText(to)}"${label};`);
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}

// node_modules/@danielsimonjr/sciengjs/dist/mermaid/render.js
async function renderMermaidSvg(source, options) {
  const src = prepare(source, options);
  if (src.kind === "class") {
    const dot = await dotToSvg(classToDot(parseClassDiagram(src)));
    return { svg: dot.svg, warnings: [...src.warnings, ...dot.warnings] };
  }
  if (src.kind === "state") {
    const dot = await dotToSvg(stateToDot(parseStateDiagram(src)));
    return { svg: dot.svg, warnings: [...src.warnings, ...dot.warnings] };
  }
  const svg = layoutSequence(parseSequenceDiagram(src));
  return { svg, warnings: [...src.warnings] };
}

export {
  readLenient,
  routesToBrowser,
  renderMermaidSvg
};
