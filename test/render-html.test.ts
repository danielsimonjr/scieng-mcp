import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHtml } from "../src/render-html.ts";

test("emits only the CDN imports the block types need", () => {
  const html = buildHtml([{ type: "mermaid", source: "graph TD\n A-->B" }]);
  assert.match(html, /mermaid@11/);
  assert.doesNotMatch(html, /plotly-2\.35\.2/);
  assert.doesNotMatch(html, /katex@0\.16\.21/);
  assert.doesNotMatch(html, /wavedrom/i);
  assert.doesNotMatch(html, /@viz-js\/viz/);
});

test("every CDN asset carries SRI integrity + crossorigin", () => {
  const html = buildHtml([
    { type: "mermaid", source: "graph TD\n A-->B" }, { type: "dot", source: "digraph{a}" },
    { type: "latex", source: "x" }, { type: "plotly", source: "{}" },
    { type: "wavedrom", source: '{ "signal": [] }' },
  ]);
  const tags = html.match(/<(script|link)[^>]+(src|href)="https:[^>]*>/g) ?? [];
  assert.equal(tags.length, 8); // mermaid 1 + viz 1 + katex 3 + plotly 1 + wavedrom 2
  for (const t of tags) {
    assert.match(t, /integrity="sha384-/);
    assert.match(t, /crossorigin="anonymous"/);
  }
});

test("mermaid source is HTML-escaped inside its pre block", () => {
  const html = buildHtml([{ type: "mermaid", source: "graph TD\n A[</pre><script>] --> B" }]);
  assert.doesNotMatch(html, /<script>\]/);
  assert.match(html, /&lt;\/pre&gt;&lt;script&gt;/);
});

test("dot block embeds source via JSON and pulls viz.js", () => {
  const src = 'digraph { a -> b [label="x\\"y"] }';
  const html = buildHtml([{ type: "dot", source: src }]);
  assert.match(html, /@viz-js\/viz/);
  assert.match(html, /renderSVGElement\(/);
  // The embedded argument must be exactly the JSON encoding of the source
  // (JSON.stringify escapes both the backslash and the quote).
  assert.ok(html.includes(JSON.stringify(src)));
});

test("latex block wraps bare math in display delimiters and loads KaTeX", () => {
  const html = buildHtml([{ type: "latex", source: "E = mc^2" }]);
  assert.match(html, /katex@0\.16\.21/);
  assert.match(html, /auto-render\.min\.js/);
  assert.match(html, /\\\[E = mc\^2\\\]/);
});

test("latex block with its own delimiters is not double-wrapped", () => {
  const html = buildHtml([{ type: "latex", source: "\\[ a+b \\]" }]);
  assert.equal((html.match(/\\\[/g) ?? []).length, 1 + 1); // one in content, one in the delimiter config
});

test("plotly block requires valid JSON and inlines the spec", () => {
  assert.throws(() => buildHtml([{ type: "plotly", source: "not json" }]), /plotly.*JSON/i);
  const html = buildHtml([{ type: "plotly", source: '{"data":[{"x":[1],"y":[2]}],"layout":{"title":"t"}}' }]);
  assert.match(html, /plotly-2\.35\.2\.min\.js/);
  assert.match(html, /Plotly\.newPlot\("plotly-0"/);
});

test("wavedrom block emits WaveDrom script tag + ProcessAll", () => {
  const html = buildHtml([{ type: "wavedrom", source: '{ "signal": [{ "name": "clk", "wave": "p..." }] }' }]);
  assert.match(html, /wavedrom\/3\.1\.0\/wavedrom\.min\.js/);
  assert.match(html, /type="WaveDrom"/);
  assert.match(html, /ProcessAll/);
});

test("raw-html passes through verbatim; titles become h2 sections", () => {
  const html = buildHtml([{ type: "raw-html", source: "<blink>hi</blink>", title: "Custom & Bit" }], "My Page");
  assert.match(html, /<blink>hi<\/blink>/);
  assert.match(html, /<h2>Custom &amp; Bit<\/h2>/);
  assert.match(html, /<title>My Page<\/title>/);
});

test("empty blocks throws", () => {
  assert.throws(() => buildHtml([]), /at least one block/i);
});

test("script-context sources cannot break out of their tags", () => {
  const html = buildHtml([
    { type: "dot", source: 'digraph { a [label="</script><img src=x>"] }' },
    { type: "plotly", source: '{"data":[],"layout":{"title":"</script><img src=x>"}}' },
  ]);
  assert.doesNotMatch(html, /<\/script><img/);
  assert.match(html, /\\u003c\/script/);
});

test("wavedrom source containing </script is rejected", () => {
  assert.throws(
    () => buildHtml([{ type: "wavedrom", source: '{"signal":[{"name":"</script>"}]}' }]),
    /must not contain/,
  );
});
