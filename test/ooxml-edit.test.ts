import { test } from "node:test";
import assert from "node:assert/strict";
import { replaceInRuns, assertNoDoctype, applyEdits } from "../src/ooxml-edit.ts";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
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

test("applyEdits refuses a file without a w:document root", () => {
  const dir = mkdtempSync(join(tmpdir(), "oox2-"));
  const p = join(dir, "document.xml");
  writeFileSync(p, "PK this is a zip, not xml");
  assert.throws(() => applyEdits(p, [{ find: "a", replace: "b" }]), /w:document/);
});
