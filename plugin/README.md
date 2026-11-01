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

- `mermaid`, `dot` and `latex` send the source to mermaid.ink, quickchart.io or latex.codecogs.com and save an SVG file. Add `--local` to make an HTML page that renders in your browser. The source then stays on your machine.
- `wavedrom`, `plot`, `circuit` and `playground` always run on your machine. A page loads its renderer from a CDN, with a pinned version and an integrity hash.

## Output

Files go to the `--out` folder, else the folder in `SCIENG_OUT_DIR`, else `./diagrams`. Each output keeps its source file next to it. A command never overwrites a file.

The `scieng` skill holds the syntax references and the rules that the commands use.
