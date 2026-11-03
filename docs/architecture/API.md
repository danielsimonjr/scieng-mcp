# scieng-mcp API

This document describes the public surface of the server. The surface holds six MCP tools. Each tool has a name, arguments, a result and error results. The module exports are internal to the repository. The package exports nothing. [COMPONENTS.md](COMPONENTS.md) describes each module. [DATAFLOW.md](DATAFLOW.md) traces each call.

## Transport

- The server speaks the Model Context Protocol over standard input and standard output.
- The protocol methods are `tools/list` and `tools/call`.
- The server reports the name `scieng-mcp` and its version.
- The plugin starts the server with `node` and the bundle. [plugin/.mcp.json](../../plugin/.mcp.json) gives the start command.

## Tools

| Tool | Writes | Reads | Remote service | Annotations |
|---|---|---|---|---|
| `render_mermaid` | One SVG file | A source file, when `input_path` is given | `mermaid.ink` | Not read-only. Not destructive. |
| `render_dot` | One SVG or PNG file | A source file, when `input_path` is given | None | Not read-only. Not destructive. |
| `render_latex` | One SVG file | A source file, when `input_path` is given | `latex.codecogs.com` | Not read-only. Not destructive. |
| `render_html` | One HTML file | None | None | Not read-only. Not destructive. |
| `ooxml_replace` | `word/document.xml`, in place | `word/document.xml` | None | Not read-only. Destructive. |
| `capabilities` | Nothing | Nothing | None | Read-only. Not destructive. |

### Arguments of the render tools

`render_mermaid`, `render_dot` and `render_latex` share these arguments. A key that is not in this list fails the call.

| Argument | Type | Rule |
|---|---|---|
| `source` | string | Inline source text. Give exactly one of `source` and `input_path`. |
| `input_path` | string | Path to a source file of at most 524288 bytes. Give exactly one of `source` and `input_path`. |
| `output_path` | string | Path of the output file. Required with `source`. With `input_path`, the default is the input path with the output extension, in the same folder. |

### render_mermaid

- Purpose: renders Mermaid source to an SVG file through mermaid.ink.
- Arguments: the shared render arguments.
- Result: `{"path": string, "bytes": number}`. The `bytes` value is the UTF-8 byte count of the SVG.
- Errors: an argument error, `input too large`, an HTTP error from the service, `no SVG in response`, or the network error of the last attempt.

### render_dot

