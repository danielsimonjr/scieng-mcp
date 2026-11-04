import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHtml, resolveStaticBlocks } from "../src/render-html.ts";

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
  assert.equal((html.match(/\\\[/g) ?? []).length, 1 + 1 + 1); // one in content, one in its data-scieng-source copy, one in the delimiter config
});

test("latex auto-render lists the environments that a block may hold, so they do not stay literal", () => {
  const html = buildHtml([{ type: "latex", source: "\\begin{align} a &= b \\end{align}" }]);
  for (const env of ["equation", "equation*", "align", "align*", "gather", "gather*"]) {
    assert.ok(
      html.includes(`{ left: "\\\\begin{${env}}", right: "\\\\end{${env}}", display: true }`),
      `no auto-render delimiter for ${env}`,
    );
  }
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

test("wavedrom block sits on a light panel, so the black default skin reads on the dark page", () => {
  const html = buildHtml([{ type: "wavedrom", source: '{ "signal": [{ "name": "clk", "wave": "p..." }] }' }]);
  assert.match(html, /<div class="wavedrom-block"><script type="WaveDrom">[^<]*<\/script><\/div>/);
  assert.match(html, /\.wavedrom-block \{[^}]*background: #fff/);
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
    /can open a script context in the page/,
  );
});

test("wavedrom guard names the refused token and the reason (F30)", () => {
  const cases: [string, string][] = [
    ['{"name":"<!--<script>"}', "<!--"],
    ['{"name":"<SCRIPT>"}', "<SCRIPT"],
    ['{"name":"<!--"}', "<!--"],
  ];
  for (const [source, token] of cases) {
    assert.throws(
      () => buildHtml([{ type: "wavedrom", source }]),
      (err: Error) => err.message.includes(`"${token}"`) && /can open a script context in the page/.test(err.message),
      source,
    );
  }
});

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#13": "\r", "#10": "\n" };
/** Decodes the five escapes that the attribute encoder writes, in one pass. */
const unescapeAttr = (s: string): string =>
  s.replace(/&(amp|lt|gt|quot|#39|#13|#10);/g, (_, e: string) => ENTITY[e]!);

/** Every value of a data-scieng-source attribute, in page order, after decoding. */
const sourceAttrs = (html: string): string[] =>
  [...html.matchAll(/data-scieng-source="([^"]*)"/g)].map((m) => unescapeAttr(m[1]!));

const TRICKY = 'a "quoted" & <tag> \'single\'\nline two é ü 中 \ end';
const EVERY_BLOCK = [
  { type: "mermaid" as const, source: `classDiagram\nclass A {\n  +String "name" & <x>\n}\n%% é` },
  { type: "dot" as const, source: 'digraph { a [label="x & <y> \\"q\\" é"] }' },
  { type: "latex" as const, source: `a < b & "c" \frac{1}{2} é` },
  { type: "plotly" as const, source: JSON.stringify({ data: [{ name: 'a"&<b é' }], layout: { title: "<t>&" } }) },
  { type: "wavedrom" as const, source: '{ "signal": [{ "name": "a & <b> é \\"q\\"", "wave": "01.0" }] }' },
  { type: "raw-html" as const, source: '<p data-x="a&quot;b">é & &lt;</p>' },
];

test("each block carries its exact source in data-scieng-source, for every block type", () => {
  for (const block of EVERY_BLOCK) {
    const html = buildHtml([block]);
    assert.deepEqual(sourceAttrs(html), [block.source], `${block.type}: attribute does not round-trip`);
  }
});

test("the attribute round-trips tricky text: quotes, ampersands, angle brackets, newlines, non-ASCII, CR", () => {
  const html = buildHtml([{ type: "mermaid", source: TRICKY + "\r\nend" }]);
  assert.deepEqual(sourceAttrs(html), [TRICKY + "\r\nend"]);
});

test("the attribute encodes a carriage return as &#13; and keeps no raw carriage return", () => {
  const html = buildHtml([{ type: "mermaid", source: "a\r\nb" }]);
  assert.match(html, /data-scieng-source="a&#13;\nb"/);
  for (const m of html.matchAll(/data-scieng-source="([^"]*)"/g)) assert.doesNotMatch(m[1]!, /\r/);
});

test("the attribute encodes a single quote as &#39;", () => {
  const html = buildHtml([{ type: "mermaid", source: "it's" }]);
  assert.match(html, /data-scieng-source="it&#39;s"/);
});

test("the attribute value holds no raw quote, ampersand or angle bracket", () => {
  const html = buildHtml(EVERY_BLOCK);
  for (const m of html.matchAll(/data-scieng-source="([^"]*)"/g)) {
    assert.doesNotMatch(m[1]!, /["<>]|&(?!(?:amp|lt|gt|quot|#39|#13|#10);)/);
  }
});

test("a page with all six block types carries six attributes, in block order", () => {
  assert.deepEqual(sourceAttrs(buildHtml(EVERY_BLOCK)), EVERY_BLOCK.map((b) => b.source));
});

test("the wavedrom panel has a light background and a visible border", () => {
  const html = buildHtml([{ type: "wavedrom", source: '{ "signal": [] }' }]);
  const rule = /\.wavedrom-block \{([^}]*)\}/.exec(html);
  assert.ok(rule, "no .wavedrom-block rule");
  assert.match(rule[1]!, /background:\s*#fff\b/);
  assert.match(rule[1]!, /border:\s*1px solid #[0-9a-f]{6}/i);
});

/** WCAG relative luminance of a six-digit hex colour. */
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

test("dark page: body text, headings and the WaveDrom border meet the contrast floor", () => {
  const html = buildHtml([{ type: "wavedrom", source: '{ "signal": [] }', title: "Timing" }]);
  const root = /:root \{([^}]*)\}/.exec(html)![1]!;
  const colour = (name: string): string => `#${new RegExp(`--${name}:\\s*#([0-9a-f]{6})`, "i").exec(root)![1]}`;
  const bg = colour("bg");
  assert.ok(contrast(colour("fg"), bg) >= 4.5, "body text on the page background is below 4.5:1");
  assert.ok(contrast(colour("accent"), bg) >= 4.5, "heading on the page background is below 4.5:1");
  const border = /\.wavedrom-block \{[^}]*border:\s*1px solid (#[0-9a-f]{6})/i.exec(html)![1]!;
  assert.ok(contrast(border, bg) >= 3, "the panel border is below 3:1 against the page background");
  assert.ok(contrast("#000000", "#ffffff") >= 4.5, "diagram text on the light panel is below 4.5:1");
});

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

test("static plotly block renders its SVG inline and loads no Plotly script", () => {
  const html = buildHtml([{ type: "plotly", static: true, source: '{"data":[],"layout":{}}', svg: SVG }]);
  assert.match(html, /<svg/);
  assert.doesNotMatch(html, /cdn\.plot\.ly/);
  assert.doesNotMatch(html, /Plotly\.newPlot/);
});

test("a mixed page loads Plotly once, and only when a non-static plotly block is present", () => {
  const mixed = buildHtml([
    { type: "plotly", static: true, source: "{}", svg: SVG },
    { type: "plotly", source: "{}" },
  ]);
  assert.equal((mixed.match(/plotly-2\.35\.2\.min\.js/g) ?? []).length, 1);
  assert.match(mixed, /Plotly\.newPlot\("plotly-1"/);
  const staticOnly = buildHtml([{ type: "plotly", static: true, source: "{}", svg: SVG }]);
  assert.doesNotMatch(staticOnly, /plotly-2\.35\.2/);
});

test("a static plotly block without its SVG is refused", () => {
  assert.throws(() => buildHtml([{ type: "plotly", static: true, source: "{}" }]), /static.*SVG/i);
});

test("a static plotly block refuses an SVG that holds a script tag", () => {
  const bad = '<svg><script>alert(1)</script></svg>';
  assert.throws(() => buildHtml([{ type: "plotly", static: true, source: "{}", svg: bad }]), /script/i);
});

test("resolveStaticBlocks renders each static plotly block through the renderer and leaves the rest", async () => {
  const seen: string[] = [];
  const fake = async (source: string) => { seen.push(source); return SVG; };
  const out = await resolveStaticBlocks([
    { type: "plotly", static: true, source: '{"data":[]}' },
    { type: "plotly", source: '{"data":[]}' },
    { type: "mermaid", source: "graph TD" },
  ], fake);
  assert.deepEqual(seen, ['{"data":[]}']);
  assert.equal(out[0]!.svg, SVG);
  assert.equal(out[1]!.svg, undefined);
});

test("an engine error on a static block keeps its code and names the block index", async () => {
  const fake = async () => {
    throw Object.assign(new Error("layout.title must be an object"), { name: "RenderError", code: "E_INPUT" });
  };
  await assert.rejects(
    resolveStaticBlocks([{ type: "mermaid", source: "graph TD" }, { type: "plotly", static: true, source: "{}" }], fake),
    (err: Error & { code?: string }) => err.code === "E_INPUT" && /plotly block 1/.test(err.message) && /\[E_INPUT\]/.test(err.message),
  );
});

test("render_html draws a static plotly block through the engine and loads no Plotly script", async () => {
  const { makeHandlers } = await import("../src/tools.ts");
  const { mkdtempSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const out = join(mkdtempSync(join(tmpdir(), "static-")), "p.html");
  const spec = JSON.stringify({ data: [{ x: [1, 2], y: [3, 4], type: "scatter" }], layout: { title: { text: "t" } } });
  await makeHandlers().render_html({ blocks: [{ type: "plotly", static: true, source: spec }], output_path: out });
  const html = readFileSync(out, "utf-8");
  assert.match(html, /<svg/);
  assert.doesNotMatch(html, /cdn\.plot\.ly/);
});

const IDSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clip0"><rect/></clipPath><linearGradient id="g1"/></defs><g clip-path="url(#clip0)" fill="url( \'#g1\' )"><use href="#clip0"/><use xlink:href="#g1"/></g></svg>';

test("two static plotly blocks get disjoint ids, and each reference resolves inside its own block", () => {
  const html = buildHtml([
    { type: "plotly", static: true, source: "{}", svg: IDSVG },
    { type: "plotly", static: true, source: "{}", svg: IDSVG },
  ]);
  const parts = html.split('<div class="plotly-static">').slice(1);
  assert.equal(parts.length, 2);
  const idSets = parts.map((p) => new Set([...p.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!)));
  assert.equal(idSets[0]!.size, 2);
  for (const id of idSets[0]!) assert.ok(!idSets[1]!.has(id), `id ${id} is in both blocks`);
  parts.forEach((p, k) => {
    const refs = [...p.matchAll(/url\(\s*['"]?#([^'")\s]+)|href="#([^"]+)"/g)].map((m) => m[1] ?? m[2]!);
    assert.equal(refs.length, 4);
    for (const r of refs) assert.ok(idSets[k]!.has(r), `block ${k}: #${r} does not resolve in the block`);
  });
});

for (const [name, bad] of [
  ["foreignObject", '<svg><foreignObject><div>x</div></foreignObject></svg>'],
  ["an on* attribute", '<svg><rect onload="alert(1)"/></svg>'],
  ["an on* attribute after a slash", '<svg><rect/onclick="alert(1)"/></svg>'],
  ["a javascript: URL", '<svg><a href="javascript:alert(1)"><text>x</text></a></svg>'],
  ["an entity-split javascript: URL", '<svg><a href="java&#x09;script:alert(1)">x</a></svg>'],
] as const) {
  test(`a static plotly block refuses an SVG that holds ${name}`, () => {
    assert.throws(() => buildHtml([{ type: "plotly", static: true, source: "{}", svg: bad }]), /plotly block 0/);
  });
}

test("static: true on a block that is not plotly is refused", () => {
  assert.throws(() => buildHtml([{ type: "mermaid", static: true, source: "graph TD" }]),
    (err: Error & { code?: string }) => err.code === "E_INPUT" && /mermaid block 0/.test(err.message) && /static/.test(err.message));
});

test("render_html refuses static: true on a block that is not plotly, with E_INPUT", async () => {
  const { makeHandlers } = await import("../src/tools.ts");
  const { mkdtempSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const out = join(mkdtempSync(join(tmpdir(), "static-")), "x.html");
  await assert.rejects(
    makeHandlers().render_html({ blocks: [{ type: "dot", static: true, source: "digraph{a}" }], output_path: out }),
    (err: Error & { code?: string }) => err.code === "E_INPUT",
  );
  assert.equal(existsSync(out), false);
});

test("render_html passes the engine error code of an invalid static source to the result", async () => {
  const { makeHandlers } = await import("../src/tools.ts");
  const { mkdtempSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const out = join(mkdtempSync(join(tmpdir(), "static-")), "bad.html");
  await assert.rejects(
    makeHandlers().render_html({ blocks: [{ type: "plotly", static: true, source: "not json" }], output_path: out }),
    (err: Error & { code?: string }) => typeof err.code === "string" && /^E_/.test(err.code)
      && /plotly block 0/.test(err.message) && err.message.includes(`[${err.code}]`),
  );
  assert.equal(existsSync(out), false);
});
