---
description: Make one self-contained HTML page that holds several blocks (Mermaid, DOT, LaTeX, Plotly, WaveDrom, raw SVG or HTML), each with a heading.
argument-hint: "[--out <folder>] <description of the page and its blocks | paths to source files>"
---

Make an HTML playground page from: $ARGUMENTS

1. Load the `scieng` skill. Use the output rules of the skill. For each block type, read its reference: `MERMAID.md`, `GRAPHVIZ.md`, `LATEX.md`, or `SCIENG.md` for Plotly, WaveDrom and SVG circuits.
2. Read the arguments. `--out <folder>` sets the output folder. The rest describes the page and its blocks, or names source files (`.mmd`, `.dot`, `.tex`, `.json`, `.svg`). Find the block type of each file from its extension. Use `plotly` or `wavedrom` for a `.json` file from its content. When the type of a block is not clear, ask.
3. Write the source of each block. Follow the rules of the matching command. Compute plot points with code, as `/scieng-mcp:plot` does. Do not invent a part value, as `/scieng-mcp:circuit` does. Give each block a short heading.
4. Save each source in the output folder, with the page name as a prefix (`<name>-1.mmd`, `<name>-2.json`, and so on).
5. Call `render_html` with the blocks in order, the page title and `output_path` set to `<name>.html`. The tool adds only the CDN imports that the blocks need. Put into a `raw-html` block only content that you wrote. The page sends no source. The browser renders every block.
6. Check the result with the output rules of the skill.
7. Open the page in the browser. Give the full path of the page and of each source, and list the blocks with their types.
