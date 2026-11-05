import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  dotToSvg
} from "./chunk-NP4BMKGN.mjs";
import {
  escapeDot,
  escapeRecord
} from "./chunk-C4DREIKQ.mjs";
import {
  RenderError,
  inputError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/sysml/tokens.js
var SYMBOLS = [":>", "::", "..", "{", "}", ";", ":", "[", "]", ".", "=", "*"];
var NAME = /[A-Za-z_][A-Za-z0-9_]*/y;
var NUMBER = /[0-9]+(?:\.[0-9]+)?/y;
function tokenize(source) {
  const tokens = [];
  let at = 0;
  let line = 1;
  let lineStart = 0;
  while (at < source.length) {
    const ch = source[at];
    if (ch === "\n") {
      at += 1;
      line += 1;
      lineStart = at;
      continue;
    }
    if (ch === " " || ch === "	" || ch === "\r") {
      at += 1;
      continue;
    }
    if (source.startsWith("//", at)) {
      const end = source.indexOf("\n", at);
      at = end < 0 ? source.length : end;
      continue;
    }
    if (source.startsWith("/*", at)) {
      const end = source.indexOf("*/", at + 2);
      if (end < 0)
        throw inputError(line, "the comment is not closed by */");
      for (let k = at; k < end; k += 1) {
        if (source[k] === "\n") {
          line += 1;
          lineStart = k + 1;
        }
      }
      at = end + 2;
      continue;
    }
    const column = at - lineStart + 1;
    if (ch === '"') {
      let text = "";
      let k = at + 1;
      for (; ; ) {
        const c = source[k];
        if (c === void 0 || c === "\n")
          throw inputError(line, "the string is not closed by a double quote");
        if (c === '"')
          break;
        if (c === "\\" && (source[k + 1] === '"' || source[k + 1] === "\\")) {
          text += source[k + 1];
          k += 2;
          continue;
        }
        text += c;
        k += 1;
      }
      tokens.push({ kind: "string", value: text, line, column });
      at = k + 1;
      continue;
    }
    const word = match(NAME, source, at);
    if (word !== void 0) {
      tokens.push({ kind: "name", value: word, line, column });
      at += word.length;
      continue;
    }
    const number = match(NUMBER, source, at);
    if (number !== void 0) {
      tokens.push({ kind: "number", value: number, line, column });
      at += number.length;
      continue;
    }
    const symbol = SYMBOLS.find((s) => source.startsWith(s, at));
    if (symbol === void 0) {
      throw inputError(line, `the character "${String.fromCodePoint(source.codePointAt(at))}" is outside the subset`);
    }
    tokens.push({ kind: "symbol", value: symbol, line, column });
    at += symbol.length;
  }
  return tokens;
}
function match(pattern, source, at) {
  pattern.lastIndex = at;
  return pattern.exec(source)?.[0];
}

// node_modules/@danielsimonjr/sciengjs/dist/sysml/parse.js
var ALLOWED = {
  package: ["package"],
  "part def": ["package"],
  "port def": ["package"],
  "interface def": ["package"],
  "requirement def": ["package"],
  requirement: ["package", "requirement"],
  satisfy: ["package", "part def"],
  part: ["part def"],
  port: ["part def"],
  interface: ["part def"],
  connect: ["part def"],
  attribute: ["part def", "port def", "interface def", "requirement"]
};
var KEYWORDS = /* @__PURE__ */ new Set(["package", "part", "port", "interface", "requirement", "attribute", "connect", "satisfy"]);
function parseSysml(source, lenient) {
  return new Parser(tokenize(source), lenient).run();
}
var Parser = class {
  tokens;
  lenient;
  pos = 0;
  model = {
    partDefs: [],
    portDefs: [],
    interfaceDefs: [],
    requirementDefs: [],
    requirements: [],
    satisfies: [],
    warnings: []
  };
  names = /* @__PURE__ */ new Map();
  rawSatisfies = [];
  constructor(tokens, lenient) {
    this.tokens = tokens;
    this.lenient = lenient;
  }
  run() {
    this.members("package", void 0, void 0);
    const m = this.model;
    if (m.partDefs.length + m.portDefs.length + m.interfaceDefs.length + m.requirementDefs.length + m.requirements.length === 0) {
      throw inputError(1, "the source holds no definition and no requirement");
    }
    new Resolver(m, this.names).resolve(this.rawSatisfies);
    return m;
  }
  peek(offset = 0) {
    return this.tokens[this.pos + offset];
  }
  lastLine() {
    return this.tokens[this.tokens.length - 1]?.line ?? 1;
  }
  next(what) {
    const token = this.tokens[this.pos];
    if (token === void 0)
      throw inputError(this.lastLine(), `expected ${what}, found the end of the source`);
    this.pos += 1;
    return token;
  }
  symbol(value) {
    const token = this.next(`"${value}"`);
    if (token.kind !== "symbol" || token.value !== value) {
      throw inputError(token.line, `expected "${value}", found "${token.value}"`);
    }
    return token;
  }
  isSymbol(value, offset = 0) {
    const token = this.peek(offset);
    return token !== void 0 && token.kind === "symbol" && token.value === value;
  }
  name(what = "a name") {
    const token = this.next(what);
    if (token.kind !== "name")
      throw inputError(token.line, `expected ${what}, found "${token.value}"`);
    return token.value;
  }
  isWord(value, offset = 0) {
    const token = this.peek(offset);
    return token !== void 0 && token.kind === "name" && token.value === value;
  }
  /** Reads `name ("." name)*`. */
  path() {
    const parts = [this.name()];
    while (this.isSymbol(".")) {
      this.pos += 1;
      parts.push(this.name());
    }
    return parts;
  }
  /** Reads members until `}` when `open` is a line, or until the end of the source. */
  members(place, owner, open) {
    for (; ; ) {
      const token = this.peek();
      if (token === void 0) {
        if (open !== void 0)
          throw inputError(open, "the block is not closed by }");
        return;
      }
      if (open !== void 0 && token.kind === "symbol" && token.value === "}") {
        this.pos += 1;
        return;
      }
      this.statement(place, owner);
    }
  }
  /** Reads `;` or a block of members. */
  bodyOrEnd(place, owner) {
    if (this.isSymbol(";")) {
      this.pos += 1;
      return;
    }
    const open = this.symbol("{");
    this.members(place, owner, open.line);
  }
  define(name, kind, line) {
    if (this.names.has(name))
      throw inputError(line, `${name} is defined twice`);
    this.names.set(name, kind);
  }
  statement(place, owner) {
    const token = this.peek();
    if (token.kind !== "name")
      throw inputError(token.line, `unexpected "${token.value}"`);
    const line = token.line;
    if (!KEYWORDS.has(token.value)) {
      if (!this.lenient)
        throw inputError(line, `the keyword "${token.value}" is outside the subset`);
      this.skip(token);
      return;
    }
    const isDef = this.isWord("def", 1) && token.value !== "attribute" && token.value !== "connect" && token.value !== "satisfy" && token.value !== "package";
    const statement = isDef ? `${token.value} def` : token.value;
    if (!ALLOWED[statement].includes(place)) {
      throw inputError(line, `${statement} is not allowed in ${place === "package" ? "a package" : `a ${place}`}`);
    }
    this.pos += isDef ? 2 : 1;
    switch (statement) {
      case "package":
        this.name();
        this.members("package", void 0, this.symbol("{").line);
        return;
      case "part def":
        return this.partDef(line);
      case "port def":
      case "interface def":
        return this.plainDef(statement, line);
      case "requirement def":
        return this.requirementDef(line);
      case "requirement":
        return this.requirement(owner, line);
      case "satisfy":
        return this.satisfy(owner, line);
      case "attribute":
        return this.attribute(owner, line);
      case "part":
        return this.partUsage(owner, line);
      case "port":
        return this.portUsage(owner, line);
      case "interface":
        return this.interfaceUsage(owner, line);
      default:
        return this.connect(owner, line);
    }
  }
  /** Skips an unknown statement to its `;` or to its closed block, and records a warning. */
  skip(start) {
    let depth = 0;
    for (; ; ) {
      const token = this.peek();
      if (token === void 0 || depth === 0 && token.kind === "symbol" && token.value === "}") {
        throw inputError(start.line, `the statement "${start.value}" is not closed`);
      }
      this.pos += 1;
      if (token.kind !== "symbol")
        continue;
      if (token.value === "{")
        depth += 1;
      else if (token.value === "}") {
        depth -= 1;
        if (depth === 0)
          break;
      } else if (token.value === ";" && depth === 0)
        break;
    }
    this.model.warnings.push(`line ${start.line}: skipped the unsupported statement "${start.value}"`);
  }
  base() {
    if (!this.isSymbol(":>"))
      return void 0;
    this.pos += 1;
    return this.name("a base name");
  }
  partDef(line) {
    const name = this.name();
    this.define(name, "part def", line);
    const def = { name, base: this.base(), attributes: [], parts: [], ports: [], connections: [], line };
    this.model.partDefs.push(def);
    this.bodyOrEnd("part def", def);
  }
  plainDef(kind, line) {
    const name = this.name();
    this.define(name, kind, line);
    const def = { name, attributes: [], line };
    (kind === "port def" ? this.model.portDefs : this.model.interfaceDefs).push(def);
    this.bodyOrEnd(kind, def);
  }
  requirementDef(line) {
    const name = this.name();
    this.define(name, "requirement def", line);
    const def = { name, base: this.base(), attributes: [], children: [], line };
    this.model.requirementDefs.push(def);
    this.bodyOrEnd("requirement", def);
  }
  requirement(owner, line) {
    const name = this.name();
    let def;
    if (this.isSymbol(":")) {
      this.pos += 1;
      def = this.name("a requirement def name");
    }
    const ownerAddress = owner === void 0 ? void 0 : "address" in owner ? owner.address : owner.name;
    const usage = {
      name,
      address: ownerAddress === void 0 ? name : `${ownerAddress}.${name}`,
      def,
      attributes: [],
      children: [],
      line
    };
    if (owner === void 0) {
      this.define(name, "requirement", line);
      this.model.requirements.push(usage);
    } else {
      claimFeature(owner, name, line);
      owner.children.push(usage);
    }
    this.bodyOrEnd("requirement", usage);
  }
  satisfy(owner, line) {
    const requirement = this.path();
    if (!this.isWord("by")) {
      const token = this.peek();
      throw inputError(token?.line ?? line, `expected "by", found ${token === void 0 ? "the end of the source" : `"${token.value}"`}`);
    }
    this.pos += 1;
    const path = this.path();
    this.symbol(";");
    this.rawSatisfies.push({ requirement, path, owner: owner?.name, line });
  }
  attribute(owner, line) {
    const name = this.name();
    claimFeature(owner, name, line);
    let type;
    let value;
    if (this.isSymbol(":")) {
      this.pos += 1;
      type = this.name("a type name");
    }
    if (this.isSymbol("=")) {
      this.pos += 1;
      const literal = this.next("a literal");
      if (literal.kind === "symbol")
        throw inputError(literal.line, `expected a literal, found "${literal.value}"`);
      value = literal.kind === "string" ? JSON.stringify(literal.value) : literal.value;
    }
    this.symbol(";");
    owner.attributes.push({ name, type, value, line });
  }
  typed(what) {
    this.symbol(":");
    return this.name(what);
  }
  partUsage(owner, line) {
    const name = this.name();
    claimFeature(owner, name, line);
    const type = this.typed("a part def name");
    let multiplicity;
    if (this.isSymbol("[")) {
      this.pos += 1;
      multiplicity = this.number();
      if (this.isSymbol("..")) {
        this.pos += 1;
        multiplicity += `..${this.isSymbol("*") ? (this.pos += 1, "*") : this.number()}`;
      }
      this.symbol("]");
    }
    this.symbol(";");
    owner.parts.push({ name, type, multiplicity, line });
  }
  number() {
    const token = this.next("a number");
    if (token.kind !== "number")
      throw inputError(token.line, `expected a number, found "${token.value}"`);
    return token.value;
  }
  portUsage(owner, line) {
    const name = this.name();
    claimFeature(owner, name, line);
    const type = this.typed("a port def name");
    this.symbol(";");
    owner.ports.push({ name, type, line });
  }
  end() {
    const first = this.name("a connection end");
    if (!this.isSymbol("."))
      return { part: void 0, port: first };
    this.pos += 1;
    return { part: first, port: this.name("a port name") };
  }
  ends() {
    const from = this.end();
    if (!this.isWord("to")) {
      const token = this.peek();
      throw inputError(token?.line ?? this.lastLine(), `expected "to", found ${token === void 0 ? "the end of the source" : `"${token.value}"`}`);
    }
    this.pos += 1;
    const to = this.end();
    this.symbol(";");
    return { from, to };
  }
  connect(owner, line) {
    owner.connections.push({ name: void 0, def: void 0, ...this.ends(), line });
  }
  interfaceUsage(owner, line) {
    const name = this.name();
    const def = this.typed("an interface def name");
    if (!this.isWord("connect")) {
      const token = this.peek();
      throw inputError(token?.line ?? line, `expected "connect", found ${token === void 0 ? "the end of the source" : `"${token.value}"`}`);
    }
    this.pos += 1;
    owner.connections.push({ name, def, ...this.ends(), line });
  }
};
var features = /* @__PURE__ */ new WeakMap();
function claimFeature(owner, name, line) {
  let set = features.get(owner);
  if (set === void 0) {
    set = /* @__PURE__ */ new Set();
    features.set(owner, set);
  }
  if (set.has(name))
    throw inputError(line, `${name} is defined twice`);
  set.add(name);
}
var Resolver = class {
  model;
  names;
  partDefs = /* @__PURE__ */ new Map();
  requirementAddresses = /* @__PURE__ */ new Set();
  constructor(model, names) {
    this.model = model;
    this.names = names;
    for (const def of model.partDefs)
      this.partDefs.set(def.name, def);
    const walk = (list) => {
      for (const r of list) {
        this.requirementAddresses.add(r.address);
        walk(r.children);
      }
    };
    for (const def of model.requirementDefs) {
      this.requirementAddresses.add(def.name);
      walk(def.children);
    }
    walk(model.requirements);
  }
  expect(name, kind, line) {
    if (this.names.get(name) !== kind)
      throw inputError(line, `${name} names no ${kind}`);
  }
  chain(def) {
    return baseChain(this.model.partDefs, def);
  }
  partOf(def, name) {
    for (const at of this.chain(def)) {
      const found = at.parts.find((p) => p.name === name);
      if (found !== void 0)
        return found;
    }
    return void 0;
  }
  hasPort(def, name) {
    return this.chain(def).some((at) => at.ports.some((p) => p.name === name));
  }
  resolve(raw) {
    const m = this.model;
    for (const def of m.partDefs) {
      if (def.base !== void 0)
        this.expect(def.base, "part def", def.line);
    }
    for (const def of m.requirementDefs) {
      if (def.base !== void 0)
        this.expect(def.base, "requirement def", def.line);
    }
    this.noCycle(m.partDefs);
    this.noCycle(m.requirementDefs);
    for (const def of m.partDefs) {
      for (const part of def.parts)
        this.expect(part.type, "part def", part.line);
      for (const port of def.ports)
        this.expect(port.type, "port def", port.line);
    }
    for (const def of m.partDefs) {
      for (const c of def.connections) {
        if (c.def !== void 0)
          this.expect(c.def, "interface def", c.line);
        this.end(def, c.from, c.line);
        this.end(def, c.to, c.line);
      }
    }
    const usages = (list) => {
      for (const r of list) {
        if (r.def !== void 0)
          this.expect(r.def, "requirement def", r.line);
        usages(r.children);
      }
    };
    for (const def of m.requirementDefs)
      usages(def.children);
    usages(m.requirements);
    for (const s of raw)
      m.satisfies.push(this.satisfy(s));
  }
  noCycle(defs) {
    for (const def of defs) {
      const chain2 = baseChain(defs, def);
      const last = chain2[chain2.length - 1];
      if (chain2.some((d) => d.name === last.base))
        throw inputError(def.line, `the specialization of ${def.name} is a cycle`);
    }
  }
  end(def, end, line) {
    if (end.part === void 0) {
      if (!this.hasPort(def, end.port))
        throw inputError(line, `${end.port} names no port of ${def.name}`);
      return;
    }
    const part = this.partOf(def, end.part);
    if (part === void 0)
      throw inputError(line, `${end.part} names no part of ${def.name}`);
    if (!this.hasPort(this.partDefs.get(part.type), end.port)) {
      throw inputError(line, `${end.port} names no port of ${end.part}`);
    }
  }
  satisfy(raw) {
    const requirement = raw.requirement.join(".");
    if (!this.requirementAddresses.has(requirement))
      throw inputError(raw.line, `${requirement} names no requirement`);
    const [first, second, ...rest] = raw.path;
    if (rest.length > 0)
      throw inputError(raw.line, `the path ${raw.path.join(".")} has more than two names`);
    if (second === void 0) {
      const owner = raw.owner === void 0 ? void 0 : this.partDefs.get(raw.owner);
      if (owner !== void 0 && this.partOf(owner, first) !== void 0) {
        return { requirement, path: `${owner.name}.${first}`, line: raw.line };
      }
      this.expect(first, "part def", raw.line);
      return { requirement, path: first, line: raw.line };
    }
    this.expect(first, "part def", raw.line);
    if (this.partOf(this.partDefs.get(first), second) === void 0) {
      throw inputError(raw.line, `${second} names no part of ${first}`);
    }
    return { requirement, path: `${first}.${second}`, line: raw.line };
  }
};
function baseChain(defs, def) {
  const out = [];
  for (let at = def; at !== void 0 && !out.includes(at); at = defs.find((d) => d.name === at.base)) {
    out.push(at);
  }
  return out;
}

// node_modules/@danielsimonjr/sciengjs/dist/sysml/views.js
var VIEWS = ["bdd", "ibd", "requirements"];
function readSysmlOptions(options) {
  const out = { view: "bdd", root: void 0, lenient: false };
  for (const [key, value] of Object.entries(options)) {
    if (value === void 0)
      continue;
    if (key === "lenient") {
      if (typeof value !== "boolean")
        throw new RenderError("E_INPUT", "option lenient must be true or false");
      out.lenient = value;
    } else if (key === "view") {
      if (!VIEWS.includes(value))
        throw new RenderError("E_INPUT", "option view must be bdd, ibd or requirements");
      out.view = value;
    } else if (key === "root") {
      if (typeof value !== "string")
        throw new RenderError("E_INPUT", "option root must be the name of a part def");
      out.root = value;
    } else {
      throw new RenderError("E_INPUT", `sysml takes no option ${key}`);
    }
  }
  if (out.view === "ibd" && out.root === void 0)
    throw new RenderError("E_INPUT", "the ibd view needs the option root");
  if (out.view !== "ibd" && out.root !== void 0)
    throw new RenderError("E_INPUT", "the option root is only for the ibd view");
  return out;
}
function sysmlToDot(model, options) {
  const out = ["digraph sysml {"];
  if (options.view === "bdd")
    bdd(model, out);
  else if (options.view === "ibd")
    ibd(model, options.root, out);
  else
    requirements(model, out);
  out.push("}");
  return out.join("\n") + "\n";
}
var q = (text) => `"${escapeDot(text)}"`;
function attributeText(a) {
  return `${a.name}${a.type === void 0 ? "" : ` : ${a.type}`}${a.value === void 0 ? "" : ` = ${a.value}`}`;
}
function record(head, ...compartments) {
  const fields = [head, ...compartments.filter((c) => c.length > 0).map((c) => c.map((l) => `${escapeRecord(l)}\\l`).join(""))];
  return `{${fields.join("|")}}`;
}
function defHead(kind, name) {
  return `${kind}\\n${escapeRecord(name)}`;
}
function bdd(model, out) {
  out.push("  rankdir=TB;", "  node [shape=record];");
  for (const def of model.partDefs) {
    const label = record(defHead("part def", def.name), def.attributes.map(attributeText), def.ports.map((p) => `port ${p.name} : ${p.type}`));
    out.push(`  ${q(def.name)} [label="${label}"];`);
  }
  const plain = (kind, def) => {
    out.push(`  ${q(def.name)} [label="${record(defHead(kind, def.name), def.attributes.map(attributeText))}"];`);
  };
  for (const def of model.portDefs)
    plain("port def", def);
  for (const def of model.interfaceDefs)
    plain("interface def", def);
  for (const def of model.partDefs) {
    for (const part of def.parts) {
      const name = part.multiplicity === void 0 ? part.name : `${part.name} [${part.multiplicity}]`;
      out.push(`  ${q(def.name)} -> ${q(part.type)} [dir=both, arrowtail=diamond, arrowhead=none, headlabel=${q(name)}];`);
    }
    if (def.base !== void 0)
      out.push(`  ${q(def.name)} -> ${q(def.base)} [arrowhead=empty];`);
  }
}
function chain(model, def) {
  return baseChain(model.partDefs, def);
}
function ibd(model, rootName, out) {
  const root = model.partDefs.find((d) => d.name === rootName);
  if (root === void 0)
    throw new RenderError("E_INPUT", `the option root: ${rootName} names no part def`);
  const defs = chain(model, root);
  out.push("  rankdir=LR;", "  subgraph cluster_root {", `    label=${q(root.name)};`);
  for (const part of defs.flatMap((d) => d.parts)) {
    const type = model.partDefs.find((d) => d.name === part.type);
    const ports = chain(model, type).flatMap((d) => d.ports).map((p) => `<${p.name}> ${escapeRecord(p.name)}`);
    const head = escapeRecord(`${part.name} : ${part.type}${part.multiplicity === void 0 ? "" : ` [${part.multiplicity}]`}`);
    const label = ports.length === 0 ? `{${head}}` : `{${head}|{${ports.join("|")}}}`;
    out.push(`    ${q(`part:${part.name}`)} [shape=record, label="${label}"];`);
  }
  for (const port of defs.flatMap((d) => d.ports)) {
    out.push(`    ${q(`port:${port.name}`)} [shape=box, label=${q(`${port.name} : ${port.type}`)}];`);
  }
  out.push("  }");
  const end = (e) => e.part === void 0 ? q(`port:${e.port}`) : `${q(`part:${e.part}`)}:${q(e.port)}`;
  for (const c of defs.flatMap((d) => d.connections)) {
    const label = c.name === void 0 ? "" : `, label=${q(`${c.name} : ${c.def}`)}`;
    out.push(`  ${end(c.from)} -> ${end(c.to)} [dir=none${label}];`);
  }
}
function requirements(model, out) {
  out.push("  rankdir=TB;");
  const id = (address) => q(`req:${address}`);
  const node = (address, label) => {
    out.push(`  ${id(address)} [shape=record, label="${label}"];`);
  };
  const edges = [];
  const usage = (r, owner) => {
    const head = defHead("requirement", r.def === void 0 ? r.name : `${r.name} : ${r.def}`);
    node(r.address, record(head, r.attributes.map(attributeText)));
    if (owner !== void 0)
      edges.push(`  ${id(owner)} -> ${id(r.address)} [dir=both, arrowtail=odot, arrowhead=none];`);
    if (r.def !== void 0)
      edges.push(`  ${id(r.address)} -> ${id(r.def)} [style=dashed, arrowhead=normal];`);
    for (const child of r.children)
      usage(child, r.address);
  };
  const def = (d) => {
    node(d.name, record(defHead("requirement def", d.name), d.attributes.map(attributeText)));
    if (d.base !== void 0)
      edges.push(`  ${id(d.name)} -> ${id(d.base)} [arrowhead=empty];`);
    for (const child of d.children)
      usage(child, d.name);
  };
  model.requirementDefs.forEach(def);
  model.requirements.forEach((r) => usage(r, void 0));
  const seen = /* @__PURE__ */ new Set();
  for (const s of model.satisfies) {
    const element = q(`elem:${s.path}`);
    if (!seen.has(s.path)) {
      seen.add(s.path);
      const [defName, partName] = s.path.split(".");
      if (partName === void 0) {
        out.push(`  ${element} [shape=record, label="${record(defHead("part def", defName))}"];`);
      } else {
        const owner = model.partDefs.find((d) => d.name === defName);
        const part = chain(model, owner).flatMap((d) => d.parts).find((p) => p.name === partName);
        out.push(`  ${element} [shape=box, label=${q(`${part.name} : ${part.type}`)}];`);
      }
    }
    edges.push(`  ${element} -> ${id(s.requirement)} [style=dashed, arrowhead=open, label="<<satisfy>>"];`);
  }
  out.push(...edges);
}

// node_modules/@danielsimonjr/sciengjs/dist/sysml/render.js
async function renderSysmlSvg(source, options) {
  const opts = readSysmlOptions(options);
  const model = parseSysml(source, opts.lenient);
  const dot = await dotToSvg(sysmlToDot(model, opts));
  return { svg: dot.svg, warnings: [...model.warnings, ...dot.warnings] };
}

export {
  renderSysmlSvg
};
