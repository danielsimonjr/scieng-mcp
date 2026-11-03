import { test } from "node:test";
import assert from "node:assert/strict";
import { replaceInRuns, assertNoDoctype, applyEdits } from "../src/ooxml-edit.ts";
import { mkdtempSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUN = (rpr: string, t: string) => `<w:r>${rpr}<w:t>${t}</w:t></w:r>`;

test("replaces text in first matching run, preserves rPr", () => {
  const xml = `<w:p>${RUN("<w:rPr><w:b/></w:rPr>", "P/N 779068-01")}</w:p>`;
  const { xml: out, replaced } = replaceInRuns(xml, "P/N 779068-01", "P/N 779630-01", true);
  assert.equal(replaced, true);
  assert.match(out, /<w:rPr><w:b\/><\/w:rPr>/);       // formatting preserved
  assert.match(out, /P\/N 779630-01/);                 // text swapped
  assert.match(out, /xml:space="preserve"/);           // preserve-space applied
});

test("returns replaced=false when search text absent", () => {
  const xml = `<w:p>${RUN("", "hello")}</w:p>`;
  assert.equal(replaceInRuns(xml, "world", "x", false).replaced, false);
});

test("blanks secondary <w:t> nodes in the matched run", () => {
  const xml = `<w:r><w:t>foo</w:t><w:t>bar</w:t></w:r>`;
  const { xml: out } = replaceInRuns(xml, "foobar", "baz", false);
  assert.match(out, /<w:t[^>]*>baz<\/w:t><w:t><\/w:t>/);
});

test("assertNoDoctype throws on DOCTYPE/ENTITY", () => {
  assert.throws(() => assertNoDoctype("<!DOCTYPE x><w:document/>"), /DOCTYPE/i);
  assert.doesNotThrow(() => assertNoDoctype("<w:document/>"));
});

test("applyEdits edits document.xml in place and reports counts", () => {
  const dir = mkdtempSync(join(tmpdir(), "oox-"));
  const p = join(dir, "document.xml");
  writeFileSync(p, `<w:document><w:r><w:rPr/><w:t>P/N 779068-01</w:t></w:r></w:document>`);
  const r = applyEdits(p, [{ find: "P/N 779068-01", replace: "P/N 779630-01" }, { find: "absent", replace: "x" }]);
  assert.equal(r.replaced_count, 1);
  assert.deepEqual(r.results, [{ find: "P/N 779068-01", replaced: true }, { find: "absent", replaced: false }]);
  assert.equal(r.written, true);
  assert.match(readFileSync(p, "utf-8"), /779630-01/);
});

test("applyEdits all-miss path leaves file byte-identical and reports no writes", () => {
  const dir = mkdtempSync(join(tmpdir(), "oox3-"));
  const p = join(dir, "document.xml");
  const original = `<w:document><w:r><w:rPr/><w:t>P/N 779068-01</w:t></w:r></w:document>`;
  writeFileSync(p, original);
  const before = readFileSync(p);
  const beforeMtime = statSync(p).mtimeMs;
  const r = applyEdits(p, [{ find: "absent-1", replace: "x" }, { find: "absent-2", replace: "y" }]);
  assert.equal(r.written, false);
  assert.equal(r.replaced_count, 0);
  assert.deepEqual(r.results, [
    { find: "absent-1", replaced: false },
    { find: "absent-2", replaced: false },
  ]);
  const after = readFileSync(p);
  assert.ok(before.equals(after), "file content must be byte-identical after an all-miss applyEdits call");
  assert.equal(statSync(p).mtimeMs, beforeMtime, "file mtime must be unchanged after an all-miss applyEdits call");
});

test("applyEdits refuses a file without a w:document root", () => {
  const dir = mkdtempSync(join(tmpdir(), "oox2-"));
  const p = join(dir, "document.xml");
  writeFileSync(p, "PK this is a zip, not xml");
  assert.throws(() => applyEdits(p, [{ find: "a", replace: "b" }]), /w:document/);
});

// Well-formedness check for the written XML: every tag is balanced, every "&" starts a
// valid entity reference, and no "<" or ">" appears outside a tag. This is not a full parser.
function assertWellFormed(xml: string): void {
  const stack: string[] = [];
  const tagRe = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s[^<>]*?)?)(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(xml)) !== null) {
    checkText(xml.slice(last, m.index));
    last = tagRe.lastIndex;
    const [, closing, name, , selfClose] = m;
    if (closing) {
      assert.equal(stack.pop(), name, `mismatched closing tag </${name}>`);
    } else if (!selfClose) {
      stack.push(name);
    }
  }
  checkText(xml.slice(last));
  assert.deepEqual(stack, [], "unclosed tags at end of document");
}