- Purpose: renders Graphviz DOT source to an SVG or PNG file on the local machine. The tool makes no network request.
- Arguments: the shared render arguments, and `format`. The value of `format` is `svg` or `png`. The default is `svg`. With `input_path`, the output extension follows the format.
- Result: `{"path": string, "bytes": number, "warnings": string[]}`. The engine gives one warning for each `image` or `stylesheet` attribute that the engine removes. Each warning names the line of the attribute.
- Errors: an argument error, `input too large`, or an engine error. An engine error has the fields listed in [Error results](#error-results).

### render_latex

- Purpose: renders LaTeX math, or the math blocks of a LaTeX document, to an SVG file through latex.codecogs.com.
- Arguments: the shared render arguments, and `dpi`. The value of `dpi` is a number. The default is 200.
- Result: `{"path": string, "bytes": number, "failures": [{"index": number, "label": string, "message": string}]}`. A block that fails appears in `failures`. The call does not fail for one failed block. The `failures` list holds the failures in completion order. Each entry keeps the block index.
- Errors: an argument error, `input too large`, or `no blocks rendered`, which means that every block failed.

### render_html

- Purpose: builds one self-contained HTML page from typed blocks.
- Arguments:

| Argument | Type | Rule |
|---|---|---|
| `blocks` | array | One or more objects. Each object holds `type`, `source` and an optional `title`. No other key is allowed. |
| `title` | string | The page title. The default is `scieng playground`. |
| `output_path` | string | Required. The output path of the HTML file. |

- Block types: `mermaid`, `dot`, `latex`, `plotly`, `wavedrom` and `raw-html`. The rules of each type are in [COMPONENTS.md](COMPONENTS.md). A `plotly` source is a JSON object with `data` and `layout`. A `raw-html` source passes through unchanged.
- Result: `{"path": string, "bytes": number}`.
- Errors: an argument error, a `plotly` source that is not valid JSON, or a `wavedrom` source that holds `</script`.

### ooxml_replace

- Purpose: replaces text in the runs of an unpacked Word document, and keeps the run formatting.
- Arguments:

| Argument | Type | Rule |
|---|---|---|
| `document_xml_path` | string | Required. Path to the unpacked `word/document.xml`. |
| `replacements` | array | One or more objects. Each object holds `find` and `replace`. The values of `find` and `replace` are strings. No other key is allowed. |
| `preserve_space` | boolean | Adds `xml:space="preserve"` to the edited text. The default is `true`. |

- Matching rules:
  - Each pair changes the first run whose text contains `find`.
  - The whole text of that run becomes `replace`. Other text in the run is removed.
  - The run formatting, which is the `<w:rPr>` element, does not change.
  - `find` and `replace` are XML text. An ampersand is `&amp;`, a less-than sign is `&lt;`, and a greater-than sign is `&gt;`.
  - A `<w:tab/>` element adds XML markup to the text that the search reads. A search for a tab character does not match.
  - Each pair works on the file as the earlier pairs left it.
- Result: `{"results": [{"find": string, "replaced": boolean}], "replaced_count": number, "written": boolean}`. The file is written only when `replaced_count` is greater than zero. The result holds no `path`.
- Errors: an argument error, a DOCTYPE or ENTITY declaration in the file, a file with no `<w:document>` element, or a file that cannot be read.

### capabilities

- Purpose: lists the input and output pairs of the local engine, with the stage and the readiness of each pair.
- Arguments: none. The handler reads no argument, and it accepts any argument that the client sends.
- Result: `{"capabilities": [...]}`. Each entry holds `type`, `format`, `stage` and `ready`. An entry that is not ready also holds `reason`. The engine defines the set of entries.

## Error results

An error result has `isError` set to `true`. Its text is a JSON object with `status` set to `error`.

| Field | Present | Content |
|---|---|---|
| `status` | Always | The value `error`. |
| `error` | Always | The message. |
| `code` | For an engine error | The engine error code. |
| `line` | For an engine error with a line | The line of the error in the source. |
| `column` | For an engine error with a column | The column of the error in the source. |

An unknown tool name gives the message `unknown tool '<name>'`. An argument error gives a message that holds the list of schema issues as JSON text.

The engine defines these error codes. The descriptions follow the code names.

| Code | Description |
|---|---|
| `E_INPUT` | The source is not valid for the engine. |
| `E_UNSUPPORTED` | The engine does not support the pair of type and format. |
| `E_LIMIT` | A size or count exceeds its limit. |
| `E_TIMEOUT` | The engine call runs past its time limit. |
| `E_STAGE_MISSING` | A stage that the pair needs is not available. |
| `E_CONFIG` | The engine configuration is not valid. |
| `E_INTEGRITY` | An engine file fails its integrity check. |
| `E_INTERNAL` | The engine fails internally. The error message names the engine. |

## Module exports

Each table lists every export of a module in `src/`. The modules export 30 declarations in total.

### src/tools.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `ToolHandler` | Type | `(raw: unknown) => Promise<string>` | The handler of one tool. The handler returns the JSON text of the result. |
| `ToolResult` | Interface | `{ content, isError? }` | The MCP result of a tool call. |
| `dispatchTool` | Function | `(handlers, name, args) => Promise<ToolResult>` | Runs the named handler and returns the MCP result. |
| `TOOLS` | Constant | `Tool[]` | The six tool definitions. |
| `makeHandlers` | Function | `(fetchImpl?) => Record<string, ToolHandler>` | Returns one handler for each tool name. |

### src/render-lib.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `FetchLike` | Type | `typeof fetch` | The type of a fetch function. |
| `HttpOptions` | Interface | `{ method?, body?, headers?, timeoutMs?, retries?, fetchImpl? }` | The options of `httpText`. |
| `httpText` | Function | `(url, opts?) => Promise<string>` | Sends a request with retries. Returns the body text. |
| `readInput` | Function | `(path, maxBytes?) => string` | Reads a UTF-8 file of at most `maxBytes` bytes. |
| `deriveOutputPath` | Function | `(input, ext?) => string` | Returns the input path with its extension replaced. |
| `writeOutput` | Function | `(path, content) => void` | Writes a file through a temporary file, then renames the temporary file. |
| `mapLimit` | Function | `(items, limit, fn) => Promise<R[]>` | Runs `fn` on each item with a limit on the calls at the same time. |

### src/render-latex.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `Block` | Interface | `{ label, tex }` | One block of LaTeX source. |
| `extractBlocks` | Function | `(texSource) => Block[]` | Splits LaTeX source into blocks. |
| `combineSvgs` | Function | `(svgs) => string` | Stacks SVG images in one SVG document. |
| `renderLatexSource` | Function | `(texSource, output, opts?) => Promise<{ svg, failures }>` | Renders the blocks and writes the SVG. |
| `renderLatex` | Function | `(input, output, opts?) => Promise<string>` | Reads a file, renders it, and returns the SVG text. |

### src/render-mermaid.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `encodePako` | Function | `(mermaidCode) => string` | Returns the deflated and base64url-encoded Mermaid JSON. |
| `renderMermaidSource` | Function | `(code, output, fetchImpl?) => Promise<string>` | Renders Mermaid source and writes the SVG. |
| `renderMermaid` | Function | `(input, output, fetchImpl?) => Promise<string>` | Reads a file, renders it, and returns the SVG text. |

### src/render-dot.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `renderDotSource` | Function | `(source, output, format) => Promise<{ bytes, warnings }>` | Draws DOT source with the engine and writes the file. |

### src/render-html.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `BlockType` | Type | Union of six strings | The kinds of block. |
| `HtmlBlock` | Interface | `{ type, source, title? }` | One block of a page. |
| `buildHtml` | Function | `(blocks, title?) => string` | Builds one HTML page from the blocks. |

### src/ooxml-edit.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `assertNoDoctype` | Function | `(xml) => void` | Throws when the text holds a DOCTYPE or ENTITY declaration. |
| `replaceInRuns` | Function | `(xml, search, replacement, preserveSpace) => { xml, replaced }` | Replaces the text of the first matching run. |
| `EditResult` | Interface | `{ find, replaced }` | The result of one find pair. |
| `applyEdits` | Function | `(documentXmlPath, replacements, preserveSpace?) => { results, replaced_count, written }` | Applies the pairs to a file, in place. |

### src/engine-config.ts

| Export | Kind | Signature | Purpose |
|---|---|---|---|
| `bundledEngineConfig` | Function | `(moduleUrl) => Partial<SciengConfig>` | Returns the engine configuration with the assets folder beside a module. |
| `engineConfig` | Function | `() => Partial<SciengConfig>` | Returns the engine configuration for this run. |

### src/index.ts

The module exports nothing.

## Compatibility

- The tool names, the argument names and the result field names are the contract with each client. Renaming or removing a tool breaks each client that calls the tool.
- The module exports are internal. The package has no `exports` map. Its `main` file, `plugin/bundle/index.mjs`, exports nothing.

## Verification

Generated 2026-11-03 by `repo-tools map`.
Regenerate: `repo-tools map . --out=docs/architecture` · Check: `repo-tools check . --docs=docs/architecture`

| Claim | Value | Source |
|---|---|---|
| totalSourceFiles | 25 | dependency-graph.json |
| totalExports | 80 | dependency-graph.json |

The census counts 80 exports. Thirty are in `src/`. The other 50 are in two reference files of the skill, which the server does not load.
