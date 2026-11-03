# scieng-mcp Components

This document describes the modules of `src/`. For each module, it gives the job, the exports with their signatures, the main internal parts, the imports, and the tests. The tool arguments and results are in [API.md](API.md). The steps of one tool call are in [DATAFLOW.md](DATAFLOW.md).

## Module map

| Module | Job | Exports | Imports from `src/` | Test file |
|---|---|---|---|---|
| `src/index.ts` | Starts the server on standard input and standard output. | 0 | `src/tools.ts` | None. The bundle gate starts the bundle. |
| `src/tools.ts` | Defines the six tools. Checks the arguments and dispatches each call. | 5 | Every renderer, `src/render-lib.ts`, `src/engine-config.ts` | `test/tools.test.ts` |
| `src/render-lib.ts` | Shared helpers. HTTP with retries, bounded reads, output writes, output paths and a concurrency limit. | 7 | None | `test/render-lib.test.ts` |
| `src/render-mermaid.ts` | Renders Mermaid source to SVG through mermaid.ink. | 3 | `src/render-lib.ts` | `test/render-mermaid.test.ts` |
| `src/render-latex.ts` | Renders LaTeX source to SVG through latex.codecogs.com. | 5 | `src/render-lib.ts` | `test/render-latex.test.ts` |
| `src/render-dot.ts` | Renders DOT source to SVG or PNG on the local machine. | 1 | `src/render-lib.ts`, `src/engine-config.ts` | `test/render-dot.test.ts` |
| `src/render-html.ts` | Builds one HTML page from typed blocks. | 3 | None | `test/render-html.test.ts` |
| `src/ooxml-edit.ts` | Replaces text in runs of an unpacked `word/document.xml`. | 4 | None | `test/ooxml-edit.test.ts` |
| `src/engine-config.ts` | Sets the assets folder of the engine for a bundled run. | 2 | None | `test/engine-config.test.ts` |

The modules export 30 declarations in total. `src/index.ts` exports nothing.

## src/index.ts

Job: starts the server on standard input and standard output.

Behaviour:

- The module creates one server. The server name is `scieng-mcp`. The version is the build constant `__PKG_VERSION__`. An unbundled run uses the version `0.0.0-dev`.
- The server registers the method `tools/list`. The method returns `TOOLS`.
- The server registers the method `tools/call`. The method passes the name and the arguments to `dispatchTool`.
- The module starts the transport with `serveStdio`. The option `legacy` is `serve`. A transport error goes to standard error as one line.
- At start, the module writes `scieng-mcp: connected on stdio` to standard error.

Exports: none.

## src/tools.ts

Job: defines the six tools, checks their arguments, runs the handlers, and maps each failure to an error result.

```ts
export type ToolHandler = (raw: unknown) => Promise<string>;

export interface ToolResult {
  [x: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

export async function dispatchTool(
  handlers: Record<string, ToolHandler>,
  name: string,
  args: unknown,
): Promise<ToolResult>;

export const TOOLS: Tool[];

export function makeHandlers(fetchImpl: FetchLike = fetch): Record<string, ToolHandler>;
```

Behaviour:

- `dispatchTool` checks the name with `Object.hasOwn`. An unknown name returns an error result. No handler runs.
- `dispatchTool` calls the handler with the arguments. A missing argument becomes an empty object.
- A successful handler returns its text in one text item of the result.
- A handler that throws writes one line to standard error. The result holds a JSON body with `status` set to `error`.
- `makeHandlers` returns one handler for each tool name. The `fetchImpl` parameter replaces the global `fetch` in `render_mermaid` and `render_latex`.
- `TOOLS` holds the six tool definitions. Each definition holds a name, a description, the annotations and the JSON Schema of its input. [API.md](API.md) lists the schemas.

Internal parts:

