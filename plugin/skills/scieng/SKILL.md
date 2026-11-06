---
name: scieng
description: "Write, fix and render science and engineering diagrams and documents. Diagrams: Mermaid (flowchart, sequence, class, state, ER, gantt, mindmap, timeline), Graphviz DOT, LaTeX math, WaveDrom timing, Plotly charts (Bode, step response, pole-zero, FFT) and SVG circuit schematics, as SVG files or self-contained HTML pages. Also LaTeX papers (algorithms, theorems, BibTeX, ACM, IEEE and NeurIPS classes, conversion to DOCX or PDF) and engineering Word documents (part numbers, revision and approval blocks, ATP and ESS procedures, MIL-STD warnings, SI units). Use when someone asks for a diagram, chart, timing diagram, schematic or equation image, when Mermaid, DOT or LaTeX gives a syntax or compile error, or when a technical paper or Word document needs its layout. Also TikZ pictures, SysML v2 views, CAD parts and STEP models, drawn on this machine. The commands /scieng-mcp:mermaid, dot, latex, wavedrom, plot, circuit, tikz, sysml, cad, step, markdown and playground run one type each."
---

# Science and engineering authoring

This skill writes correct diagram, math and document markup and renders it with the scieng-mcp tools. The tools render what you write. The tools do not correct the syntax. Read the syntax reference before you write the source.

`SKILL_DIR` below is the folder of this file.

## Commands

Each command makes one type of diagram from a description or from a source file.

| Command | Makes | Default output | Renderer |
|---|---|---|---|
| `/scieng-mcp:mermaid` | flowchart, sequence, class, state, ER, gantt, mindmap, timeline | SVG file through `render_mermaid` | sciengjs engine (local) |
| `/scieng-mcp:dot` | Graphviz graphs: clusters, record nodes, state machines | SVG file through `render_dot` | sciengjs engine (local) |
| `/scieng-mcp:latex` | equations and equation blocks | SVG file through `render_latex` | sciengjs engine (local) |
| `/scieng-mcp:wavedrom` | digital timing diagrams | HTML page through `render_html` | WaveDrom in the browser |
| `/scieng-mcp:plot` | data charts, Bode, step response, pole-zero, FFT | HTML page through `render_html`. With `--static`, an SVG file through `render` with `type` set to `plot` | Plotly in the browser. With `--static`, the sciengjs engine (local) |
| `/scieng-mcp:circuit` | circuit schematics | SVG file that the command writes; with `--tikz`, a circuitikz picture to SVG, PNG or PDF through `render` | none; sciengjs engine (local) with `--tikz` |
| `/scieng-mcp:tikz` | a TikZ picture (plain TikZ, circuitikz, tikz-cd, chemfig, mhchem, bussproofs) from a description or a `.tex` file | SVG file, PNG image or PDF file through `render` | sciengjs engine (local). The first render downloads the TeX bundles. PDF needs a browser |
| `/scieng-mcp:playground` | one page with several block types | HTML page through `render_html` | the browser |
| `/scieng-mcp:markdown` | Markdown from an HTML file or HTML text, with the images as files beside it | Markdown file through `html_to_markdown` | sciengjs engine (local) |
| `/scieng-mcp:sysml` | a SysML v2 model from a description or a `.sysml` file (block definition, internal block or requirements view) | SVG file, PNG image or PDF file through `render` | sciengjs engine (local). PDF needs a browser |
| `/scieng-mcp:cad` | a CAD part from a description or a CSG document in JSON (primitives, extrusions, booleans, transforms) | STL file, 3MF file, glb file, HTML viewer page or PNG image through `render` | sciengjs engine (local). PNG needs a browser |
| `/scieng-mcp:step` | a CAD model from a STEP, IGES or BREP file | HTML viewer page, glb file or PNG image through `render` | sciengjs engine (local). PNG needs a browser |

The default render of mermaid, dot and latex keeps the source on this machine. `--local` makes an HTML page that loads pinned CDN files and renders in the browser.

