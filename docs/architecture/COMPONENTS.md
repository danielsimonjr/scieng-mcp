# scieng-mcp Components

This document describes the modules of `src/`. For each module, it gives the job, the exports with their signatures, the main internal parts, the imports, and the tests. The tool arguments and results are in [API.md](API.md). The steps of one tool call are in [DATAFLOW.md](DATAFLOW.md).

## Module map

| Module | Job | Exports | Imports from `src/` | Test file |
|---|---|---|---|---|
| `src/index.ts` | Starts the server on standard input and standard output. | 0 | `src/tools.ts` | None. The bundle gate starts the bundle. |
| `src/tools.ts` | Defines the seven tools. Checks the arguments and dispatches each call. | 5 | Every renderer, `src/render-lib.ts`, `src/engine-config.ts` | `test/tools.test.ts` |
| `src/render-lib.ts` | Shared helpers. HTTP with retries, bounded reads, output writes, output paths and a concurrency limit. | 7 | None | `test/render-lib.test.ts` |
| `src/render-mermaid.ts` | Renders Mermaid source to SVG, PNG or PDF through the sciengjs engine. | 3 | `@danielsimonjr/sciengjs`, `src/render-lib.ts`, `src/engine-config.ts` | `test/render-mermaid.test.ts` |
| `src/render-any.ts` | Renders any engine input type and output format. | 2 | `@danielsimonjr/sciengjs`, `src/render-lib.ts`, `src/engine-config.ts` | `test/render-any.test.ts` |
| `src/render-latex.ts` | Renders LaTeX source to SVG, PNG or PDF through the sciengjs engine. | 5 | `src/render-lib.ts` | `test/render-latex.test.ts` |
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

Job: defines the seven tools, checks their arguments, runs the handlers, and maps each failure to an error result.

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

export function makeHandlers(): Record<string, ToolHandler>;
```

Behaviour:

- `dispatchTool` checks the name with `Object.hasOwn`. An unknown name returns an error result. No handler runs.
- `dispatchTool` calls the handler with the arguments. A missing argument becomes an empty object.
- A successful handler returns its text in one text item of the result.
- A handler that throws writes one line to standard error. The result holds a JSON body with `status` set to `error`.
- `makeHandlers` returns one handler for each tool name.
- `TOOLS` holds the seven tool definitions. Each definition holds a name, a description, the annotations and the JSON Schema of its input. [API.md](API.md) lists the schemas.

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

Job: draws Mermaid source to SVG, PNG or PDF on this machine, through the sciengjs engine.

```ts
export const MERMAID_FORMATS: readonly ["svg", "png", "pdf"];
export type MermaidFormat = (typeof MERMAID_FORMATS)[number];
export async function renderMermaidSource(source: string, output: string, format: MermaidFormat): Promise<{ bytes: number; warnings: string[] }>;
```

Behaviour:

- `renderMermaidSource` calls the engine `render` with the Mermaid type, the format and the source. It writes the bytes with `writeOutput`, and returns the byte count and the engine warnings.
- Engine errors pass through unchanged. A diagram type that needs the browser stage rejects with `E_STAGE_MISSING` when `SCIENG_BROWSER` has no value.

Imports: `@danielsimonjr/sciengjs`, `src/render-lib.ts`, `src/engine-config.ts`.

## src/render-any.ts

Job: renders any input type and output format that the engine supports, and writes the file.

```ts
export interface AnyRenderResult { path: string; bytes: number; mime: string; backend: string; warnings: string[] }
export async function renderAny(type, format, source, output, options?): Promise<AnyRenderResult>;
```

Behaviour: calls the engine `render`. The pair decides the output. An unsupported pair rejects with `E_UNSUPPORTED`. The error passes through unchanged.

Imports: `@danielsimonjr/sciengjs`, `src/render-lib.ts`, `src/engine-config.ts`.

## src/render-latex.ts

Job: splits LaTeX source into blocks, renders each block through the sciengjs engine on this machine, and writes one SVG. A png or pdf render takes one block.

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
  opts: { format?: LatexFormat; scale?: number } = {},
): Promise<{ svg: string; bytes: number; failures: LatexFailure[] }>;

export async function renderLatex(
  input: string,
  output: string,
  opts: { format?: LatexFormat; scale?: number } = {},
): Promise<string>;
```

Behaviour:

- `extractBlocks` returns one block with the label `math` when the source has no `\documentclass` and no `\begin{document}`.
- For a document, `extractBlocks` returns one block for each `align`, `equation`, `gather`, `multline`, `array` or `cases` environment. `extractBlocks` includes the starred forms.
- `extractBlocks` also returns one block for each `\[ ... \]` display. The label of each display block is `display`.
- `extractBlocks` sorts all blocks by their position in the source.
- Each block gets the `\newcommand` and `\DeclareMathOperator` definitions of the preamble before its source.
- A document with no block returns one block with the label `document`.
- `combineSvgs` stacks the SVG images on a white rectangle. The function reads a width or a height only when the value is in single quotes. The default is 400 units for a width and 50 units for a height. The gap between images is 20 units only when the function reads each height. The width is the largest image width plus 40 units.
- `renderLatexSource` calls the sciengjs engine (`math` type) for each block. The `scale` option sets the scale of a png or pdf render.
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

Pinned files: the `HEAD_IMPORTS` constant in `src/render-html.ts` lists the pinned files, with each host, version and hash.

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
- `replaceInRuns` finds the first `<w:r>` element whose text contains `search`. The text is the joined decoded content of its `<w:t>` elements.
- `replaceInRuns` replaces only the matched text of that run with `replacement`. The text before and after the match keeps its place. The `<w:rPr>` element does not change. Other `<w:t>` elements that do not overlap the match keep their bytes.
- `replaceInRuns` writes `replacement` with `&`, `<` and `>` escaped. An empty `search` replaces nothing.
- A match does not cross a non-text child of the run, such as `<w:br/>`, `<w:tab/>` or `<w:cr/>`. Adjacent `<w:t>` elements with nothing between them match together.
- A rewritten `<w:t>` element is re-encoded. Entities such as `&quot;` and `&#160;` become characters. Other elements of the run keep their bytes.
- A numeric reference stays as written when XML 1.0 does not allow its character. The function does not throw.
- With `preserveSpace`, each rewritten `<w:t>` element that starts or ends with whitespace gets `xml:space="preserve"`, when it lacks that attribute.
- With `preserveSpace`, the `<w:t>` element that takes the replacement gets `xml:space="preserve"` when it lacks that attribute.
- `applyEdits` reads the file as UTF-8. `applyEdits` throws when the text holds a DOCTYPE or ENTITY declaration. `applyEdits` throws when the text holds no `<w:document` element.
- `applyEdits` applies each pair in order. `applyEdits` writes the file with `writeFileSync` only when at least one pair changes a run.

Known behaviour of the text match:

- `search` and `replacement` are plain text. The search reads the decoded text, so a search for `&` matches `&amp;` in the file.
- A `<w:tab/>` element is not a `<w:t>` element and adds no text. A search for a tab character does not match.

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
| totalSourceFiles | 31 | dependency-graph.json |
| runtimeCircularDeps | 0 | dependency-graph.json |
| typeOnlyCircularDeps | 0 | dependency-graph.json |
