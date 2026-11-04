---
description: Make a Mermaid diagram (flowchart, sequence, class, state, ER, gantt, mindmap, timeline) as an SVG file, or as a local HTML page with --local.
argument-hint: "[--local] [--out <folder>] <description | path to a .mmd file>"
---

Make a Mermaid diagram from: $ARGUMENTS

1. Load the `scieng` skill. Read `MERMAID.md` in its folder. Use the output rules of the skill.
2. Read the arguments. `--local` selects the local page. `--out <folder>` sets the output folder. The rest is a description of the diagram or the path of a `.mmd` file. When there is no description and no file, ask for one and stop.
3. Write the Mermaid source. Choose the diagram type that fits the description. With a `.mmd` file, use its text. Do not change a correct file.
4. Save the source as `<name>.mmd` in the output folder.
5. Render:
   - Default: call `render_mermaid` with `input_path` set to the `.mmd` file, `format` set to `svg` and `output_path` set to `<name>.svg`. The sciengjs engine renders the source locally, on this machine. Class, state and sequence diagrams need no browser. Other diagram types need the browser stage, which needs `SCIENG_BROWSER`. When the tool reports `E_STAGE_MISSING`, show the message. Then use `--local`.
   - `--local`: call `render_html` with one `mermaid` block, the title of the diagram and `output_path` set to `<name>.html`. The page loads the pinned Mermaid library from a CDN. The diagram source stays in the page.
6. Check the result with the output rules of the skill. On a Mermaid syntax error, correct the source from `MERMAID.md`, save it again and render again. Stop after three tries and show the error.
7. Open an HTML page in the browser. Give the full path of the source and the output, the diagram type, and the renderer that you used.
