# scieng-mcp Architecture

## System overview

The server turns source text into files. An MCP client starts the server as a child process. The client sends one JSON request for each tool call. The server runs the requested renderer or edit, writes its output file, and returns the path and the byte count of that file.

Four tools render diagram or formula source. Three of them draw on the local machine, through the sciengjs engine: render_mermaid, render and render_dot. The fourth, render_latex, sends the source to a public rendering service. One tool builds one HTML page from typed blocks. One tool edits the text of an unpacked Word document in place. A seventh tool reports the render pairs of the local engine. The server keeps no state between calls.

## System context

- **MCP client.** The client starts the server with `node` and the bundle. [plugin/.mcp.json](../../plugin/.mcp.json) defines the start. The client sends requests on standard input and reads responses on standard output.
- **sciengjs engine.** `render_mermaid` and `render` draw on this machine. No request leaves the process for them.
- **The sciengjs engine.** `render_latex` draws each LaTeX block on this machine. It makes no network request.
- **Local engine (`@danielsimonjr/sciengjs`).** `render_dot` and `capabilities` run the engine on this machine. The engine starts a worker thread from its worker entry. In the bundle, the entry is `plugin/bundle/entry.mjs`. `renderDotSource` makes no network request, and a unit test checks that.
- **File system.** The render tools read `input_path` files of at most 524288 bytes. `ooxml_replace` reads and writes the `word/document.xml` file of an unpacked document. Each tool writes its output at the path that the caller gives.
- **Browser and CDN hosts.** A generated page loads pinned scripts and styles from `cdn.jsdelivr.net`, `cdnjs.cloudflare.com` and `cdn.plot.ly` when the page opens. The server contacts none of these hosts.

## Architecture principles

1. Source text leaves the machine only for the remote renderer, LaTeX.
2. A render call writes one output file. The call returns the path and the size of the file, not its content.
3. A generated page loads only exact-version files. Each file carries a Subresource Integrity hash.
4. Each tool input object refuses an unknown key. The `capabilities` tool is the exception. The tool reads no input, and its handler accepts any argument.
5. The committed bundle is the shipped artifact. A source change and its bundle change share one commit. CI rejects a stale bundle.
6. The server needs no install step at run time. The bundle carries the engine assets that the engine reads.
7. A failed tool call does not end the session. The error travels in the tool result.
8. The remote renderer, LaTeX, takes an injectable fetch function. The tests replace the network through that function.

## Component architecture

The modules of `src/` form four layers. The table gives the imports of each layer. No test enforces this layering.

| Layer | Modules | Imports from `src/` |
|---|---|---|
| Transport | `src/index.ts` | `src/tools.ts` |
| Dispatch | `src/tools.ts` | Every renderer, `src/render-lib.ts` and `src/engine-config.ts` |
| Renderers and builders | `src/render-mermaid.ts`, `src/render-latex.ts`, `src/render-dot.ts`, `src/render-html.ts`, `src/ooxml-edit.ts` | `src/render-lib.ts` and `src/engine-config.ts`, where each module needs them. `src/render-html.ts` and `src/ooxml-edit.ts` import nothing from `src/`. |
| Utilities | `src/render-lib.ts`, `src/engine-config.ts` | None |

Every import points down the table. The census finds no import cycle among the 31 files. The tests and the smoke script import the modules directly. The tests and the smoke script stand outside the layers.

## Key design decisions

Each decision gives the choice, the reason for the choice, the cost of the choice, and the rejected alternative.

### D1. LaTeX uses a public rendering service

- **Decision.** `render_latex` draws each block through the sciengjs engine (`math` type), on this machine. Mermaid and DOT render the same way.
- **Rationale.** The server needs no renderer package for LaTeX. The service renders the source that the URL carries.
- **Trade-offs.** Each render needs network access. The source leaves the machine. The service sets the size and rate limits, and a service outage ends the render.
- **Alternative.** A local renderer for each format. The repository contains no local renderer for these formats.

