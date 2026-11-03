/*
=============================================================================
OOXML DOCUMENT EDIT LIBRARY  (self-contained, zero-dependency)
=============================================================================

PURPOSE:
  Edit an *already-unpacked* Word document's word/document.xml while
  preserving each run's formatting (the <w:rPr> block). Run-level
  find/replace: the first <w:r> whose <w:t> text contains the search string has
  only the matched text replaced; the rest of the run text and the <w:rPr> are
  left untouched.

LIMITATIONS:
  - Matches inside one run (<w:r>) only. If your search text is split across
    multiple runs, or spans runs, this won't find it — unpack.py merges
    adjacent runs by default, which mitigates most cases.
  - The search text and the replacement are plain text. The library escapes
    the replacement on write and decodes the document text before it matches.
  - For tracked changes (<w:ins>/<w:del>) or comments, use the docx skill's
    documented XML patterns / comment.py instead.
=============================================================================
*/
import { readFileSync, writeFileSync } from "node:fs";

/** OOXML document.xml never legitimately carries a DOCTYPE/ENTITY declaration. This function refuses such a declaration.
 *  (defense-in-depth; this port does not use an entity-expanding parser). */
export function assertNoDoctype(xml: string): void {
  const low = xml.toLowerCase();
  if (low.includes("<!doctype") || low.includes("<!entity")) {
    throw new Error("document.xml contains a DOCTYPE/ENTITY declaration; refusing to parse.");
  }
}

/** A complete <w:r> element. The negative lookbehind skips a self-closing <w:r/>. */
const RUN_RE = /<w:r\b[^>]*?(?<!\/)>[\s\S]*?<\/w:r>/g;
/** A <w:t> element, with its attributes. A self-closing <w:t/> has no group 2. <w:tab/> does not match (the \b). */
const WT_RE = /<w:t\b([^>]*?)(?:\/>|>([\s\S]*?)<\/w:t>)/g;

const ENTITY_NAMES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** Decodes the XML entities of a text node. An unknown entity stays as written. */
const decodeXml = (s: string): string =>
  s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (all, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITY_NAMES[name] ?? all;
  });

/** Escapes text for an element body: ampersand, less-than and greater-than. */
const escapeXml = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Replaces the first occurrence of `search` in one run. Returns the new run XML, or null when the
 * run text does not contain `search`. Only the <w:t> nodes that overlap the match change. The other
 * nodes, the <w:rPr> and the other markup of the run keep their bytes.
 */
function replaceInRun(run: string, search: string, replacement: string, preserveSpace: boolean): string | null {
  const nodes = [...run.matchAll(WT_RE)];
  const textNodes = nodes.filter((m) => m[2] !== undefined);
  const texts = textNodes.map((m) => decodeXml(m[2]));
  const full = texts.join("");
  const start = full.indexOf(search);
  if (start < 0) return null;
  const end = start + search.length;

  const bodies: string[] = [];
  let insertedAt = -1;
  let offset = 0;
  texts.forEach((s, i) => {
    const o = offset;
    const e = o + s.length;
    offset = e;
    const left = s.slice(0, Math.max(0, Math.min(start, e) - o));
    const right = s.slice(Math.max(0, Math.max(end, o) - o));
    let mid = "";
    if (insertedAt < 0 && start >= o && start < e) {
      mid = replacement;
      insertedAt = i;
    }
    bodies.push(left + mid + right);
  });

  let out = "";
  let cursor = 0;
  let ti = 0;
  for (const m of nodes) {
    const at = m.index as number;
    out += run.slice(cursor, at);
    cursor = at + m[0].length;
    if (m[2] === undefined) {
      out += m[0];
      continue;
    }
    const idx = ti++;
    if (bodies[idx] === texts[idx]) {
      out += m[0];
      continue;
    }
    let attrs = m[1];
    if (preserveSpace && idx === insertedAt && !/xml:space=/.test(attrs)) attrs += ' xml:space="preserve"';
    out += `<w:t${attrs}>${escapeXml(bodies[idx])}</w:t>`;
  }
  out += run.slice(cursor);
  return out;
}

/** Replace the FIRST <w:r> whose combined <w:t> text contains `search`, with `replacement`.
 *  Only the matched text changes. The text before and after the match, and <w:rPr>, keep their place.
 *  `search` and `replacement` are plain text. An empty `search` replaces nothing. */
export function replaceInRuns(
  xml: string,
  search: string,
  replacement: string,
  preserveSpace: boolean,
): { xml: string; replaced: boolean } {
  if (search === "") return { xml, replaced: false };
  for (const m of xml.matchAll(RUN_RE)) {
    const at = m.index as number;
    const newRun = replaceInRun(m[0], search, replacement, preserveSpace);
    if (newRun === null) continue;
    return { xml: xml.slice(0, at) + newRun + xml.slice(at + m[0].length), replaced: true };
  }
  return { xml, replaced: false };
}

/** The result of one find pair. The field replaced is true when a run takes the replacement. */
export interface EditResult { find: string; replaced: boolean }

/**
 * Applies each find pair, in order, to an unpacked word/document.xml file.
 * The call writes the file only when at least one pair replaces a run.
 * The result reports each pair, and the number of pairs that replaced a run.
 * A pair with an empty find refuses the whole call before the file is read.
 */
export function applyEdits(
  documentXmlPath: string,
  replacements: { find: string; replace: string }[],
  preserveSpace = true,
): { results: EditResult[]; replaced_count: number; written: boolean } {
  if (replacements.some(({ find }) => find === "")) {
    throw new Error("[EMPTY_FIND] a find text must not be empty. No change was made.");
  }
  let xml = readFileSync(documentXmlPath, "utf-8");
  assertNoDoctype(xml);
  if (!xml.includes("<w:document")) {
    throw new Error(`${documentXmlPath} has no <w:document> root — point at an UNPACKED word/document.xml, not a .docx`);
  }
  const results: EditResult[] = [];
  let made = 0;
  for (const { find, replace } of replacements) {
    const r = replaceInRuns(xml, find, replace, preserveSpace);
    results.push({ find, replaced: r.replaced });
    if (r.replaced) { xml = r.xml; made++; }
  }
  if (made > 0) writeFileSync(documentXmlPath, xml, "utf-8");
  return { results, replaced_count: made, written: made > 0 };
}