- `resolveRenderIo` checks the arguments of the three render tools with a strict schema. `resolveRenderIo` requires exactly one of `source` and `input_path`. `resolveRenderIo` requires `output_path` with `source`. With `input_path`, `resolveRenderIo` reads the file with `readInput`. Without `output_path`, it derives the output path.
- `engineFailure` reads an error of the engine. The check uses the error name and the code. `errorBody` adds the code, and the line and column when the engine gives them.
- `result` builds the JSON body of a render result. The body holds `path` and `bytes`, and the fields that a tool adds.
- `HtmlArgs` and `OoxmlArgs` are strict schemas for `render_html` and `ooxml_replace`.

Imports: `src/render-lib.ts`, `src/render-mermaid.ts`, `src/render-dot.ts`, `src/engine-config.ts`, `src/render-latex.ts`, `src/render-html.ts`, `src/ooxml-edit.ts`. The package `@danielsimonjr/sciengjs` supplies `RENDER_ERROR_CODES` and `capabilities`. The package `zod` supplies the schemas.

## src/render-lib.ts

Job: shared helpers for the renderers.

```ts
export type FetchLike = typeof fetch;

export interface HttpOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: FetchLike;
}

export async function httpText(url: string, opts: HttpOptions = {}): Promise<string>;

export function readInput(path: string, maxBytes = 512 * 1024): string;

export function deriveOutputPath(input: string, ext = ".svg"): string;

export function writeOutput(path: string, content: string | Uint8Array): void;

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]>;
```

Behaviour:

- `httpText` sends a GET request by default. The default timeout is 20000 ms per attempt. The default number of retries is three, so the call makes up to four attempts.
- `httpText` retries a network error. `httpText` retries the statuses 429, 500, 502, 503 and 504. The wait before the first retry is 500 ms. The wait doubles after each attempt. A numeric `Retry-After` header on a retried status sets the wait.
- `httpText` throws at once for any other error status. The message names the host and gives the first 500 characters of the body.
- `httpText` throws at once when the body read fails. `httpText` does not retry the failed read. The timeout timer is cleared after a successful body read. A failed body read leaves the timer armed until the timer fires.
- `readInput` reads the whole file and then compares its size with `maxBytes`. The default limit is 524288 bytes. A larger file throws `input too large`.
- `deriveOutputPath` keeps the folder and the file name without its extension. `deriveOutputPath` adds the extension `ext`.
- `writeOutput` writes `<path>.tmp` and then renames it to `path`. A failed rename leaves the temporary file in place.
- `mapLimit` runs `fn` on each item with at most `limit` calls at the same time. The result keeps the order of the items. A thrown error rejects the returned promise. The other calls keep running.

Imports: Node built-in modules only.

## src/render-mermaid.ts

Job: sends Mermaid source to mermaid.ink and writes the SVG.

```ts
export function encodePako(mermaidCode: string): string;

export async function renderMermaidSource(
  code: string,
  output: string,
  fetchImpl?: FetchLike,
): Promise<string>;

export async function renderMermaid(
  input: string,
  output: string,
  fetchImpl?: FetchLike,
): Promise<string>;
```

Behaviour:

- `encodePako` builds the JSON text `{"code": <source>, "mermaid": {"theme": "default"}}`. `encodePako` compresses the text with zlib `deflateSync`. `encodePako` encodes the result as base64url.
- `renderMermaidSource` requests `https://mermaid.ink/svg/pako:<payload>` with `httpText`. The call throws `no SVG in response` when the response has no `<svg`. Otherwise `renderMermaidSource` writes the text with `writeOutput` and returns the text.
- `renderMermaid` reads the input file with `readInput`, and then calls `renderMermaidSource`.

Imports: `node:zlib`, `src/render-lib.ts`.

## src/render-latex.ts

Job: splits LaTeX source into blocks, renders each block through latex.codecogs.com, and writes one SVG.

```ts
export interface Block {
  label: string;
  tex: string;
}

export function extractBlocks(texSource: string): Block[];

export function combineSvgs(svgs: string[]): string;

export async function renderLatexSource(
  texSource: string,
  output: string,
  opts: { dpi?: number; fetchImpl?: FetchLike } = {},
): Promise<{ svg: string; failures: { index: number; label: string; message: string }[] }>;

export async function renderLatex(
  input: string,
  output: string,
  opts: { dpi?: number; fetchImpl?: FetchLike } = {},
): Promise<string>;
```

