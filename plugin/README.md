# scieng-mcp plugin

Diagram, math and engineering-document tools for Claude Code.

## Commands

| Command | Makes |
|---|---|
| `/scieng-mcp:mermaid` | a Mermaid diagram: flowchart, sequence, class, state, ER, gantt, mindmap, timeline |
| `/scieng-mcp:dot` | a Graphviz graph |
| `/scieng-mcp:latex` | LaTeX math |
| `/scieng-mcp:wavedrom` | a digital timing diagram |
| `/scieng-mcp:plot` | a Plotly chart: data, Bode, step response, pole-zero, FFT |
| `/scieng-mcp:circuit` | a circuit schematic as SVG |
| `/scieng-mcp:playground` | one HTML page with several blocks |

Give each command a description or the path of a source file. Example:

```
/scieng-mcp:mermaid a sequence diagram of an OAuth login with a browser, an app and an identity provider
/scieng-mcp:dot --local the module graph of src/
/scieng-mcp:plot the Bode plot of G(s) = 10 / (s (s + 1) (s + 10))
```

## Where the source goes

- `mermaid` renders the source on your machine, with the sciengjs engine, and saves an SVG file. Class, state and sequence diagrams need no browser. Other diagram types need `SCIENG_BROWSER`. Add `--local` to make an HTML page that renders in your browser.
- `latex` draws the source on your machine through the sciengjs engine and saves an SVG file. Add `--local` to make an HTML page that renders in your browser.
- `dot` renders the graph on your machine, with the Graphviz engine, and saves an SVG file. Add `--local` to make an HTML page that renders in your browser.
- `wavedrom`, `plot`, `circuit` and `playground` always run on your machine. A page loads its renderer from a CDN, with a pinned version and an integrity hash.

## Output

Files go to the `--out` folder, else the folder in `SCIENG_OUT_DIR`, else `./diagrams`. Each output keeps its source file next to it. A command never overwrites a file.

The `scieng` skill holds the syntax references and the rules that the commands use.

## Requirements

The plugin needs Node.js 24 or later. The engine declares Node.js 22 or later. The repository tests the plugin on Node.js 24.

## Limits

- An inline `source` must fit in a request line of less than 10,485,760 bytes (10 MiB), not counting the line feed. The JSON escaping of the source counts in the line. A request line of 10,485,760 bytes or more, not counting the line feed, makes the server stop answering requests. The server writes `scieng-mcp: ReadBuffer exceeded maximum size of 10485760 bytes` to standard error. The process stays alive until the client closes standard input. The process then exits with code 0. The tool does not run.
- An `input_path` file must be 512 KiB (524,288 bytes) or smaller. A larger file gives an error that starts with `input too large`.

## Third-party assets

The bundle ships the engine assets in `plugin/bundle/assets/`. Each asset keeps the licence of its own project.

| Asset | Licence | Licence text |
|---|---|---|
| `fonts/LiberationSerif-Regular.ttf`: Liberation Serif Regular 2.1.5 | SIL Open Font License 1.1 | `fonts/LiberationSerif-Regular.LICENSE.txt` |
| `index_bg.wasm`: the WASM file of `@resvg/resvg-wasm` 2.6.2 (resvg, raster stage) | Mozilla Public License 2.0 (MPL-2.0) | `licenses/MPL-2.0.txt` |
| Graphviz, inside `@viz-js/viz` 3.31.0 (graph stage) | Eclipse Public License 2.0 (EPL-2.0) | `licenses/EPL-2.0.txt` |
| `@viz-js/viz` 3.31.0, the JavaScript wrapper | MIT | `licenses/MIT-viz-js.txt` |
| `mermaid.min.js`: the pinned Mermaid build, with the packages that it bundles | MIT, and the licences in the bundle text | `licenses/MIT-mermaid.txt`, `licenses/mermaid-bundle.txt` |
| `mermaid.min.js`: the pinned Mermaid build, with the packages that it bundles | MIT, and the licences in the bundle text | `licenses/MIT-mermaid.txt`, `licenses/mermaid-bundle.txt` |

The licence texts of the five rows are in `plugin/bundle/assets/`.
