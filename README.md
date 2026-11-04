# scieng-mcp

scieng-mcp is an MCP server for science and engineering authoring. scieng-mcp exposes seven tools over stdio through the Model Context Protocol. The tools render diagram and math sources (Mermaid, DOT, LaTeX) to SVG. The tools assemble self-contained HTML playgrounds from mixed content blocks. The tools apply run-preserving find and replace edits to unpacked Word (OOXML) documents.

## Tools

| Tool | Inputs | Behavior |
|---|---|---|
| `render_mermaid` | `source` \| `input_path`, `output_path`, `format` | Renders Mermaid diagram source to an SVG file (`format` `svg`, the default), a PNG file or a PDF file on this machine, with the sciengjs engine. Class, state and sequence diagrams need no browser; other types need `SCIENG_BROWSER`. Returns `{path, bytes, warnings}`. |
| `render` | `type`, `format`, `options`, `source` \| `input_path`, `output_path` | Renders any input type and output format that the local engine supports. Returns `{path, bytes, mime, backend, warnings}`. An engine error returns its code. |
| `render_dot` | `source` \| `input_path`, `output_path`, `format` | Renders Graphviz DOT source to an SVG file (`format` `svg`, the default) or a PNG file (`format` `png`) on this machine, with the sciengjs engine. Returns `{path, bytes, warnings}`. |
| `render_latex` | `source` \| `input_path`, `output_path`, `format`, `scale`, `dpi` (deprecated) | Renders LaTeX (bare math or a document's equation/align/display blocks) to an SVG, PNG or PDF file, drawn on this machine by the sciengjs engine. A PNG or PDF takes one block. `scale` applies to png only. `dpi` is a deprecated alias: for png with no `scale`, the scale is `dpi`/100. For png or pdf, an `output_path` that ends in `.svg` gets the new extension. The tool keeps any other extension. The tool reports partial failures in a `failures` array instead of throwing them. Returns `{path, bytes, failures, warnings}`. |
| `render_html` | `blocks` (typed `mermaid`/`dot`/`latex`/`plotly`/`wavedrom`/`raw-html`), `title`, `output_path` | Assembles a self-contained HTML playground from the given blocks, emitting only the CDN imports the present block types require. `plotly` source must be JSON `{data, layout}`; `raw-html` passes through verbatim. Returns `{path, bytes}`. |
| `ooxml_replace` | `document_xml_path`, `replacements`, `preserve_space` | Run-preserving batch find/replace on an unpacked Word document's `word/document.xml`, leaving `<w:rPr>` formatting untouched. Replaces the first matching run per pair. Returns per-pair results and `replaced_count`. |
| `capabilities` | none | Lists the render pairs of the engine (type and format, for example `dot` and `svg`) with the stage and the readiness of each pair. Read-only. Returns `{capabilities}`. |

## Commands

The plugin adds one slash command per diagram type: `/scieng-mcp:mermaid`, `dot`, `latex`, `wavedrom`, `plot`, `circuit` and `playground`. `plugin/README.md` gives the arguments and tells where each command sends its source.

## Development

```bash
bun run test      # unit tests and plugin-content tests
bun run typecheck # tsc --noEmit
bun run bundle    # writes plugin/bundle/ (index.mjs, the engine worker, its backends, assets/)
bun run smoke     # spawn the bundle, send an MCP initialize handshake, expect serverInfo
```

The committed `plugin/bundle/` folder is what the plugin actually launches. After changing anything under `src/`, re-run `bun run bundle`. Commit the regenerated files alongside the source change.

## Quick Start

1. Add the marketplace in Claude Code:

   ```
   /plugin marketplace add danielsimonjr/skills
   ```

2. Enable `scieng-mcp` in the plugin list.
3. Run one command. Example:

   ```
   /scieng-mcp:mermaid a sequence diagram of an OAuth login with a browser, an app and an identity provider
   ```

The command writes an SVG file to `./diagrams`. `plugin/README.md` lists the other commands and their arguments.

## Plugin install

Add the marketplace and enable the plugin, as in Quick Start. The plugin also ships with the
`scieng` authoring skill, which guides Claude in using these tools together.

## License

The MIT License applies to scieng-mcp. See [LICENSE](LICENSE).

The bundled engine assets keep the licence of their own projects. The Third-party assets table in `plugin/README.md` lists each asset and its licence.

## Documentation

The architecture documents are in `docs/architecture/`. Each of the five hand-written documents ends with a `## Verification` block. The `repo-tools check` command compares the numbers in that block with the code.

| Document | Content |
|---|---|
| [OVERVIEW.md](docs/architecture/OVERVIEW.md) | The purpose, the layout and the key numbers of the server. |
| [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | The design principles, the context and the key decisions. |
| [COMPONENTS.md](docs/architecture/COMPONENTS.md) | Each module, with its exported signatures. |
| [DATAFLOW.md](docs/architecture/DATAFLOW.md) | The path of one tool call, from the request to the result. |
| [API.md](docs/architecture/API.md) | The tools, their arguments and results, and the exports of each module. |
| [FILE_INVENTORY.md](docs/architecture/FILE_INVENTORY.md) | Each source file, with its disposition. |
| [TEST_COVERAGE.md](docs/architecture/TEST_COVERAGE.md) | The test files, and the source files that they cover. |
| [DEPENDENCY_GRAPH.md](docs/architecture/DEPENDENCY_GRAPH.md) | The dependency graph of the code files. |
| [unused-analysis.md](docs/architecture/unused-analysis.md) | The files and exports with no importer. |
| [duplicate-symbols.md](docs/architecture/duplicate-symbols.md) | The names that more than one file defines. |
| [CHANGELOG.md](CHANGELOG.md) | The changes, by version. |
| [CLAUDE.md](CLAUDE.md) | The instructions for Claude Code in this repository. |
| [AGENTS.md](AGENTS.md) | The rules for an agent that works in this repository. |
