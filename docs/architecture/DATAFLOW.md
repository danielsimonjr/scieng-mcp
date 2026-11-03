# scieng-mcp Data Flow

This document traces one tool call from the request to the result. This document names each step, each file that the call reads or writes, each network request, and each failure path. The tool arguments are in [API.md](API.md). The modules are described in [COMPONENTS.md](COMPONENTS.md).

## Common path

1. The client writes one JSON request line to standard input. The request method is `tools/call`. The request holds `name` and `arguments`.
2. The MCP SDK reads the line. A line of 10,485,760 bytes or more, not counting the line feed, makes the server stop answering requests. The server writes `scieng-mcp: ReadBuffer exceeded maximum size of 10485760 bytes` to standard error. The process stays alive until the client closes standard input. The process then exits with code 0. [plugin/README.md](../../plugin/README.md) states this limit.
3. The `tools/call` handler in `src/index.ts` passes `name` and `arguments` to `dispatchTool`.
4. `dispatchTool` checks that `name` is an own property of the handler table. An unknown name returns an error result at once. The error text is `unknown tool '<name>'`.
5. `dispatchTool` calls the handler with `arguments`. A missing argument becomes an empty object.
6. The handler checks its arguments with a strict schema. A key that the schema does not declare fails the call.
7. The handler does its work. The sections below list the work of each tool.
8. On success, `dispatchTool` returns one text item that holds the handler text.
9. On failure, `dispatchTool` writes one line to standard error. `dispatchTool` returns an error result with `isError` set to `true`.
10. The SDK writes one response line to standard output.

## Tool flows

### render_mermaid

1. `resolveRenderIo` checks the arguments. `resolveRenderIo` requires exactly one of `source` and `input_path`.
2. With `input_path`, `readInput` reads the file. A file of more than 524288 bytes fails with `input too large`.
3. The output path is `output_path`. Without `output_path`, the output path is the input path with the extension `.svg`.
4. `renderMermaidSource` builds the URL `https://mermaid.ink/svg/pako:<payload>`. The payload holds the source. The payload is deflated JSON in base64url form.
5. `httpText` sends a GET request with a timeout of 20000 ms. `httpText` retries as [ARCHITECTURE.md](ARCHITECTURE.md) states.
6. A response without `<svg` fails with `no SVG in response`.
7. `writeOutput` writes `<output>.tmp` and renames it to `<output>`.
8. The result is `{"path": <output>, "bytes": <UTF-8 byte count>}`.

### render_dot

1. The handler reads `format`. The value is `svg` or `png`. The default is `svg`. Another value fails the call.
2. `resolveRenderIo` works as in step 1 of `render_mermaid`. With `input_path`, the output extension is `.svg` or `.png`.
3. `renderDotSource` calls the engine with `render({ type: "dot", format, source }, engineConfig())`.
4. The engine starts a worker thread from its worker entry. In a bundled run, the entry is `plugin/bundle/entry.mjs`. The SVG backend lays out the graph with the viz library. The PNG backend uses the WASM file of the raster stage.
5. The engine removes each `image` and `stylesheet` attribute from the source. The engine returns one warning for each removal.
6. `writeOutput` writes the bytes.
7. The result is `{"path", "bytes", "warnings"}`.

This flow makes no network request.

### render_latex

1. The handler reads `dpi`. The value is a number. The default is 200.
2. `resolveRenderIo` works as in step 1 of `render_mermaid`.
3. `renderLatexSource` calls `extractBlocks`. The rules are in [COMPONENTS.md](COMPONENTS.md).
4. `mapLimit` sends each block with `httpText`. The URL is `https://latex.codecogs.com/svg.image?\dpi{<dpi>}<encoded block>`. At most four requests run at the same time.
5. A block fails when its request throws, or when its response has no `<svg`. The failure goes into `failures`. Each entry holds the block index, the label and the message.
6. When no block renders, the call fails with `no blocks rendered`.
7. When one block renders, its SVG is the output. When more blocks render, `combineSvgs` stacks them.
8. `writeOutput` writes the SVG.
9. The result is `{"path", "bytes", "failures"}`. The `failures` list holds the failures in completion order. Each entry keeps its block index.

### render_html

