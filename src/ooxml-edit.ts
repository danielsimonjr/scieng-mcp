/*
=============================================================================
OOXML DOCUMENT EDIT LIBRARY  (no npm dependency; Node built-ins and render-lib)
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
  - A match does not cross a non-text child of the run (w:br, w:tab, w:cr and
    the like). Adjacent w:t elements with nothing between them match together.
  - A rewritten w:t element is re-encoded: entities such as &quot; and &#160;
    become characters. The other nodes of the run keep their bytes.
  - The search text and the replacement are plain text. The library escapes
    the replacement on write and decodes the document text before it matches.
  - For tracked changes (<w:ins>/<w:del>) or comments, use the docx skill's
    documented XML patterns / comment.py instead.
=============================================================================
*/
import { readFileSync } from "node:fs";
import { writeOutput } from "./render-lib.ts";

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
/** A run-properties element. A match may pass over it. */
const RPR_RE = /<w:rPr\b[^>]*?(?:\/>|>[\s\S]*?<\/w:rPr>)/g;

const ENTITY_NAMES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** True when the code point is a character that XML 1.0 allows. */
const isXmlChar = (c: number): boolean =>
  c === 0x9 || c === 0xa || c === 0xd || (c >= 0x20 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xfffd) || (c >= 0x10000 && c <= 0x10ffff);

/**
 * Decodes the XML entities of a text node. An unknown named entity, or a numeric reference that
 * XML 1.0 forbids, stays as written. The function never throws.
 */
const decodeXml = (s: string): string =>
  s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (all, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return isXmlChar(code) ? String.fromCodePoint(code) : all;
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
  const textIndex = new Map<RegExpMatchArray, number>(textNodes.map((m, i) => [m, i]));

  // A group is a run of text nodes with nothing between them except run properties.
  // Any other child (w:br, w:tab, w:cr, a self-closing w:t) splits the groups, and a match stays in one group.
  const groups: number[][] = [];
  textNodes.forEach((m, i) => {
    if (i > 0) {
      const prev = textNodes[i - 1];
      const gap = run.slice((prev.index as number) + prev[0].length, m.index as number).replace(RPR_RE, "");
      if (gap === "") {
        groups[groups.length - 1].push(i);
        return;
      }
    }
    groups.push([i]);
  });

  let group: number[] | undefined;
  let start = -1;
  for (const g of groups) {
    const pos = g.map((i) => texts[i]).join("").indexOf(search);
    if (pos >= 0) {
      group = g;
      start = pos;
      break;
    }
  }
  if (group === undefined) return null;
  const end = start + search.length;

  const bodies = new Map<number, string>();
  let insertedAt = -1;
  let offset = 0;
  for (const i of group) {
    const s = texts[i];
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
    bodies.set(i, left + mid + right);
  }

  let out = "";
  let cursor = 0;
  for (const m of nodes) {
    const at = m.index as number;
    out += run.slice(cursor, at);
    cursor = at + m[0].length;
    const ti = textIndex.get(m);
    if (ti === undefined || !group.includes(ti)) {
      out += m[0];
      continue;
    }
    const body = bodies.get(ti) as string;
    if (body === texts[ti]) {
      out += m[0];
      continue;
    }
    let attrs = m[1];
    const edgeSpace = /^\s|\s$/.test(body);
    if (preserveSpace && !/xml:space=/.test(attrs) && (ti === insertedAt || edgeSpace)) {
      attrs += ' xml:space="preserve"';
    }
    out += `<w:t${attrs}>${escapeXml(body)}</w:t>`;
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
  if (made > 0) {
    // writeOutput writes a uniquely named temporary file in the same folder, then renames it over the target.
    // A crash leaves the old file or the new one, never a half-written file, and a failed write leaves no temporary file.
    writeOutput(documentXmlPath, xml);
  }
  return { results, replaced_count: made, written: made > 0 };
}