Behaviour:

- `extractBlocks` returns one block with the label `math` when the source has no `\documentclass` and no `\begin{document}`.
- For a document, `extractBlocks` returns one block for each `align`, `equation`, `gather`, `multline`, `array` or `cases` environment. `extractBlocks` includes the starred forms. These blocks come first, in source order.
- Then `extractBlocks` returns one block for each `\[ ... \]` display. The label of each display block is `display`.
- Each block gets the `\newcommand` and `\DeclareMathOperator` definitions of the preamble before its source.
- A document with no block returns one block with the label `document`.
- `combineSvgs` stacks the SVG images on a white rectangle. `combineSvgs` leaves 20 units between images. The width is the largest image width plus 40 units.
- `combineSvgs` reads a width or a height only when its value is in single quotes. The default is 400 units for a width and 50 units for a height.
- `renderLatexSource` requests `https://latex.codecogs.com/svg.image?\dpi{<dpi>}<encoded block>` for each block. The default DPI is 200. At most four requests run at the same time.
- A block that fails goes into `failures`. Each entry holds the block index, the label and the message.
- When one block renders, the result is its SVG text. When more blocks render, the result is `combineSvgs` of the valid SVG texts.
- When no block renders, the call throws `no blocks rendered`.
- `renderLatex` reads the input file with `readInput`, and then calls `renderLatexSource`.

Imports: `src/render-lib.ts`.

## src/render-dot.ts

Job: draws DOT source with the engine on the local machine.

```ts
export async function renderDotSource(
  source: string,
  output: string,
  format: "svg" | "png",
): Promise<{ bytes: number; warnings: string[] }>;
```

Behaviour:

- The function calls `render({ type: "dot", format, source }, engineConfig())` from `@danielsimonjr/sciengjs`.
- The function writes the output bytes with `writeOutput`.
- The function returns the byte count and the warnings of the engine.
- The function does not catch an engine error. The error reaches the caller unchanged.

Imports: `@danielsimonjr/sciengjs`, `src/render-lib.ts`, `src/engine-config.ts`.

## src/render-html.ts

Job: builds one HTML page from typed blocks. The page loads pinned CDN files when it opens.

```ts
export type BlockType = "mermaid" | "dot" | "latex" | "plotly" | "wavedrom" | "raw-html";

export interface HtmlBlock {
  type: BlockType;
  source: string;
  title?: string;
}

export function buildHtml(blocks: HtmlBlock[], title = "scieng playground"): string;
```

Block rules:

| Block type | Output in the page | Trust rule |
|---|---|---|
| `mermaid` | A `pre` element with class `mermaid`. | The source is HTML-escaped. |
| `dot` | A `div`, and a script that calls `Viz.instance()`. | The source is a JSON string in the script. `<` is written as the escape `\u003c`. |
| `latex` | A `div` with class `latex-block`. | The source is HTML-escaped. A source with `\[`, `$$` or `\begin{` is not wrapped. Any other source is wrapped in `\[` and `\]`. |
| `plotly` | A `div`, and a script that calls `Plotly.newPlot`. | The source must be JSON. `data` and `layout` are JSON values in the script. `<` is written as the escape `\u003c`. |
| `wavedrom` | A `div` with class `wavedrom-block` that holds a `script` element of type `WaveDrom`. | The source is verbatim. A source with `</script` in any letter case throws. |
| `raw-html` | The source itself. | The source is verbatim. The caller owns its safety. |

Pinned files:

| Block type | Host | Files | Version |
|---|---|---|---|
| `mermaid` | `cdn.jsdelivr.net` | `mermaid.min.js` | 11.16.0 |
| `dot` | `cdn.jsdelivr.net` | `viz-global.min.js` of `@viz-js/viz` | 3.28.0 |
| `latex` | `cdn.jsdelivr.net` | `katex.min.css`, `katex.min.js`, `contrib/auto-render.min.js` | 0.16.21 |
| `plotly` | `cdn.plot.ly` | `plotly-2.35.2.min.js` | 2.35.2 |
| `wavedrom` | `cdnjs.cloudflare.com` | `skins/default.js`, `wavedrom.min.js` | 3.1.0 |