### D2. DOT renders on the local machine

- **Decision.** `render_dot` draws the graph with the local engine. The DOT source does not leave the machine.
- **Rationale.** The repository gives privacy as a design goal for each command. The engine removes each `image` and `stylesheet` attribute from the source, and it reports a warning for each removal. The renderer therefore cannot load the image or the stylesheet that a source names. A unit test checks the removal of an `image` attribute.
- **Trade-offs.** The bundle carries the engine, its worker entry and its assets. The output depends on the engine version.
- **Alternative.** A remote DOT service sends the source off the machine.

### D3. The bundle is committed

- **Decision.** `plugin/bundle/` holds the build output. `scripts/bundle.mjs` writes the output. CI rebuilds the bundle and fails when the committed files differ from the build.
- **Rationale.** The repository guide records that the plugin installer runs a package install when the plugin folder holds both a package manifest and a lockfile. The plugin folder holds neither file. The server therefore runs from the committed bundle with no install step.
- **Trade-offs.** Each source change adds bundle changes to the same commit. The repository holds binary assets. `.gitattributes` keeps their bytes exact.
- **Alternative.** A package manifest and a lockfile in `plugin/`. The installer would then run a package install in the plugin folder.

### D4. Generated pages load pinned files with integrity hashes

- **Decision.** `buildHtml` writes each script and style URL with an exact version, an `integrity` attribute and `crossorigin="anonymous"`. The pins and the hashes are constants in `src/render-html.ts`.
- **Rationale.** A browser refuses a file whose bytes differ from the hash. A version range can resolve to a different file after a new release.
- **Trade-offs.** A version change needs a new hash in the same edit. The skill reference files show the same URLs without hashes. A reader who copies those URLs loads files that the page does not verify.
- **Alternative.** Floating version ranges, such as a major version alone. Rejected for the reason above.

### D5. Each block type has its own trust rule

| Block type | Rule | Reason |
|---|---|---|
| `mermaid`, `latex` | HTML-escaped text. | Mermaid and KaTeX read the text of the element. The HTML parser decodes the escaped text. |
| `dot`, `plotly` | A JSON value in a script. `<` is written as the escape `\u003c`. | Viz and Plotly read JavaScript values. The escape stops an embedded closing tag from ending the script early. |
| `wavedrom` | Verbatim text. The server refuses a source that contains `</script` in any letter case. | WaveDrom reads the text of its script element. Escaping would change the input that it reads. |
| `raw-html` | Verbatim text. | The caller owns this content. |

- **Trade-offs.** `raw-html` trusts the caller completely. The `wavedrom` refusal checks the closing tag only. The server does not check the WaveJSON text, and it passes the text on unchanged.
- **Alternative.** Escape every block. Escaping breaks the JavaScript input of `dot` and `plotly`, and the WaveJSON input of `wavedrom`.

### D6. Input objects refuse unknown keys

- **Decision.** Each tool input object refuses unknown keys. The zod schemas use `.strict()`. The JSON Schemas set `additionalProperties` to `false`.
- **Rationale.** A misspelled key would otherwise be ignored. For example, a misspelled `outputPath` with `input_path` would be ignored, and the default output path would apply without a message.
- **Trade-offs.** A client that sends an extra key fails the call. The `capabilities` tool takes no input. Its handler accepts any argument, which differs from the schema of that tool.
- **Alternative.** Ignore unknown keys. Rejected for the reason above.

### D7. The engine finds its assets from the bundle

- **Decision.** In the bundle, `engineConfig()` sets the assets URL to the `assets/` folder beside the module file. An unbundled run sets no assets URL, so the engine uses its own folder.
- **Rationale.** The plugin cache uses the version as its key. The folder that holds the bundle therefore changes with each version. A fixed path, or a path that depends on the working directory, would point at the wrong folder.
- **Trade-offs.** An unbundled run uses the engine's own assets folder. Its path differs from the shipped path. The bundle gate test covers the shipped path.
- **Alternative.** An environment variable or a working-directory path. Neither follows a folder that moves with the plugin.

