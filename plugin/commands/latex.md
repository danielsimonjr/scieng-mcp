---
description: Render LaTeX math (an equation, an align block, or the equation blocks of a .tex file) as an SVG file, or as a local KaTeX page with --local.
argument-hint: "[--local] [--out <folder>] [--format svg|png|pdf] <equation or description | path to a .tex file>"
---

Render LaTeX math from: $ARGUMENTS

1. Load the `scieng` skill. Read `LATEX.md` in its folder. Use the output rules of the skill.
2. Read the arguments. `--local` selects the local page. `--out <folder>` sets the output folder. `--format <svg|png|pdf>` sets the output format (the default is svg). A png or pdf render takes one block. The rest is LaTeX, a description of an equation, or the path of a `.tex` file. When there is nothing to render, ask for it and stop.
3. Write the LaTeX. From a description, write the standard form of the equation and name each symbol in the answer. With a `.tex` file, the tool renders its `equation`, `align` and display blocks.
4. Save the source as `<name>.tex` in the output folder.
5. Render:
   - Default: call `render_latex` with `input_path` set to the `.tex` file, `output_path` set to `<name>.svg`, and `format` when it was given. The tool draws the source on this machine through the sciengjs engine. It makes no network request.
   - `--local`: call `render_html` with one `latex` block per equation, the title and `output_path` set to `<name>.html`. KaTeX renders the math in the browser. KaTeX does not support every package. For `\newcommand` across blocks, `\ce{}` or `\qty{}`, use the MathJax setup of `SCIENG.md` and write the page yourself.
6. Check the result with the output rules of the skill. Report each item of `failures` with its block. Correct the LaTeX from `LATEX.md` and render again. Stop after three tries and show the error.
7. Open an HTML page in the browser. Give the full path of the source and the output, and the renderer that you used.