Behaviour:

- Each pinned file has an `integrity` attribute with a sha384 hash. Each one also has `crossorigin="anonymous"`.
- The page holds only the files of the block types that it uses.
- The page holds one initialization script for each block type that needs one. The mermaid script starts the dark theme. The wavedrom script calls `WaveDrom.ProcessAll` on load. The latex script calls the KaTeX auto-render function with delimiters for the environments that a block may hold.
- A block with a `title` becomes a `section` with an `h2` heading.
- The page title is HTML-escaped.
- `buildHtml` throws `buildHtml needs at least one block` for an empty list.
- `buildHtml` throws for a `plotly` source that is not valid JSON.

Imports: none from `src/`.

## src/ooxml-edit.ts

Job: replaces text in the runs of an unpacked `word/document.xml`.

```ts
export function assertNoDoctype(xml: string): void;

export function replaceInRuns(
  xml: string,
  search: string,
  replacement: string,
  preserveSpace: boolean,
): { xml: string; replaced: boolean };

export interface EditResult {
  find: string;
  replaced: boolean;
}

export function applyEdits(
  documentXmlPath: string,
  replacements: { find: string; replace: string }[],
  preserveSpace = true,
): { results: EditResult[]; replaced_count: number; written: boolean };
```

Behaviour:

- `assertNoDoctype` throws when the text holds `<!doctype` or `<!entity`, in any letter case.
- `replaceInRuns` finds the first `<w:r>` element whose text contains `search`. The text is the joined content of its `<w:t>` elements, read as XML text.
- `replaceInRuns` gives the whole text of that run the value `replacement`. The first `<w:t>` element takes the replacement. `replaceInRuns` empties the other `<w:t>` elements. The `<w:rPr>` element does not change.
- With `preserveSpace`, the first `<w:t>` element gets `xml:space="preserve"` when it lacks that attribute.
- `applyEdits` reads the file as UTF-8. `applyEdits` throws when the text holds a DOCTYPE or ENTITY declaration. `applyEdits` throws when the text holds no `<w:document` element.
- `applyEdits` applies each pair in order. `applyEdits` writes the file with `writeFileSync` only when at least one pair changes a run.

Known behaviour of the text match:

- `search` and `replacement` are XML text. An ampersand in the file is `&amp;`. A search for the plain character does not match `&amp;`.
- A `<w:tab/>` element in a run adds XML markup to the text that the search reads. A search for a tab character does not match.

Imports: `node:fs`.

## src/engine-config.ts

Job: sets the assets folder of the engine for a bundled run.

```ts
export function bundledEngineConfig(moduleUrl: string): Partial<SciengConfig>;

export function engineConfig(): Partial<SciengConfig>;
```

Behaviour:

- `bundledEngineConfig` returns `{ assetsUrl }`. The value is the URL of the `assets/` folder beside the module at `moduleUrl`.
- `engineConfig` returns the bundled configuration when the build constant `__SCIENG_BUNDLED__` is `true`. Otherwise `engineConfig` returns an empty object. The engine then uses its own assets folder.

Imports: the type `SciengConfig` from `@danielsimonjr/sciengjs`.

## Build constants

The build sets two constants. `scripts/bundle.mjs` defines them. `src/index.ts` reads `__PKG_VERSION__`. `src/engine-config.ts` reads `__SCIENG_BUNDLED__`. Each module checks the constant with `typeof` before it uses the value, so an unbundled run runs without the build.

## Verification

Generated 2026-11-03 by `repo-tools map`.
Regenerate: `repo-tools map . --out=docs/architecture` · Check: `repo-tools check . --docs=docs/architecture`

| Claim | Value | Source |
|---|---|---|
| totalSourceFiles | 25 | dependency-graph.json |
| runtimeCircularDeps | 0 | dependency-graph.json |
| typeOnlyCircularDeps | 0 | dependency-graph.json |
