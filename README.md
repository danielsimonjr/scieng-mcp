# scieng-mcp

scieng-mcp is an MCP server for science and engineering authoring. scieng-mcp exposes six tools over stdio through the Model Context Protocol. The tools render diagram and math sources (Mermaid, DOT, LaTeX) to SVG. The tools assemble self-contained HTML playgrounds from mixed content blocks. The tools apply run-preserving find and replace edits to unpacked Word (OOXML) documents.

## Tools

| Tool | Inputs | Behavior |
|---|---|---|
| `render_mermaid` | `source` \| `input_path`, `output_path` | Renders Mermaid diagram source to an SVG file via mermaid.ink. Returns `{path, bytes}`; never the SVG body. |
| `render_dot` | `source` \| `input_path`, `output_path`, `format` | Renders Graphviz DOT source to an SVG file (`format` `svg`, the default) or a PNG file (`format` `png`) on this machine, with the sciengjs engine. Returns `{path, bytes, warnings}`. |
| `render_latex` | `source` \| `input_path`, `output_path`, `dpi` | Renders LaTeX (bare math or a document's equation/align/display blocks) to an SVG file via latex.codecogs.com. Partial failures are reported in a `failures` array rather than thrown. Returns `{path, bytes, failures}`. |
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

## Plugin install

Add the marketplace and enable the plugin:

```
/plugin marketplace add danielsimonjr/skills
```

Then enable `scieng-mcp` from the plugin list. The plugin also ships with the
`scieng` authoring skill, which guides Claude in using these tools together.
