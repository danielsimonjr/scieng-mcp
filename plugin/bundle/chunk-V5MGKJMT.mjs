import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RenderError
} from "./chunk-4ZYQGQSB.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/graph/image.js
var EXTERNAL_KEYS = ["image", "stylesheet"];
function isSpace(c) {
  return c === " " || c === "	" || c === "\r" || c === "\n" || c === "\f" || c === "\v";
}
function isWordChar(c) {
  return c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c === "." || c === "_" || c >= "\x80";
}
function tokenize(source) {
  const tokens = [];
  const len = source.length;
  let i = 0;
  while (i < len) {
    const c = source[i];
    if (isSpace(c)) {
      i++;
      continue;
    }
    if (c === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < len && source[i] !== "\n") {
        i++;
      }
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < len && !(source[i] === "*" && source[i + 1] === "/")) {
        i++;
      }
      if (i < len) {
        i += 2;
      }
      continue;
    }
    if (c === "#" && (i === 0 || source[i - 1] === "\n")) {
      while (i < len && source[i] !== "\n") {
        i++;
      }
      continue;
    }
    if (c === '"') {
      const start = i;
      i++;
      let text = "";
      while (i < len) {
        const ch = source[i];
        if (ch === "\\" && i + 1 < len) {
          text += source[i + 1];
          i += 2;
          continue;
        }
        if (ch === '"') {
          i++;
          break;
        }
        text += ch;
        i++;
      }
      tokens.push({ kind: "string", text, start, end: i });
      continue;
    }
    if (c === "<") {
      const start = i;
      i++;
      let text = "";
      let depth = 1;
      while (i < len && depth > 0) {
        const ch = source[i];
        if (ch === "<") {
          depth++;
        } else if (ch === ">") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        text += ch;
        i++;
      }
      tokens.push({ kind: "html", text, start, end: i });
      continue;
    }
    if (isWordChar(c)) {
      const start = i;
      let text = "";
      while (i < len && isWordChar(source[i])) {
        text += source[i];
        i++;
      }
      tokens.push({ kind: "ident", text, start, end: i });
      continue;
    }
    tokens.push({ kind: "char", text: c, start: i, end: i + 1 });
    i++;
  }
  return joinConcatenations(tokens);
}
function joinConcatenations(tokens) {
  const joined = [];
  for (const token of tokens) {
    const last = joined[joined.length - 1];
    const prior = joined[joined.length - 2];
    if (token.kind === "string" && last?.kind === "char" && last.text === "+" && prior?.kind === "string") {
      joined.length -= 2;
      joined.push({ kind: "string", text: prior.text + token.text, start: prior.start, end: token.end });
      continue;
    }
    joined.push(token);
  }
  return joined;
}
function skipTrivia(source, from) {
  const len = source.length;
  let j = from;
  while (j < len) {
    const c = source[j];
    if (isSpace(c)) {
      j++;
      continue;
    }
    if (c === "/" && source[j + 1] === "/") {
      j += 2;
      while (j < len && source[j] !== "\n") {
        j++;
      }
      continue;
    }
    if (c === "/" && source[j + 1] === "*") {
      j += 2;
      while (j < len && !(source[j] === "*" && source[j + 1] === "/")) {
        j++;
      }
      if (j < len) {
        j += 2;
      }
      continue;
    }
    break;
  }
  return j;
}
var LineCounter = class {
  source;
  index = 0;
  line = 1;
  constructor(source) {
    this.source = source;
  }
  /** The line of an index. The indexes of the calls must not decrease. */
  at(index) {
    for (; this.index < index; this.index++) {
      if (this.source[this.index] === "\n") {
        this.line++;
      }
    }
    return this.line;
  }
};
function stripImageAttributes(source) {
  const tokens = tokenize(source);
  const ranges = [];
  const lines = new LineCounter(source);
  for (let i = 0; i < tokens.length; i++) {
    const key = tokens[i];
    const isKey = (key.kind === "ident" || key.kind === "string") && EXTERNAL_KEYS.includes(key.text);
    if (!isKey) {
      continue;
    }
    const eq = tokens[i + 1];
    if (!eq || eq.kind !== "char" || eq.text !== "=") {
      continue;
    }
    const value = tokens[i + 2];
    if (!value || value.kind !== "ident" && value.kind !== "string" && value.kind !== "html") {
      continue;
    }
    let end = value.end;
    const sep = skipTrivia(source, value.end);
    if (sep < source.length && (source[sep] === "," || source[sep] === ";")) {
      end = sep + 1;
    }
    ranges.push({ start: key.start, end, key: key.text, line: lines.at(key.start), file: value.text });
    i += 2;
  }
  const chars = source.split("");
  for (const range of ranges) {
    for (let k = range.start; k < range.end; k++) {
      chars[k] = source[k] === "\n" ? "\n" : " ";
    }
  }
  const removed = ranges.map((range) => ({ key: range.key, line: range.line, file: range.file }));
  return { source: chars.join(""), removed };
}
function findImageClose(svg, from) {
  const len = svg.length;
  let idx = svg.indexOf("</image", from);
  while (idx !== -1) {
    const c = svg.charAt(idx + 7);
    if (c === ">") {
      return idx + 8;
    }
    if (c !== "" && isSpace(c)) {
      let m = idx + 7;
      while (m < len && isSpace(svg[m])) {
        m++;
      }
      if (m < len && svg[m] === ">") {
        return m + 1;
      }
    }
    idx = svg.indexOf("</image", idx + 7);
  }
  return -1;
}
function imageRemovalEnd(svg, start) {
  const len = svg.length;
  let j = start + 6;
  let quote = null;
  while (j < len) {
    const c = svg[j];
    if (quote !== null) {
      if (c === quote) {
        quote = null;
      }
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      break;
    }
    j++;
  }
  if (j >= len) {
    return len;
  }
  let k = j - 1;
  while (k >= 0 && isSpace(svg[k])) {
    k--;
  }
  if (k >= start && svg[k] === "/") {
    return j + 1;
  }
  const close = findImageClose(svg, j + 1);
  return close === -1 ? len : close;
}
function dropImageElements(svg) {
  const len = svg.length;
  let out = "";
  let copied = 0;
  let i = 0;
  let dropped = 0;
  while (i < len) {
    if (svg.startsWith("<image", i)) {
      const next = svg.charAt(i + 6);
      if (next === "/" || next === ">" || isSpace(next)) {
        const removeEnd = imageRemovalEnd(svg, i);
        out += svg.slice(copied, i);
        dropped++;
        copied = removeEnd;
        i = removeEnd;
        continue;
      }
    }
    i++;
  }
  out += svg.slice(copied);
  return { svg: out, dropped };
}
function dropStylesheetInstructions(svg) {
  let dropped = 0;
  const out = svg.replace(/<\?xml-stylesheet[^>]*?\?>(\r?\n)?/g, () => {
    dropped++;
    return "";
  });
  return { svg: out, dropped };
}

