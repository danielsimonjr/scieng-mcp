---
description: Draw a circuit schematic as an SVG file from the symbol library of the scieng skill, or with --tikz as a circuitikz picture in SVG, PNG or PDF.
argument-hint: "[--tikz] [--format svg|png|pdf] [--html] [--out <folder>] <description or netlist of the circuit>"
---

Draw a circuit schematic from: $ARGUMENTS

1. Load the `scieng` skill. Read the "SVG Circuit Schematics" section of `SCIENG.md` in its folder. The section gives the symbols, the wiring and the labels. Use the output rules of the skill.
2. Read the arguments. `--tikz` selects the TikZ route (step 8). `--format` sets the output of the TikZ route: `svg` (the default), `png` or `pdf`. `--html` also makes an HTML page. `--out <folder>` sets the output folder. The rest is a description or a netlist. When a part value or a connection is missing, ask for it and stop. Never invent a part value.
3. Write a netlist first: each part with its reference (R1, C1, U1), its value and its two or more nodes. Show the netlist in the answer.
4. Write one SVG document. Put the symbols in `<defs>`, and place each part with `<use>`. Draw the wires on a grid, with right angles. Never draw a wire across a part. Route the wire around the symbol. Put a dot at each junction of three or more wires. Put the reference and the value next to each part. Put the inputs on the left and the outputs on the right. Use `currentColor` so the drawing works on a light and a dark background.
5. Save it as `<name>.svg` in the output folder with the Write tool. Check that the file parses as XML and starts with `<svg` or `<?xml`. Check that every part of the netlist has a symbol and every node of the netlist has a wire.
6. With `--html`: call `render_html` with one `raw-html` block that holds the SVG, the title and `output_path` set to `<name>.html`. Put only the SVG that you wrote into the block.
7. Give the full path of each file. Open the page in the browser when you made one.
8. With `--tikz`, do steps 1 to 3, then do these steps instead of steps 4 to 7:
   - Write one `circuitikz` environment from the netlist. Use the circuitikz names of the parts (`R`, `C`, `L`, `V`, `I`, `op amp`, `npn`, `ground`). Put the reference and the value in the label of each part, for example `l=$R_1$` and `a=10\,k$\Omega$`.
   - Save the source as `<name>.tex` in the output folder.
   - Call `render` with `type` set to `tikz`, `input_path` set to the `.tex` file and `output_path` set to `<name>.<format>`.
   - Read the result and handle the error codes as `/scieng-mcp:tikz` does. The first render downloads the TeX bundles (about 10 MB) into the cache.
   - Give the full path of the source and the output.
