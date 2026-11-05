import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  detectBundles,
  findBundle,
  loadBundleBytes,
  loadBundles,
  unpackBundle
} from "./chunk-VHCRZQSZ.mjs";
import {
  RenderError,
  isRenderError
} from "./chunk-WYJQ7P44.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/tex/tfm.js
function readTfm(bytes) {
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 24)
    throw new Error("bad TFM header");
  const half = (i) => d.getUint16(2 * i, false);
  const lf = half(0);
  const lh = half(1);
  const bc = half(2);
  const ec = half(3);
  const nw = half(4);
  if (lf * 4 > bytes.length || bc > ec + 1 || ec > 255)
    throw new Error("bad TFM header");
  const word = (i) => d.getUint32(4 * i, false);
  const fix = (i) => d.getInt32(4 * i, false) / 2 ** 20;
  const charBase = 6 + lh;
  const widthBase = charBase + (ec - bc + 1);
  const widths = /* @__PURE__ */ new Map();
  for (let c = bc; c <= ec; c++) {
    const widthIndex = word(charBase + c - bc) >>> 24;
    if (widthIndex === 0)
      continue;
    if (widthIndex >= nw)
      throw new Error("bad width index");
    widths.set(c, fix(widthBase + widthIndex));
  }
  return { designSize: fix(7), checksum: word(6), widths };
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/type1.js
var STANDARD = (() => {
  const e = new Array(256);
  const put = (from, names) => {
    names.split(" ").forEach((n, i) => {
      if (n !== ".")
        e[from + i] = n;
    });
  };
  put(32, "space exclam quotedbl numbersign dollar percent ampersand quoteright parenleft parenright asterisk plus comma hyphen period slash zero one two three four five six seven eight nine colon semicolon less equal greater question at A B C D E F G H I J K L M N O P Q R S T U V W X Y Z bracketleft backslash bracketright asciicircum underscore quoteleft a b c d e f g h i j k l m n o p q r s t u v w x y z braceleft bar braceright asciitilde");
  put(161, "exclamdown cent sterling fraction yen florin section currency quotesingle quotedblleft guillemotleft guilsinglleft guilsinglright fi fl . endash dagger daggerdbl periodcentered . paragraph bullet quotesinglbase quotedblbase quotedblright guillemotright ellipsis perthousand . questiondown . grave acute circumflex tilde macron breve dotaccent dieresis . ring cedilla . hungarumlaut ogonek caron emdash");
  put(225, "AE . ordfeminine . . . . Lslash Oslash OE ordmasculine . . . . . ae . . . dotlessi . . lslash oslash oe germandbls");
  return e;
})();
var latin1 = (b, from = 0, to = b.length) => {
  let s = "";
  for (let i = from; i < to; i += 8192)
    s += String.fromCharCode(...b.subarray(i, Math.min(to, i + 8192)));
  return s;
};
function decryptType1(b, r3, skip) {
  const out = new Uint8Array(Math.max(0, b.length - skip));
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    const p = c ^ r3 >> 8;
    r3 = (c + r3) * 52845 + 22719 & 65535;
    if (i >= skip)
      out[i - skip] = p;
  }
  return out;
}
function segments(pfb) {
  if (pfb[0] !== 128) {
    const text = latin1(pfb);
    const k = text.indexOf("eexec");
    if (k < 0)
      throw new Error("type1: no eexec section");
    const hex = text.slice(k + 5).replace(/[^0-9a-fA-F]/g, "");
    const bin = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < bin.length; i++)
      bin[i] = parseInt(hex.substr(2 * i, 2), 16);
    return { clear: text.slice(0, k + 5), enc: bin };
  }
  let p = 0;
  let clear = "";
  const parts = [];
  while (p < pfb.length) {
    if (pfb[p] !== 128)
      throw new Error(`type1: bad PFB segment at byte ${p}`);
    const type = pfb[p + 1];
    if (type === 3)
      break;
    const n = pfb[p + 2] | pfb[p + 3] << 8 | pfb[p + 4] << 16 | pfb[p + 5] << 24;
    if (p + 6 + n > pfb.length)
      throw new Error("type1: PFB segment beyond the file");
    const body = pfb.subarray(p + 6, p + 6 + n);
    if (type === 1)
      clear += latin1(body);
    else if (type === 2)
      parts.push(body);
    else
      throw new Error(`type1: PFB segment type ${type}`);
    p += 6 + n;
  }
  const enc = new Uint8Array(parts.reduce((a, b) => a + b.length, 0));
  let o = 0;
  for (const q of parts) {
    enc.set(q, o);
    o += q.length;
  }
  return { clear, enc };
}
function binaryEntries(priv, text, head, max) {
  const out = /* @__PURE__ */ new Map();
  head.lastIndex = 0;
  for (let m; (m = head.exec(text)) && out.size < max; ) {
    const n = Number(m[2]);
    const start = m.index + m[0].length;
    if (start + n > priv.length)
      throw new Error(`type1: entry ${m[1]} beyond the private part`);
    out.set(m[1], priv.subarray(start, start + n));
    head.lastIndex = start + n;
  }
  return out;
}
var r2 = (v) => String(Math.round(v * 100) / 100);
function readType1(pfb) {
  const { clear, enc } = segments(pfb);
  const priv = decryptType1(enc, 55665, 4);
  const text = latin1(priv);
  const fontName = /\/FontName\s*\/(\S+)/.exec(clear)?.[1];
  if (!fontName)
    throw new Error("type1: no /FontName");
  const nums = (re) => {
    const m = re.exec(clear);
    return m ? m[1].trim().split(/\s+/).map(Number) : null;
  };
  const fontBBox = nums(/\/FontBBox\s*[{[]([^}\]]*)[}\]]/) ?? [0, 0, 0, 0];
  const fontMatrix = nums(/\/FontMatrix\s*\[([^\]]*)\]/) ?? [1e-3, 0, 0, 1e-3, 0, 0];
  let encoding;
  if (/\/Encoding\s+StandardEncoding\s+def/.test(clear))
    encoding = STANDARD.slice();
  else {
    encoding = new Array(256);
    for (const m of clear.matchAll(/dup\s+(\d+)\s*\/(\S+)\s+put/g))
      encoding[Number(m[1])] = m[2];
  }
  const lenIV = Number(/\/lenIV\s+(-?\d+)/.exec(text)?.[1] ?? 4);
  const subrStart = text.search(/\/Subrs\s+\d+\s+array/);
  const csStart = text.search(/\/CharStrings\s+\d+\s+dict/);
  if (csStart < 0)
    throw new Error("type1: no /CharStrings");
  const subrs = /* @__PURE__ */ new Map();
  if (subrStart >= 0) {
    const head2 = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|) /g;
    head2.lastIndex = subrStart;
    const count = Number(/\/Subrs\s+(\d+)/.exec(text.slice(subrStart))[1]);
    for (const [k, v] of binaryEntries(priv, text, head2, count))
      subrs.set(Number(k), v);
  }
  const head = /\/([^\s/]+)\s+(\d+)\s+(?:RD|-\|) /g;
  head.lastIndex = csStart;
  const csCount = Number(/\/CharStrings\s+(\d+)/.exec(text.slice(csStart))[1]);
  const charStrings = binaryEntries(priv, text, head, csCount);
  const plain = (b) => lenIV < 0 ? b : decryptType1(b, 4330, lenIV);
  const cache = /* @__PURE__ */ new Map();
  function run(name) {
    const cs = charStrings.get(name);
    if (!cs)
      return null;
    const d = [];
    let x = 0;
    let y = 0;
    let open = false;
    let pendingMove = false;
    let advance = 0;
    let sbx = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const pt = (px, py) => {
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
      return `${r2(px)} ${r2(py)}`;
    };
    const close = () => {
      if (open) {
        d.push("Z");
        open = false;
      }
    };
    const moveTo = (nx, ny) => {
      close();
      x = nx;
      y = ny;
      pendingMove = true;
    };
    const start = () => {
      if (pendingMove || !open) {
        d.push(`M ${pt(x, y)}`);
        pendingMove = false;
        open = true;
      }
    };
    const lineTo = (nx, ny) => {
      start();
      x = nx;
      y = ny;
      d.push(`L ${pt(x, y)}`);
    };
    const curveTo = (x1, y1, x2, y2, x3, y3) => {
      start();
      d.push(`C ${pt(x1, y1)} ${pt(x2, y2)} ${pt(x3, y3)}`);
      x = x3;
      y = y3;
    };
    let flex = null;
    const ps = [];
    const exec = (code, ox, oy, depth, st) => {
      if (depth > 20)
        throw new Error(`type1 ${name}: subr nesting too deep`);
      const b = plain(code);
      for (let i = 0; i < b.length; ) {
        const v = b[i++];
        if (v >= 32) {
          if (v <= 246)
            st.push(v - 139);
          else if (v <= 250)
            st.push((v - 247) * 256 + b[i++] + 108);
          else if (v <= 254)
            st.push(-(v - 251) * 256 - b[i++] - 108);
          else {
            st.push(b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]);
            i += 4;
          }
          continue;
        }
        const rmove = (dx, dy) => {
          if (flex) {
            const last = flex[flex.length - 1] ?? [x, y];
            flex.push([last[0] + dx, last[1] + dy]);
          } else
            moveTo(x + dx, y + dy);
        };
        switch (v) {
          case 13:
            sbx = st[0];
            advance = st[1];
            x = ox + st[0];
            y = oy;
            st.length = 0;
            break;
          case 21:
            rmove(st[0], st[1]);
            st.length = 0;
            break;
          case 22:
            rmove(st[0], 0);
            st.length = 0;
            break;
          case 4:
            rmove(0, st[0]);
            st.length = 0;
            break;
          case 5:
            lineTo(x + st[0], y + st[1]);
            st.length = 0;
            break;
          case 6:
            lineTo(x + st[0], y);
            st.length = 0;
            break;
          case 7:
            lineTo(x, y + st[0]);
            st.length = 0;
            break;
          case 8: {
            const [a, b2, c, e, f, g] = st;
            curveTo(x + a, y + b2, x + a + c, y + b2 + e, x + a + c + f, y + b2 + e + g);
            st.length = 0;
            break;
          }
          case 30: {
            const [a, b2, c, e] = st;
            curveTo(x, y + a, x + b2, y + a + c, x + b2 + e, y + a + c);
            st.length = 0;
            break;
          }
          case 31: {
            const [a, b2, c, e] = st;
            curveTo(x + a, y, x + a + b2, y + c, x + a + b2, y + c + e);
            st.length = 0;
            break;
          }
          case 9:
            close();
            st.length = 0;
            break;
          case 14:
            close();
            st.length = 0;
            return "end";
          case 1:
          case 3:
            st.length = 0;
            break;
          case 10: {
            const n = st.pop();
            const s = subrs.get(n);
            if (!s)
              throw new Error(`type1 ${name}: no subr ${n}`);
            if (exec(s, ox, oy, depth + 1, st) === "end")
              return "end";
            break;
          }
          case 11:
            return "return";
          case 12: {
            const w = b[i++];
            switch (w) {
              case 0:
              case 1:
              case 2:
                st.length = 0;
                break;
              case 7:
                sbx = st[0];
                advance = st[2];
                x = ox + st[0];
                y = oy + st[1];
                st.length = 0;
                break;
              case 12: {
                const q = st.pop();
                const p2 = st.pop();
                st.push(p2 / q);
                break;
              }
              case 16: {
                const other = st.pop();
                const n = st.pop();
                const args = st.splice(st.length - n, n);
                if (other === 1)
                  flex = [];
                else if (other === 0) {
                  if (!flex || flex.length < 7)
                    throw new Error(`type1 ${name}: flex with ${flex?.length ?? 0} points`);
                  const p = flex;
                  flex = null;
                  curveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
                  curveTo(p[4][0], p[4][1], p[5][0], p[5][1], p[6][0], p[6][1]);
                  ps.push(args[2], args[1]);
                } else if (other === 2) {
                } else
                  for (let k = args.length - 1; k >= 0; k--)
                    ps.push(args[k]);
                break;
              }
              case 17:
                st.push(ps.pop());
                break;
              case 33:
                x = ox + st[0];
                y = oy + st[1];
                st.length = 0;
                break;
              case 6: {
                const [asb, adx, ady, bchar, achar] = st;
                st.length = 0;
                const bn = STANDARD[bchar];
                const an = STANDARD[achar];
                const bs = bn === void 0 ? void 0 : charStrings.get(bn);
                const as = an === void 0 ? void 0 : charStrings.get(an);
                if (!bs || !as)
                  throw new Error(`type1 ${name}: seac parts ${bn} ${an} missing`);
                const keep = { advance, sbx };
                exec(bs, ox, oy, depth + 1, []);
                close();
                exec(as, ox + adx - asb + keep.sbx, oy + ady, depth + 1, []);
                close();
                advance = keep.advance;
                sbx = keep.sbx;
                return "end";
              }
              default:
                throw new Error(`type1 ${name}: unknown command 12 ${w}`);
            }
            break;
          }
          default:
            throw new Error(`type1 ${name}: unknown command ${v}`);
        }
      }
      return "done";
    };
    exec(cs, 0, 0, 0, []);
    close();
    const empty = d.length === 0;
    return { name, advance, d: d.join(" "), bbox: empty ? [0, 0, 0, 0] : [minX, minY, maxX, maxY] };
  }
  return {
    fontName,
    fontBBox,
    fontMatrix,
    encoding,
    glyph(code) {
      const hit = cache.get(code);
      if (hit !== void 0)
        return hit;
      const name = encoding[code];
      const g = name === void 0 ? null : run(name);
      cache.set(code, g);
      return g;
    }
  };
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/dvi.js
var r = (v) => String(Math.round(v * 1e3) / 1e3);
function dviToSvg(dvi, fontFiles, opt = {}) {
  let p = 0;
  const u = (n) => {
    let v2 = 0;
    for (let i = 0; i < n; i++)
      v2 = v2 * 256 + dvi[p++];
    return v2;
  };
  const s = (n) => {
    const v2 = u(n);
    const lim = 2 ** (8 * n - 1);
    return v2 >= lim ? v2 - 2 * lim : v2;
  };
  if (dvi[0] !== 247 || dvi[1] !== 2)
    throw new Error("not a DVI file");
  p = 2;
  const num = u(4);
  const den = u(4);
  const mag = u(4);
  p += 1 + dvi[14];
  const toPt = num / den * (mag / 1e3) * (72.27 / 254e3) * (opt.unitPerPt ?? 1);
  const fonts = /* @__PURE__ */ new Map();
  const loaded = /* @__PURE__ */ new Map();
  const missing = /* @__PURE__ */ new Set();
  const out = [];
  let glyphs = 0;
  let rules = 0;
  let specials = 0;
  let page = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const box = (x0, y0, x1, y1) => {
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  };
  const want = opt.page ?? 1;
  let h = 0;
  let v = 0;
  let w = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  let f;
  const stack = [];
  const fontDef = (k) => {
    u(4);
    const sz = u(4);
    u(4);
    const a = u(1);
    const l = u(1);
    let name = "";
    for (let i = 0; i < a + l; i++)
      name += String.fromCharCode(dvi[p++]);
    if (fonts.has(k))
      return;
    let ld = loaded.get(name);
    if (ld === void 0) {
      const files = fontFiles(name);
      if (!files) {
        missing.add(name);
        ld = null;
      } else
        ld = { tfm: readTfm(files.tfm), t1: files.pfb ? readType1(files.pfb) : null };
      loaded.set(name, ld);
    }
    fonts.set(k, { name, size: sz, ld });
  };
  const drawChar = (c) => {
    const fnt = f;
    if (!fnt)
      throw new Error("char before a font");
    let adv = 0;
    if (fnt.ld) {
      const wd = fnt.ld.tfm.widths.get(c);
      if (wd === void 0)
        throw new Error(`no width for char ${c} in ${fnt.name}`);
      adv = wd * fnt.size;
    }
    if (page === want && fnt.ld) {
      const g = fnt.ld.t1?.glyph(c);
      if (!g)
        missing.add(`${fnt.name}:${c}`);
      else if (g.d) {
        const k = fnt.size * toPt / 1e3;
        const X = h * toPt;
        const Y = v * toPt;
        const ks = Number(k.toFixed(6));
        out.push(`<path transform="translate(${r(X)} ${r(Y)}) scale(${ks} ${-ks})" d="${g.d}"/>`);
        if (!opt.transformed?.())
          box(X + g.bbox[0] * k, Y - g.bbox[3] * k, X + g.bbox[2] * k, Y - g.bbox[1] * k);
        glyphs++;
      }
    }
    return adv;
  };
  const drawRule = (a, b) => {
    if (page === want && a > 0 && b > 0) {
      const X = h * toPt;
      const Y = (v - a) * toPt;
      out.push(`<rect x="${r(X)}" y="${r(Y)}" width="${r(b * toPt)}" height="${r(a * toPt)}"/>`);
      if (!opt.transformed?.())
        box(X, Y, X + b * toPt, Y + a * toPt);
      rules++;
    }
  };
  for (; ; ) {
    if (p >= dvi.length)
      throw new Error("DVI ended without post");
    const o = dvi[p++];
    if (o < 128) {
      h += drawChar(o);
      continue;
    }
    if (o >= 171 && o <= 234) {
      f = fonts.get(o - 171);
      continue;
    }
    switch (o) {
      case 128:
      case 129:
      case 130:
      case 131:
        h += drawChar(u(o - 127));
        break;
      case 133:
      case 134:
      case 135:
      case 136:
        drawChar(u(o - 132));
        break;
      case 132: {
        const a = s(4);
        const b = s(4);
        drawRule(a, b);
        h += b;
        break;
      }
      case 137: {
        const a = s(4);
        const b = s(4);
        drawRule(a, b);
        break;
      }
      case 138:
        break;
      case 139:
        p += 44;
        page++;
        h = v = w = x = y = z = 0;
        stack.length = 0;
        f = void 0;
        break;
      case 140:
        break;
      case 141:
        stack.push([h, v, w, x, y, z]);
        break;
      case 142: {
        const top = stack.pop();
        if (!top)
          throw new Error("DVI pop with an empty stack");
        [h, v, w, x, y, z] = top;
        break;
      }
      case 143:
      case 144:
      case 145:
      case 146:
        h += s(o - 142);
        break;
      case 147:
        h += w;
        break;
      case 148:
      case 149:
      case 150:
      case 151:
        w = s(o - 147);
        h += w;
        break;
      case 152:
        h += x;
        break;
      case 153:
      case 154:
      case 155:
      case 156:
        x = s(o - 152);
        h += x;
        break;
      case 157:
      case 158:
      case 159:
      case 160:
        v += s(o - 156);
        break;
      case 161:
        v += y;
        break;
      case 162:
      case 163:
      case 164:
      case 165:
        y = s(o - 161);
        v += y;
        break;
      case 166:
        v += z;
        break;
      case 167:
      case 168:
      case 169:
      case 170:
        z = s(o - 166);
        v += z;
        break;
      case 235:
      case 236:
      case 237:
      case 238:
        f = fonts.get(u(o - 234));
        break;
      case 239:
      case 240:
      case 241:
      case 242: {
        const k = u(o - 238);
        let text = "";
        for (let i = 0; i < k; i++)
          text += String.fromCharCode(dvi[p + i]);
        p += k;
        specials++;
        const res = page === want && opt.special ? opt.special(text, { x: h * toPt, y: v * toPt, unit: opt.unitPerPt ?? 1 }) : null;
        if (res?.svg)
          out.push(res.svg);
        if (res?.box)
          box(res.box[0], res.box[1], res.box[2], res.box[3]);
        break;
      }
      case 243:
      case 244:
      case 245:
      case 246:
        fontDef(u(o - 242));
        break;
      case 248: {
        const m = opt.margin ?? 1;
        if (!Number.isFinite(minX)) {
          minX = minY = 0;
          maxX = maxY = 1;
        }
        const vb = [minX - m, minY - m, maxX - minX + 2 * m, maxY - minY + 2 * m].map(r).join(" ");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${r(maxX - minX + 2 * m)}pt" height="${r(maxY - minY + 2 * m)}pt">
${out.join("\n")}
</svg>
`;
        return { svg, glyphs, rules, specials, pages: page, missing: [...missing], fonts: [...loaded.keys()] };
      }
      default:
        throw new Error(`DVI opcode ${o} at byte ${p - 1}`);
    }
  }
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/vfs.js
function treeName(raw) {
  const name = raw.replace(/^[A-Za-z]{2,}:/, "").replace(/^{(.*)}$/, "$1").replace(/"/g, "");
  if (/^[\\/]/.test(name) || /^[A-Za-z]:/.test(name) || name.split(/[\\/]/).includes("..")) {
    throw new RenderError("E_INPUT", `the file name ${JSON.stringify(raw)} escapes the virtual file tree`);
  }
  const parts = name.split(/[\\/]/);
  return parts[parts.length - 1].toLowerCase();
}
var TexTree = class _TexTree {
  input = /* @__PURE__ */ new Map();
  output = /* @__PURE__ */ new Map();
  parent;
  /** The names of the input files that a run has read. */
  read = /* @__PURE__ */ new Set();
  /** The files that a run has written, by name. */
  get written() {
    return this.output;
  }
  /** Adds an input file. A name that is already in the tree keeps its first file. */
  add(name, file) {
    const key = treeName(name);
    if (!this.input.has(key))
      this.input.set(key, file);
  }
  /** Stores a written file. It hides an input file of the same name until the tree deletes it. */
  put(name, data) {
    this.output.set(treeName(name), data);
  }
  /**
   * Makes a tree that sees every file of this tree and keeps its own writes and its own added files.
   * A run on the fork leaves this tree as it was, so a bundle tree serves many runs.
   */
  fork() {
    const child = new _TexTree();
    child.parent = this;
    return child;
  }
  /** Whether a file of this name is in the tree. */
  has(name) {
    const key = treeName(name);
    return this.output.has(key) || this.input.has(key) || (this.parent?.has(key) ?? false);
  }
  /** Reads a file. The result is `undefined` for a name that is not in the tree. */
  get(name) {
    const key = treeName(name);
    const written = this.output.get(key);
    if (written !== void 0)
      return written;
    const file = this.input.get(key);
    if (file === void 0) {
      const inherited = this.parent?.get(key);
      if (inherited !== void 0)
        this.read.add(key);
      return inherited;
    }
    this.read.add(key);
    if (typeof file === "function") {
      const data = file();
      this.input.set(key, data);
      return data;
    }
    return file;
  }
  /** Deletes a written file. An input file stays. */
  delete(name) {
    this.output.delete(treeName(name));
  }
};

// node_modules/@danielsimonjr/sciengjs/dist/tex/host.js
var FILE_SLOT = 8;
var NL = 10;
var TICK_EVERY = 256;
var DEFAULT_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
var ExitSignal = class extends Error {
  code;
  constructor(code) {
    super(`program exit ${code}`);
    this.code = code;
  }
};
var TexHost = class {
  files;
  std;
  extra;
  ttyNames;
  echoInput;
  nameKey;
  termIn;
  termOut = [];
  handles = [null];
  mem;
  dv;
  ticks = 0;
  outputBytes = 0;
  maxOutputBytes;
  refusedNames = [];
  deadline;
  timeoutMs;
  constructor(o) {
    this.files = o.files;
    this.std = o.std;
    this.extra = o.extra ?? {};
    this.ttyNames = new Set(o.ttyNames ?? ["TTY:"]);
    this.echoInput = o.echo ?? true;
    this.nameKey = o.nameKey ?? treeName;
    this.deadline = o.deadline;
    this.timeoutMs = o.timeoutMs;
    this.maxOutputBytes = o.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    const term = "\n" + (o.terminal ?? []).map((l) => l + "\n").join("");
    this.termIn = { data: latin1Bytes(term), pos: 0, text: true, es: 1, reading: true, tty: true, out: [], err: 0 };
  }
  /** Connects the host to the instance, whose memory the host functions read and write. */
  attach(instance) {
    const memory = instance.exports.memory;
    this.mem = new Uint8Array(memory.buffer);
    this.dv = new DataView(memory.buffer);
  }
  /** The text that the program wrote to the terminal. */
  terminalText() {
    if (this.termOut.length && this.termOut[this.termOut.length - 1] !== NL)
      this.termOut.push(NL);
    return latin1String(this.termOut);
  }
  /** The file names that the program tried to open and that escape the tree. Each open failed. */
  get refused() {
    return this.refusedNames.slice();
  }
  /** Stores every file that is still open for writing. */
  finish() {
    for (const h of this.handles)
      if (h && !h.reading && !h.tty && !h.closed)
        this.flush(h);
  }
  flush(h) {
    if (h.text && h.out.length && h.out[h.out.length - 1] !== NL)
      h.out.push(NL);
    if (h.name !== void 0)
      this.files.put(h.name, Uint8Array.from(h.out));
  }
  // Counts n bytes that the program writes. A run over the bound ends with E_LIMIT.
  charge(n) {
    this.outputBytes += n;
    if (this.outputBytes > this.maxOutputBytes) {
      throw new RenderError("E_LIMIT", `the TeX run wrote more than ${this.maxOutputBytes} bytes`);
    }
  }
  tick() {
    if (this.deadline === void 0 || ++this.ticks % TICK_EVERY !== 0)
      return;
    if (performance.now() > this.deadline) {
      throw new RenderError("E_TIMEOUT", `the TeX run did not finish within ${this.timeoutMs} ms`);
    }
  }
  handleOf(slot) {
    this.tick();
    let i = this.dv.getInt32(slot, true);
    if (i === 0) {
      if (slot === this.std.output)
        i = this.newHandle(slot, { tty: true, reading: false, text: true, es: 1, out: this.termOut, data: new Uint8Array(0), pos: 0, err: 0 });
      else if (slot === this.std.input)
        i = this.newHandle(slot, this.termIn);
      else
        throw new Error(`file at ${slot} is not open`);
    }
    return this.handles[i];
  }
  newHandle(slot, h) {
    this.handles.push(h);
    const i = this.handles.length - 1;
    this.dv.setInt32(slot, i, true);
    if (h.reading)
      this.fill(slot, h);
    return i;
  }
  name(addr, len) {
    let s = "";
    for (let k = 0; k < len; k++)
      s += String.fromCharCode(this.mem[addr + k]);
    return s.replace(/ +$/, "");
  }
  // put the current element into f^
  fill(slot, h) {
    const b = slot + FILE_SLOT;
    if (h.text) {
      const c = h.pos < h.data.length ? h.data[h.pos] : NL;
      this.mem[b] = c === NL ? 32 : c;
      return;
    }
    const at = h.pos * h.es;
    for (let k = 0; k < h.es; k++)
      this.mem[b + k] = at + k < h.data.length ? h.data[at + k] : 0;
  }
  // A terminal shows the line that the user types. The echo happens when the
  // program moves past the end of the previous line.
  echo(h) {
    if (!this.echoInput || !h.tty || h.data[h.pos] !== NL || h.pos + 1 >= h.data.length)
      return;
    let e = h.pos + 1;
    while (e < h.data.length && h.data[e] !== NL)
      e++;
    this.charge(e - h.pos);
    for (let k = h.pos + 1; k <= e; k++)
      this.termOut.push(h.data[k]);
  }
  eofOf(h) {
    return h.text ? h.pos >= h.data.length : h.pos * h.es >= h.data.length;
  }
  /** The import object for `WebAssembly.instantiate`. */
  imports() {
    const env = {
      f_open: (slot, mode, nameAddr, nameLen, es) => {
        const raw = this.name(nameAddr, nameLen);
        const text = (mode & 2) !== 0;
        mode &= 1;
        if (this.ttyNames.has(raw)) {
          if (mode === 0)
            this.newHandle(slot, this.termIn);
          else
            this.newHandle(slot, { tty: true, reading: false, text: true, es: 1, out: this.termOut, data: new Uint8Array(0), pos: 0, err: 0 });
          return;
        }
        let key;
        try {
          key = this.nameKey(raw);
        } catch (e) {
          if (!isRenderError(e))
            throw e;
          this.refusedNames.push(raw);
        }
        if (mode === 0) {
          let data = key === void 0 ? void 0 : this.files.get(key);
          const ok = data !== void 0;
          if (data === void 0)
            data = new Uint8Array(0);
          if (text && data.length && data[data.length - 1] !== NL)
            data = Uint8Array.from([...data, NL]);
          this.newHandle(slot, { data, pos: 0, es, text, reading: true, out: [], err: ok ? 0 : 1 });
        } else {
          this.newHandle(slot, { name: key, data: new Uint8Array(0), pos: 0, out: [], es, text, reading: false, err: key === void 0 ? 1 : 0 });
        }
      },
      f_close: (slot) => {
        const h = this.handles[this.dv.getInt32(slot, true)];
        if (!h)
          return;
        if (!h.reading && !h.tty && h.err === 0)
          this.flush(h);
        h.closed = true;
        this.dv.setInt32(slot, 0, true);
      },
      f_erstat: (slot) => this.handleOf(slot).err,
      f_get: (slot) => {
        const h = this.handleOf(slot);
        this.echo(h);
        h.pos++;
        this.fill(slot, h);
      },
      f_put: (slot) => {
        const h = this.handleOf(slot);
        const b = slot + FILE_SLOT;
        this.charge(h.es);
        for (let k = 0; k < h.es; k++)
          h.out.push(this.mem[b + k]);
      },
      f_eof: (slot) => this.eofOf(this.handleOf(slot)) ? 1 : 0,
      f_eoln: (slot) => {
        const h = this.handleOf(slot);
        return h.pos >= h.data.length || h.data[h.pos] === NL ? 1 : 0;
      },
      f_wstr: (slot, addr, len, width) => {
        const h = this.handleOf(slot);
        this.charge(Math.max(len, width));
        for (let k = len; k < width; k++)
          h.out.push(32);
        for (let k = 0; k < len; k++)
          h.out.push(this.mem[addr + k]);
      },
      f_wint: (slot, v, width) => {
        const h = this.handleOf(slot);
        const s = String(v).padStart(width, " ");
        this.charge(s.length);
        for (let k = 0; k < s.length; k++)
          h.out.push(s.charCodeAt(k));
      },
      f_wchar: (slot, c, width) => {
        const h = this.handleOf(slot);
        this.charge(Math.max(1, width));
        for (let k = 1; k < width; k++)
          h.out.push(32);
        h.out.push(c & 255);
      },
      f_wreal: (slot, v, width, digits) => {
        const h = this.handleOf(slot);
        let s;
        if (digits >= 0)
          s = v.toFixed(digits);
        else {
          const e = v.toExponential(Math.max(1, width - 7)).replace(/e([+-])(\d)$/, "e$10$2");
          s = (v < 0 ? "" : " ") + e.toUpperCase();
        }
        s = s.padStart(width, " ");
        this.charge(s.length);
        for (let k = 0; k < s.length; k++)
          h.out.push(s.charCodeAt(k));
      },
      f_wln: (slot) => {
        const h = this.handleOf(slot);
        this.charge(1);
        h.out.push(NL);
      },
      f_break: () => {
      },
      f_rint: (slot) => {
        const h = this.handleOf(slot);
        const d = h.data;
        while (h.pos < d.length && (d[h.pos] === 32 || d[h.pos] === NL))
          h.pos++;
        let s = "";
        if (d[h.pos] === 43 || d[h.pos] === 45)
          s += String.fromCharCode(d[h.pos++]);
        while (h.pos < d.length && d[h.pos] >= 48 && d[h.pos] <= 57)
          s += String.fromCharCode(d[h.pos++]);
        this.fill(slot, h);
        return Number(s) | 0;
      },
      f_rln: (slot) => {
        const h = this.handleOf(slot);
        while (h.pos < h.data.length && h.data[h.pos] !== NL)
          h.pos++;
        this.echo(h);
        h.pos++;
        this.fill(slot, h);
      },
      f_setpos: (slot, n) => {
        const h = this.handleOf(slot);
        const items = Math.floor(h.data.length / h.es);
        h.pos = n < 0 || n > items ? items : n;
        this.fill(slot, h);
      },
      f_curpos: (slot) => this.handleOf(slot).pos,
      range_err: (line, v) => {
        throw new Error(`index ${v} outside the bounds at Pascal line ${line}`);
      },
      ...this.extra
    };
    return { env };
  }
};
function latin1Bytes(s) {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++)
    b[i] = s.charCodeAt(i) & 255;
  return b;
}
function latin1String(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.slice(i, i + 8192));
  return s;
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/wasm.js
function instantiate(module, imports) {
  const api = globalThis.WebAssembly;
  return api.instantiate(module, imports);
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/run.js
async function runProgram(o) {
  const std = { input: o.symbols.symbols.input?.addr, output: o.symbols.symbols.output?.addr };
  if (std.input === void 0 || std.output === void 0) {
    throw new RenderError("E_INTERNAL", "the engine symbol table has no input or output file");
  }
  const t0 = performance.now();
  const host = new TexHost({
    files: o.files,
    terminal: o.terminal,
    std: { input: std.input, output: std.output },
    echo: o.echo,
    ...o.ttyNames === void 0 ? {} : { ttyNames: o.ttyNames },
    ...o.nameKey === void 0 ? {} : { nameKey: o.nameKey },
    ...o.maxOutputBytes === void 0 ? {} : { maxOutputBytes: o.maxOutputBytes },
    extra: {
      hostexit: (code) => {
        throw new ExitSignal(code);
      }
    },
    ...o.timeoutMs === void 0 ? {} : { deadline: t0 + o.timeoutMs, timeoutMs: o.timeoutMs }
  });
  const instance = await instantiate(o.module, host.imports());
  host.attach(instance);
  const t1 = performance.now();
  let exit = 0;
  try {
    instance.exports.main();
  } catch (e) {
    if (e instanceof ExitSignal)
      exit = e.code;
    else if (isRenderError(e))
      throw e;
    else if (e instanceof RangeError)
      throw new RenderError("E_LIMIT", `the TeX engine ran out of stack: ${e.message}`);
    else
      throw new RenderError("E_INTERNAL", `the TeX engine failed: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    host.finish();
  }
  const t2 = performance.now();
  return { terminal: host.terminalText(), exit, refused: host.refused, instantiateMs: t1 - t0, runMs: t2 - t1 };
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/specials.js
var SPECIAL_UNIT_PER_PT = 72 / 72.27;
var round4 = (v) => Math.round(v * 1e4) / 1e4;
var fmt = (v) => String(round4(v));
function fill(text, at) {
  return text.replace(/\{\?x\}/g, fmt(at.x)).replace(/\{\?y\}/g, fmt(at.y)).replace(/\{\?nl\}/g, "\n");
}
function firstWord(text) {
  return text.trim().split(/\s+/)[0];
}
function createSpecials() {
  const sets = /* @__PURE__ */ new Map();
  let active = null;
  const ignoredList = [];
  const groups = [];
  function track(r3) {
    if (r3?.svg === void 0)
      return r3;
    for (const m of r3.svg.matchAll(/<g(\s[^>]*)?>|<\/g>/g)) {
      if (m[0] === "</g>")
        groups.pop();
      else
        groups.push(/transform\s*=/.test(m[1] ?? ""));
    }
    return r3;
  }
  function remember(word) {
    if (word && !ignoredList.includes(word))
      ignoredList.push(word);
  }
  function bbox(arg, at) {
    const t = arg.trim();
    const toks = t.length === 0 ? [] : t.split(/\s+/);
    const head = toks[0];
    if (head === "lock" || head === "unlock" || head === "fix" || head === "new")
      return null;
    if (toks.length < 2)
      return null;
    const w = Number(toks[0]);
    const h = Number(toks[1]);
    const d = toks.length > 2 ? Number(toks[2]) : 0;
    if (![w, h, d].every(Number.isFinite))
      return null;
    return { box: [round4(at.x), round4(at.y - h * at.unit), round4(at.x + w * at.unit), round4(at.y + d * at.unit)] };
  }
  function dvisvgm(rest, first, at) {
    const m = rest.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);
    if (m === null) {
      remember(first);
      return null;
    }
    const cmd = m[1];
    const arg = m[2] === void 0 ? "" : m[2];
    if (cmd === "raw") {
      if (active !== null) {
        sets.set(active, sets.get(active) + arg);
        return null;
      }
      return { svg: fill(arg, at) };
    }
    if (cmd === "rawdef")
      return { svg: "<defs>" + fill(arg, at) + "</defs>" };
    if (cmd === "rawset") {
      const name = firstWord(arg);
      if (name !== "" && active === null) {
        active = name;
        sets.set(name, "");
      }
      return null;
    }
    if (cmd === "endrawset") {
      active = null;
      return null;
    }
    if (cmd === "rawput") {
      const name = firstWord(arg);
      const stored = name === "" ? void 0 : sets.get(name);
      if (stored === void 0 || name === active)
        return null;
      return { svg: fill(stored, at) };
    }
    if (cmd === "bbox")
      return bbox(arg, at);
    remember(first);
    return null;
  }
  function color(words) {
    if (words[1] === "pop")
      return { svg: "</g>" };
    if (words[1] !== "push") {
      remember(words[0]);
      return null;
    }
    const chan = (v) => Math.round(v * 255);
    const model = words[2];
    let rgb = null;
    if (model === "rgb" && words.length >= 6) {
      const v = words.slice(3, 6).map(Number);
      if (v.every(Number.isFinite))
        rgb = v.map(chan);
    } else if (model === "gray" && words.length >= 4) {
      const v = Number(words[3]);
      if (Number.isFinite(v))
        rgb = [chan(v), chan(v), chan(v)];
    } else if (model === "cmyk" && words.length >= 7) {
      const v = words.slice(3, 7).map(Number);
      if (v.every(Number.isFinite)) {
        const [c, m, y, k] = v;
        rgb = [chan((1 - c) * (1 - k)), chan((1 - m) * (1 - k)), chan((1 - y) * (1 - k))];
      }
    }
    if (rgb === null) {
      remember(words[0]);
      return null;
    }
    return { svg: '<g fill="rgb(' + rgb.join(",") + ')">' };
  }
  return {
    special(text, at) {
      const lead = text.match(/^\s*dvisvgm:/);
      if (lead !== null)
        return track(dvisvgm(text.slice(lead[0].length), text.trim().split(/\s+/)[0], at));
      const words = text.trim().split(/\s+/);
      if (words[0] === "color")
        return track(color(words));
      remember(words[0]);
      return null;
    },
    ignored: () => ignoredList.slice(),
    transformed: () => groups.some((g) => g)
  };
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/render.js
var decode = (b) => {
  let s = "";
  if (b === void 0)
    return s;
  for (let i = 0; i < b.length; i += 8192)
    s += String.fromCharCode(...b.subarray(i, Math.min(b.length, i + 8192)));
  return s;
};
function firstTexError(log, terminal) {
  const text = log || terminal;
  const lines = text.split("\n");
  const at = lines.findIndex((l) => l.startsWith("!"));
  if (at < 0)
    return { message: "TeX produced no output", line: void 0 };
  const message = lines[at].slice(1).trim();
  const lineRow = lines.slice(at).find((l) => /^l\.\d+/.test(l));
  return { message, line: lineRow === void 0 ? void 0 : Number(/^l\.(\d+)/.exec(lineRow)[1]) };
}
async function renderTex(o) {
  const job = (o.jobName ?? "job").toLowerCase();
  const run = o.tree.fork();
  run.add("tex.pool", o.engine.pool);
  run.add(o.format.name, o.format.bytes);
  run.add(`${job}.tex`, typeof o.source === "string" ? utf8Bytes(o.source) : o.source);
  const t0 = performance.now();
  const r3 = await runProgram({
    module: o.engine.module,
    symbols: o.engine.symbols,
    files: run,
    terminal: [`&${o.format.name.replace(/\.fmt$/i, "")} ${job}`],
    ...o.timeoutMs === void 0 ? {} : { timeoutMs: o.timeoutMs },
    ...o.maxOutputBytes === void 0 ? {} : { maxOutputBytes: o.maxOutputBytes }
  });
  const texMs = performance.now() - t0;
  const dvi = run.written.get(`${job}.dvi`);
  const log = decode(run.written.get(`${job}.log`));
  if (dvi === void 0) {
    const err = firstTexError(log, r3.terminal);
    throw new RenderError("E_INPUT", `TeX stopped with no output: ${err.message}`, err.line === void 0 ? {} : { line: err.line });
  }
  const t1 = performance.now();
  const specials = createSpecials();
  let converted;
  try {
    converted = dviToSvg(dvi, (name) => {
      const tfm = run.get(`${name}.tfm`);
      return tfm ? { tfm, pfb: run.get(`${name}.pfb`) ?? null } : null;
    }, { special: specials.special, transformed: o.skipTransformedBoxes === false ? () => false : specials.transformed, unitPerPt: SPECIAL_UNIT_PER_PT, ...o.margin === void 0 ? {} : { margin: o.margin } });
  } catch (e) {
    if (isRenderError(e))
      throw e;
    throw new RenderError("E_INTERNAL", `the DVI conversion failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  const svgMs = performance.now() - t1;
  return { ...converted, log, terminal: r3.terminal, refused: r3.refused, dvi, ignoredSpecials: specials.ignored(), texMs, svgMs };
}
function utf8Bytes(s) {
  return new TextEncoder().encode(s);
}

// node_modules/@danielsimonjr/sciengjs/dist/tex/stage.js
var FORMAT_PACKAGES = /* @__PURE__ */ new Set(["tikz", "pgf", "xcolor", "circuitikz", "standalone"]);
var loadedCore;
var ENGINE_FILES = /* @__PURE__ */ new Set(["engine.wasm", "engine.symbols.json", "tex.pool", "scieng.fmt"]);
async function wasmModule(bytes) {
  const api = globalThis.WebAssembly;
  return api.compile(bytes);
}
async function loadCore(settings) {
  if (settings.texCore !== void 0)
    return coreOf(settings.texCore);
  const entry = findBundle("core");
  if (loadedCore?.sha256 === entry.sha256)
    return loadedCore.value;
  const value = await coreOf(unpackBundle(await loadBundleBytes(entry, settings)));
  loadedCore = { sha256: entry.sha256, value };
  return value;
}
async function coreOf(files) {
  const need = (name) => {
    const f = files.get(name);
    if (f === void 0)
      throw new RenderError("E_INTEGRITY", `the core TeX bundle has no file ${name}`);
    return f;
  };
  const tree = new TexTree();
  for (const [name, bytes] of files)
    if (!ENGINE_FILES.has(name))
      tree.add(name, bytes);
  const value = {
    engine: {
      module: await wasmModule(need("engine.wasm")),
      symbols: JSON.parse(new TextDecoder().decode(need("engine.symbols.json"))),
      pool: need("tex.pool")
    },
    format: { name: "scieng.fmt", bytes: need("scieng.fmt") },
    tree
  };
  return value;
}
function wrapSource(source, packages) {
  if (/\\documentclass\b/.test(source)) {
    return source.replace(/\\documentclass(?:\[([^\]]*)\])?/, (_m, opts) => {
      const list = (opts ?? "").split(",").map((s) => s.trim()).filter((s) => s !== "");
      return `\\documentclass[${[.../* @__PURE__ */ new Set([...list, "dvisvgm"])].join(",")}]`;
    });
  }
  const uses = packages.filter((p) => !FORMAT_PACKAGES.has(p)).map((p) => `\\usepackage{${p}}
`);
  return `\\documentclass[dvisvgm]{standalone}
${uses.join("")}\\begin{document}
${source}
\\end{document}
`;
}
async function renderTikzSvg(source, options, settings) {
  const detected = detectBundles(source);
  const bundleSettings = {
    cacheDir: settings.cacheDir,
    texBundleUrl: settings.texBundleUrl,
    allowNetwork: settings.allowNetwork,
    timeoutMs: settings.timeoutMs
  };
  const base = await loadCore({ ...bundleSettings, ...settings.texCore === void 0 ? {} : { texCore: settings.texCore } });
  const extra = detected.bundles.filter((b) => b !== "core");
  const tree = base.tree.fork();
  for (const files of (await loadBundles(extra, bundleSettings)).values()) {
    for (const [name, bytes] of files)
      tree.add(name, bytes);
  }
  const margin = options.margin;
  if (margin !== void 0 && (typeof margin !== "number" || !Number.isFinite(margin) || margin < 0)) {
    throw new RenderError("E_INPUT", "option margin must be a number that is zero or more");
  }
  const result = await renderTex({
    engine: base.engine,
    format: base.format,
    tree,
    source: wrapSource(source, detected.packages),
    jobName: "job",
    timeoutMs: settings.timeoutMs,
    ...margin === void 0 ? {} : { margin }
  });
  const warnings = [];
  if (result.missing.length > 0)
    warnings.push(`${result.missing.length} glyph(s) have no outline in the bundled fonts`);
  return { svg: result.svg, warnings };
}

export {
  renderTikzSvg
};
