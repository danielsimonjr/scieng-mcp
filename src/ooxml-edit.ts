/*
=============================================================================
OOXML DOCUMENT EDIT LIBRARY  (self-contained, zero-dependency)
=============================================================================

PURPOSE:
  Edit an *already-unpacked* Word document's word/document.xml while
  preserving each run's formatting (the <w:rPr> block). Run-level
  find/replace: any <w:r> whose <w:t> text contains the search string has
  only its text swapped; the <w:rPr> is left untouched.

LIMITATIONS:
  - Matches at the run (<w:r>) level. If your search text is split across
    multiple runs, or spans runs, this won't find it — unpack.py merges
    adjacent runs by default, which mitigates most cases.
  - For tracked changes (<w:ins>/<w:del>) or comments, use the docx skill's
    documented XML patterns / comment.py instead.
=============================================================================
*/
import { readFileSync, writeFileSync } from "node:fs";

/** OOXML document.xml never legitimately carries a DOCTYPE/ENTITY; refuse it
 *  (defense-in-depth; this port does not use an entity-expanding parser). */
export function assertNoDoctype(xml: string): void {
  const low = xml.toLowerCase();
  if (low.includes("<!doctype") || low.includes("<!entity")) {
    throw new Error("document.xml contains a DOCTYPE/ENTITY declaration; refusing to parse.");
  }
}

const runText = (run: string): string =>
  [...run.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join("");

/** Replace text in the FIRST <w:r> whose combined <w:t> contains `search`.
 *  The run's <w:rPr> is untouched; secondary <w:t> nodes are blanked. */
export function replaceInRuns(
  xml: string,
  search: string,
  replacement: string,
  preserveSpace: boolean,
): { xml: string; replaced: boolean } {
  const runRegex = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
  let match: RegExpExecArray | null;
  while ((match = runRegex.exec(xml)) !== null) {
    const run = match[0];
    if (!runText(run).includes(search)) continue;
    let first = true;
    const newRun = run.replace(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g, (_full, attrs: string) => {
      if (first) {
        first = false;
        const attr = preserveSpace && !/xml:space=/.test(attrs) ? `${attrs} xml:space="preserve"` : attrs;
        return `<w:t${attr}>${replacement}</w:t>`;
      }
      return `<w:t${attrs}></w:t>`;
    });
    return { xml: xml.slice(0, match.index) + newRun + xml.slice(match.index + run.length), replaced: true };
  }
  return { xml, replaced: false };
}

export interface EditResult { find: string; replaced: boolean }

export function applyEdits(
  documentXmlPath: string,
  replacements: { find: string; replace: string }[],
  preserveSpace = true,
): { results: EditResult[]; replaced_count: number; written: boolean } {
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
