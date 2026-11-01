---
description: Draw a circuit schematic as an SVG file from the symbol library of the scieng skill (resistors, capacitors, op-amps, transistors, sources, ground).
argument-hint: "[--html] [--out <folder>] <description or netlist of the circuit>"
---

Draw a circuit schematic from: $ARGUMENTS

1. Load the `scieng` skill. Read the "SVG Circuit Schematics" section of `SCIENG.md` in its folder. The section gives the symbols, the wiring and the labels. Use the output rules of the skill.
2. Read the arguments. `--html` also makes an HTML page. `--out <folder>` sets the output folder. The rest is a description or a netlist. When a part value or a connection is missing, ask for it and stop. Never invent a part value.
3. Write a netlist first: each part with its reference (R1, C1, U1), its value and its two or more nodes. Show the netlist in the answer.
4. Write one SVG document. Put the symbols in `<defs>`, and place each part with `<use>`. Draw the wires on a grid, with right angles. Never draw a wire across a part. Route the wire around the symbol. Put a dot at each junction of three or more wires. Put the reference and the value next to each part. Put the inputs on the left and the outputs on the right. Use `currentColor` so the drawing works on a light and a dark background.
5. Save it as `<name>.svg` in the output folder with the Write tool. Check that the file parses as XML and starts with `<svg` or `<?xml`. Check that every part of the netlist has a symbol and every node of the netlist has a wire.
6. With `--html`: call `render_html` with one `raw-html` block that holds the SVG, the title and `output_path` set to `<name>.html`. Put only the SVG that you wrote into the block.
7. Give the full path of each file. Open the page in the browser when you made one.
