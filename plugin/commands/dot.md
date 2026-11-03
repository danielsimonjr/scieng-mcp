---
description: Make a Graphviz DOT graph (clusters, record nodes, HTML labels, state machines) as an SVG file, or as a local HTML page with --local.
argument-hint: "[--local] [--out <folder>] <description | path to a .dot file>"
---

Make a Graphviz DOT graph from: $ARGUMENTS

1. Load the `scieng` skill. Read `GRAPHVIZ.md` in its folder. Use the output rules of the skill.
2. Read the arguments. `--local` selects the local page. `--out <folder>` sets the output folder. The rest is a description of the graph or the path of a `.dot` file. When there is no description and no file, ask for one and stop.
3. Write the DOT source. Use `digraph` for a directed graph and `graph` for an undirected graph. Choose `rankdir` and the layout engine from `GRAPHVIZ.md`. With a `.dot` file, use its text.
4. Save the source as `<name>.dot` in the output folder.
5. Render:
   - Default: call `render_dot` with `input_path` set to the `.dot` file and `output_path` set to `<name>.svg`. The tool renders the graph locally, with the Graphviz engine. No source leaves the machine. If the result holds a warning, report it in the answer.
   - `--local`: call `render_html` with one `dot` block, the title of the graph and `output_path` set to `<name>.html`. Viz.js renders the graph in the browser.
6. Check the result with the output rules of the skill. On a DOT syntax error, correct the source from `GRAPHVIZ.md`, save it again and render again. Stop after three tries and show the error.
7. Give the full path of the source and of the output, and the renderer that you used. For an HTML page, open it in the browser.