### D8. The remote renderer retries only transient failures

- **Decision.** `httpText` retries a network error and the statuses 429, 500, 502, 503 and 504. `httpText` makes up to four attempts in total. The wait before each retry is 500 ms, doubled after each attempt. A retried status with a numeric `Retry-After` header waits for the number of seconds that the header gives.
- **Rationale.** These failures can clear within a short time. Other error statuses describe the request. A repeated request receives the same answer.
- **Trade-offs.** A service that does not answer costs four timeouts of 20 seconds each, plus the waits of 0.5, 1 and 2 seconds. The server does not retry a failure that occurs during the body read.
- **Alternative.** Retry every failure. Rejected for the reason above.

### D9. Tool failures travel in the result

- **Decision.** A handler error becomes a tool result with `isError` set. The result body is JSON with `status` set to `error`. The server writes one line to standard error, and the session continues.
- **Rationale.** The client needs the message to correct the request. An exception that ends the session would stop every later call.
- **Trade-offs.** Standard error is the only server log.
- **Alternative.** Throw the error to the transport layer. Rejected for the reason above.

### D10. Renderers write through a temporary file

- **Decision.** `writeOutput` writes `<output>.tmp` and renames the temporary file over the output path. The Word edit writes the document back to its own path in one call.
- **Rationale.** The rename replaces the output only after the new bytes exist. A reader of the output never sees a partly written file.
- **Trade-offs.** The Word edit does not use a temporary file. An interrupted write can leave a partly written `word/document.xml`. A failed rename leaves its temporary file in place.
- **Alternative.** Write the Word document through a temporary file as well.

## Data model

The server holds no data between calls. Each call reads its arguments, reads at most one input file, writes its output file, and returns a result. The types that carry data inside a call are listed in [COMPONENTS.md](COMPONENTS.md). The argument schema of each tool is in [API.md](API.md).

## Storage architecture

- **Output files.** The caller chooses each output path. The server writes to any path that the process may write. The server does not confine paths. The server creates no folder. A missing parent folder fails the call.
- **Temporary files.** `writeOutput` uses `<output>.tmp` in the output folder.
- **Input files.** The three render tools read `input_path` files of at most 524288 bytes. `ooxml_replace` reads `document_xml_path` with no size limit.
- **Bundle files.** `plugin/bundle/` holds 14 files. Nine are modules: `index.mjs`, `entry.mjs`, `graph/backend-svg.mjs`, `graph/backend-png.mjs`, and five more modules whose names carry a content hash. Five are engine assets under `assets/`: `index_bg.wasm`, the font `fonts/LiberationSerif-Regular.ttf`, its license file `fonts/LiberationSerif-Regular.LICENSE.txt`, and the license texts `licenses/EPL-2.0.txt` and `licenses/MPL-2.0.txt`. For the exact file names, see `plugin/bundle/`. The build in `scripts/bundle.mjs` writes these files.

## Build and packaging

The build runs in four steps.

1. Run `bun run bundle`. The script runs `node scripts/bundle.mjs`.
2. The script deletes `plugin/bundle/`. The script builds the four entry points with esbuild.
3. The script copies the engine's `assets` folder into `plugin/bundle/assets/`.
4. The script sets mode 0644 on each file that the script writes.

The esbuild options are as follows. The output is ESM for Node, with code splitting on and target `node20`. A banner defines `require`, `__filename` and `__dirname` for bundled CommonJS code. The build replaces `__PKG_VERSION__` with the `version` field of `package.json`, and it replaces `__SCIENG_BUNDLED__` with `true`. The build does not read the `version` field of the plugin manifest.

[`.gitattributes`](../../.gitattributes) keeps `.mjs` and `.txt` files as LF text, keeps `.wasm` and `.ttf` files as binary, and disables text conversion under `plugin/bundle/assets/`.