function checkText(text: string): void {
  assert.doesNotMatch(text, /</, "a bare '<' in text content");
  assert.doesNotMatch(text, />/, "a bare '>' in text content");
  for (const amp of text.matchAll(/&([^;]*);?/g)) {
    assert.match(amp[0], /^&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);$/, `a bare or invalid '&' in text: ${amp[0]}`);
  }
}

test("F1: replaces only the matched words of a run and keeps the rest and rPr", () => {
  const xml = `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Dear Alice, your invoice is due Friday.</w:t></w:r></w:p>`;
  const { xml: out, replaced } = replaceInRuns(xml, "Alice", "Bob", false);
  assert.equal(replaced, true);
  assert.equal(out, `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Dear Bob, your invoice is due Friday.</w:t></w:r></w:p>`);
});

test("F2: an empty find is refused and changes nothing", () => {
  assert.equal(replaceInRuns(`<w:r><w:t>Dear</w:t></w:r>`, "", "X", false).replaced, false);
  const dir = mkdtempSync(join(tmpdir(), "oox4-"));
  const p = join(dir, "document.xml");
  const original = `<w:document><w:r><w:rPr/><w:t>Dear Alice</w:t></w:r></w:document>`;
  writeFileSync(p, original);
  assert.throws(() => applyEdits(p, [{ find: "Alice", replace: "Bob" }, { find: "", replace: "X" }]), /\[EMPTY_FIND\]/);
  assert.equal(readFileSync(p, "utf-8"), original, "an empty find must leave the file unchanged, even after a valid pair");
});

test("F3: a replacement with & < > is escaped and the written XML parses", () => {
  const dir = mkdtempSync(join(tmpdir(), "oox5-"));
  const p = join(dir, "document.xml");
  writeFileSync(p, `<w:document><w:r><w:rPr/><w:t>Title goes here</w:t></w:r></w:document>`);
  const r = applyEdits(p, [{ find: "Title goes here", replace: "Q&A <draft>" }]);
  assert.equal(r.written, true);
  const out = readFileSync(p, "utf-8");
  assert.match(out, /<w:t[^>]*>Q&amp;A &lt;draft&gt;<\/w:t>/);
  assertWellFormed(out);
});

test("F4a: a find of & matches text stored as &amp;", () => {
  const xml = `<w:r><w:t>Q&amp;A</w:t></w:r>`;
  const { xml: out, replaced } = replaceInRuns(xml, "&", " and ", false);
  assert.equal(replaced, true);
  assert.equal(out, `<w:r><w:t>Q and A</w:t></w:r>`);
});

test("F4b: markup is not matched as text and <w:tab/> is not read as <w:t>", () => {
  assert.equal(replaceInRuns(`<w:r><w:tab/><w:t>Hello</w:t></w:r>`, "<w:t>", "X", false).replaced, false);
  const { xml: out } = replaceInRuns(`<w:r><w:tab/><w:t>Hello</w:t></w:r>`, "Hello", "Bye", false);
  assert.equal(out, `<w:r><w:tab/><w:t>Bye</w:t></w:r>`);
});