## Privacy

- `render_latex`, `render_mermaid` and `render_dot` render the source on this machine through the sciengjs engine. They make no network request. No source leaves the machine.
- Every tool call runs on this machine. The TeX stage downloads its bundles once, from the release of the engine, and sends no source.
- An HTML page from `render_html` loads its renderer from a CDN, with a pinned version and a Subresource Integrity hash. The page sends no diagram source. The browser renders it.
- `render_dot` removes each `image` and `stylesheet` attribute from the source. The result holds a warning for each attribute that it removes. Tell the user about each warning.

## Output

- The output folder is the `--out` path of the command, else the `SCIENG_OUT_DIR` environment variable, else `./diagrams` in the current folder. Create the folder when it does not exist.
- Name the output from the subject in kebab case, for example `login-sequence.svg`. Keep the source next to it, with the same name and the source extension (`.mmd`, `.dot`, `.tex`, `.json`).
- Never overwrite a file. When the name exists, add `-2`, `-3` and so on.
- After each render, read the tool result. A result with `"status":"error"` is a failure. Check that the file exists, that its size is more than 0, and that an SVG file starts with `<svg` or `<?xml`. For `render_latex`, an item in `failures` is a block that did not compile.
- Open an HTML page in the browser: `start <file>` on Windows, `open` on macOS, `xdg-open` on Linux. Give the full path of each file in the answer.

## References

Read the reference for the type before you write the source.

| Need | Reference |
|---|---|
| Mermaid syntax and the errors that it gives | `MERMAID.md` |
| DOT syntax, layout engines and HTML labels | `GRAPHVIZ.md` |
| LaTeX for papers: algorithms, theorems, BibTeX, classes, conversion | `LATEX.md` |
| CDN imports, version pins, Chart.js, D3, Three.js, Highlight.js | `RENDERERS.md` |
| WaveDrom, Bode and other plots, SVG circuits, SI units, MathJax engineering setup | `SCIENG.md` |
| Engineering Word documents (invoke `document-skills:docx` first) | `ENGINEERING-DOCX.md` |
| The structure of CS and scientific papers | `PAPERS.md` |
| The reason for the HTML playground pattern | `Claude Code HTML Playground.md` |

## Other tools

- `render_html` takes typed blocks: `mermaid`, `dot`, `latex`, `plotly`, `wavedrom` and `raw-html`. The tool adds only the CDN imports that the blocks need. A `plotly` block is JSON `{"data": [...], "layout": {...}}`. A `plotly` block can set `static` to true. Then the engine draws the figure as inline SVG on this machine. The page does not load a Plotly script for the figure. Only a `plotly` block can set `static`. For other block types, the tool returns the error E_INPUT. A `raw-html` block goes into the page as it is, so put only content that you wrote into it.
- For a page that needs custom JavaScript, Three.js or D3, write the HTML yourself from `RENDERERS.md`.
- `html_to_markdown` converts HTML to GitHub Flavored Markdown. It writes the assets beside the Markdown and never overwrites a file. The conversion runs locally. `download_images` fetches remote images only when the engine config allows images.
- `ooxml_replace` makes many find-and-replace edits in an unpacked `word/document.xml` and keeps the run formatting. For one edit, change the XML with the Edit tool. See `ENGINEERING-DOCX.md`.

## Rules

- Compute every number of a plot with code (a short script), not by hand. A Bode plot needs the real transfer function.
- A Mermaid diagram that is added to a page after load needs `mermaid.run({ querySelector: '.mermaid' })`, not `startOnLoad`.
- `Viz.instance()` is asynchronous. Use `.then()` or `await`.
- Use `\(...\)` for inline math when the text holds a dollar amount.
- Three.js r128 has no `CapsuleGeometry` and no `OrbitControls`.

## When not to use

- The answer is plain text and needs no picture.
- The user has a local pipeline (a LaTeX install, the Mermaid CLI) and wants to use it.
- A fenced code block in the answer is enough.