`plugin/.mcp.json` starts `node` with `${CLAUDE_PLUGIN_ROOT}/bundle/index.mjs` as its only argument. The plugin manifest `plugin/.claude-plugin/plugin.json` holds its own `version` field.

The package requires Node.js 24 or later. `package.json` names Bun as the package manager.

The continuous integration workflow in `.github/workflows/ci.yml` works as follows.

- The workflow runs on each push to `main` and on each pull request.
- The workflow runs on `ubuntu-latest` and on `windows-latest`.
- The workflow sets up Node.js 24 and the Bun version named in the file. The workflow installs with `bun install --frozen-lockfile`.
- The workflow rebuilds the bundle and fails when `plugin/bundle` differs from the committed files.
- The workflow runs the `typecheck`, `lint`, `test` and `build` scripts when a package defines them. This package defines `typecheck` and `test` only.
- The workflow imports `plugin/bundle/index.mjs` in Node. The step passes when the import completes without an error.

## Performance

- The server keeps no cache. Each call does its work again.
- The LaTeX renderer waits on the network. Each attempt has a timeout of 20 seconds. A request makes up to four attempts (D8).
- The LaTeX renderer sends up to four block requests at the same time.
- The Mermaid, DOT and generic renderers, the HTML builder and the Word edit make no network request.
- The 524288-byte limit bounds the size of an `input_path` file. A request line of 10,485,760 bytes or more, not counting the line feed, makes the server stop answering requests. The server writes `scieng-mcp: ReadBuffer exceeded maximum size of 10485760 bytes` to standard error. The process stays alive until the client closes standard input. The process then exits with code 0. [plugin/README.md](../../plugin/README.md) states the 10,485,760-byte limit.

## Security architecture

The server has five trust boundaries.

1. **Client to server.** Every argument is untrusted. The schemas check types and keys. The schemas do not check the content of a source.
2. **Remote service.** None for the render tools. The render tools make no network request. `render_html` pages load pinned CDN files, and they send no source.
3. **Generated page to CDN.** The pins and hashes (D4) limit the files that a browser loads.
4. **Generated page content.** The trust rule of each block type (D5) limits what the content can do.
5. **Server to the file system.** The server writes to any path that the process may write. The server confines no path.

The server source reads no environment variable. The remote service needs no key, and the requests carry none. The Word edit refuses a `DOCTYPE` or `ENTITY` declaration in `word/document.xml`. The source comment states that the port uses no entity-expanding parser. The refusal is therefore defense in depth.

## Testing strategy

- The test runner is `node --test`. `bun run test` starts the runner. Thirteen test files hold 149 test cases.
- The bundle gate starts the bundle with `scripts/block-network.mjs` preloaded. The preload refuses socket connections, DNS lookups and `fetch` calls, and it logs each attempt. The gate then renders SVG and PNG output, and it checks that the bundle sends no network request.
- The bundle gate runs the bundle in a fresh folder with no `node_modules`. The bundle gate compares each engine asset with the file in the engine package. On systems other than Windows, it checks that each bundle file has mode 0644.
- The other tests pass a fake fetch function to the LaTeX renderer.
- The plugin-content test checks that each command and the skill name only tools and reference files that exist.
- `bun run smoke` starts the bundle and sends an `initialize` request. CI does not run this script.
- `smoke/render.smoke.ts` calls the live services. No package script runs `smoke/render.smoke.ts`.
- The gaps are as follows. `src/index.ts` has no test file. No line-coverage tool runs.

## Verification

Generated 2026-11-03 by `repo-tools map`.
Regenerate: `repo-tools map . --out=docs/architecture` · Check: `repo-tools check . --docs=docs/architecture`

| Claim | Value | Source |
|---|---|---|
| totalSourceFiles | 31 | dependency-graph.json |
| runtimeCircularDeps | 0 | dependency-graph.json |
| typeOnlyCircularDeps | 0 | dependency-graph.json |