1. The handler checks the arguments with a strict schema. `blocks` holds one or more objects. Each object holds `type`, `source` and an optional `title`. `output_path` is required.
2. `buildHtml` builds the page. `buildHtml` throws for a `plotly` source that is not valid JSON. `buildHtml` throws for a `wavedrom` source that holds `</script`.
3. `writeOutput` writes the page.
4. The result is `{"path", "bytes"}`.

This flow makes no network request. The browser requests the pinned CDN files when the page opens.

### ooxml_replace

1. The handler checks `document_xml_path`, `replacements` and `preserve_space`. `replacements` holds one or more pairs.
2. `applyEdits` reads the file as UTF-8 text. The file has no size limit.
3. `assertNoDoctype` fails when the text holds a DOCTYPE or ENTITY declaration.
4. `applyEdits` fails when the text holds no `<w:document` element.
5. For each pair, in order, `replaceInRuns` changes the matched text of the first matching run. `replaceInRuns` reports whether a run changed.
6. `writeFileSync` writes the whole file in place when at least one pair changed a run. The write uses no temporary file.
7. The result is `{"results", "replaced_count", "written"}`. Each entry in `results` holds `find` and `replaced`. The result holds no `path`.

An interrupted write can leave a partly written `word/document.xml`.

### capabilities

1. The handler calls `capabilities(engineConfig())` from the engine.
2. The result is `{"capabilities": [...]}`. Each entry holds `type`, `format`, `stage` and `ready`. An entry that is not ready also holds `reason`.
3. The handler reads no argument. The handler accepts any argument that the client sends.

## Error results

An error result has the shape `{"content": [{"type": "text", "text": "<JSON body>"}], "isError": true}`.

The JSON body has these fields:

| Field | Present | Content |
|---|---|---|
| `status` | Always | The value `error`. |
| `error` | Always | The message. For an argument error, the message is the list of issues from the schema, as JSON text. |
| `code` | For an engine error | The engine error code. [API.md](API.md) lists the codes. |
| `line` | For an engine error with a line | The line of the error in the DOT source. |
| `column` | For an engine error with a column | The column of the error in the DOT source. |

For an engine error, the message has the form `[<code>] <engine message>`. For the code `E_INTERNAL`, the message names the engine: `sciengjs engine: <message>`.

For each handler error, `dispatchTool` writes one line to standard error. The line has the form `scieng-mcp: handler '<name>' threw: <message>`.

## Network requests

| Tool | Host | Path or query | Data sent | Attempts and timeout |
|---|---|---|---|---|
| `render_mermaid` | `mermaid.ink` | `/svg/pako:<payload>` | The Mermaid source, deflated and encoded. | Up to four attempts. 20000 ms for each attempt. |
| `render_latex` | `latex.codecogs.com` | `/svg.image?\dpi{<dpi>}<encoded block>` | The source of one LaTeX block. | Up to four attempts for each block. 20000 ms for each attempt. Four blocks at a time. |

No other tool sends a request. The browser requests the pinned files of a generated page when the page opens. The hosts are `cdn.jsdelivr.net`, `cdnjs.cloudflare.com` and `cdn.plot.ly`.

## File access

| Tool | Reads | Writes |
|---|---|---|
| `render_mermaid` | `input_path`, at most 524288 bytes | `output_path`, through `<output_path>.tmp` |
| `render_dot` | `input_path`, at most 524288 bytes | `output_path`, through `<output_path>.tmp` |
| `render_latex` | `input_path`, at most 524288 bytes | `output_path`, through `<output_path>.tmp` |
| `render_html` | None | `output_path`, through `<output_path>.tmp` |
| `ooxml_replace` | `document_xml_path`, with no size limit | `document_xml_path`, in place |
| `capabilities` | None | None |

## Timing

- A `render_mermaid` or `render_latex` request makes up to four attempts. Each attempt has a timeout of 20000 ms.
- The waits between attempts are 500 ms, 1000 ms and 2000 ms.
- A service that never answers makes the call fail after 83.5 seconds. The total is four timeouts of 20 seconds, plus the three waits.
- A body read that fails leaves its timer armed until the timer fires. The process does not exit before then.

## Verification

Generated 2026-11-03 by `repo-tools map`.
Regenerate: `repo-tools map . --out=docs/architecture` · Check: `repo-tools check . --docs=docs/architecture`

| Claim | Value | Source |
|---|---|---|
| totalSourceFiles | 27 | dependency-graph.json |
| runtimeCircularDeps | 0 | dependency-graph.json |