// node_modules/@danielsimonjr/sciengjs/dist/graph/dot.js
var vizInstancePromise;
async function createVizInstance() {
  const viz = await import("./viz-67LBFFRY.mjs");
  return viz.instance();
}
function vizInstance() {
  if (vizInstancePromise === void 0) {
    vizInstancePromise = createVizInstance();
  }
  return vizInstancePromise;
}
async function dotToSvg(source, getViz = vizInstance) {
  const stripped = stripImageAttributes(source);
  const warnings = [];
  for (const removed of stripped.removed) {
    warnings.push(removed.key === "image" ? `line ${removed.line}: image attribute "${removed.file}" removed; the graph stage reads no image file` : `line ${removed.line}: ${removed.key} attribute "${removed.file}" removed; the graph stage links no external style sheet`);
  }
  const viz = await getViz();
  const result = viz.render(stripped.source, { format: "svg" });
  if (result.status === "failure") {
    const error = result.errors.find((entry) => entry.level === "error") ?? result.errors[0];
    const message = error?.message ?? "graphviz failed and gave no error message";
    const lineMatch = /line (\d+)/.exec(message);
    throw new RenderError("E_INPUT", message, lineMatch === null ? void 0 : { line: Number(lineMatch[1]) });
  }
  for (const entry of result.errors) {
    warnings.push(entry.level === "warning" ? "graphviz warning: " + entry.message : "graphviz message: " + entry.message);
  }
  const dropped = dropImageElements(result.output);
  if (dropped.dropped > 0) {
    warnings.push("an image element that referenced a file was removed");
  }
  const sheets = dropStylesheetInstructions(dropped.svg);
  if (sheets.dropped > 0) {
    warnings.push("a style sheet instruction that referenced a file was removed");
  }
  return { svg: sheets.svg, warnings };
}
function dotSourceText(source) {
  return typeof source === "string" ? source : new TextDecoder().decode(source);
}

export {
  dotToSvg,
  dotSourceText
};
