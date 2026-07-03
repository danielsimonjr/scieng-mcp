# scieng-mcp

An MCP server providing science/engineering authoring tools: rendering diagram and
math sources (Mermaid, DOT, LaTeX) to SVG, assembling self-contained HTML
playgrounds from mixed content blocks, and applying run-preserving find/replace
edits to unpacked Word (OOXML) documents. It exposes five tools over stdio via
the Model Context Protocol.

## Tools

| Tool | Inputs | Behavior |
|---|---|---|
| `render_mermaid` | `source` \| `input_path`, `output_path` | Renders Mermaid diagram source to an SVG file via mermaid.ink. Returns `{path, bytes}`; never the SVG body. |
| `render_dot` | `source` \| `input_path`, `output_path` | Renders Graphviz DOT source to an SVG file via quickchart.io/graphviz. Returns `{path, bytes}`. |
| `render_latex` | `source` \| `input_path`, `output_path`, `dpi` | Renders LaTeX (bare math or a document's equation/align/display blocks) to an SVG file via latex.codecogs.com. Partial failures are reported in a `failures` array rather than thrown. Returns `{path, bytes, failures}`. |
| `render_html` | `blocks` (typed `mermaid`/`dot`/`latex`/`plotly`/`wavedrom`/`raw-html`), `title`, `output_path` | Assembles a self-contained HTML playground from the given blocks, emitting only the CDN imports the present block types require. `plotly` source must be JSON `{data, layout}`; `raw-html` passes through verbatim. Returns `{path, bytes}`. |
| `ooxml_replace` | `document_xml_path`, `replacements`, `preserve_space` | Run-preserving batch find/replace on an unpacked Word document's `word/document.xml`, leaving `<w:rPr>` formatting untouched. Replaces the first matching run per pair. Returns per-pair results and `replaced_count`. |

## Development

```bash
npm test          # run the unit + smoke test suite
npm run typecheck # tsc --noEmit
npm run bundle    # esbuild src/index.ts -> bundle/index.mjs
npm run smoke     # spawn the bundle, send an MCP initialize handshake, expect serverInfo
```

The committed `bundle/index.mjs` is what the plugin actually launches — after
changing anything under `src/`, re-run `npm run bundle` and commit the
regenerated bundle alongside the source change.

## Plugin install

Add the marketplace and enable the plugin:

```
/plugin marketplace add danielsimonjr/skills
```

Then enable `scieng-mcp` from the plugin list. The plugin also ships with the
`scieng` authoring skill, which guides Claude in using these tools together.
