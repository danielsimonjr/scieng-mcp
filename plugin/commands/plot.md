---
description: Make a Plotly chart (data plot, Bode, step response, root locus, pole-zero, FFT) as a local HTML page, or as a static SVG with --static, with every point computed by code.
argument-hint: "[--out <folder>] [--static] <chart description, a transfer function, or a path to a .csv or .json data file>"
---

Make a Plotly chart from: $ARGUMENTS

1. Load the `scieng` skill. Read the "Control Systems Plotting" and "Signal Processing Visualizations" sections of `SCIENG.md` and the Plotly section of `RENDERERS.md`. Use the output rules of the skill.
2. Read the arguments. `--out <folder>` sets the output folder. `--static` selects the SVG output. The rest is a description of the chart, a transfer function, or the path of a data file. When the chart needs data or a function that is not given, ask for it and stop.
3. Get the points:
   - From a data file: read the file. Keep its units and its column names.
   - From a transfer function or a formula: write a short script (Node or Python) that computes the points, and run it. A Bode plot uses a log frequency axis, magnitude in dB and phase in degrees, on two linked subplots. Mark the gain and phase margins when they exist. Never write a point by hand.
   - A transfer function may use the engine helpers of `@danielsimonjr/sciengjs/plot`: `bode`, `step`, `impulse`, `nyquist`, `poleZero` and `rootLocus`. Each returns the figure and the key numbers. Use the key numbers in your report.
   - Save the script next to the chart as `<name>.py` or `<name>.mjs`, so the numbers can be computed again.
4. Write the Plotly spec as JSON `{"data": [...], "layout": {...}}`. Give each axis a title with its unit. Use a log axis where the scale needs it. Give the main trace the one accent color. Save it as `<name>.json` in the output folder.
5. Choose the output:
   - Without `--static`, call `render_html` with one `plotly` block that holds the JSON, the title and `output_path` set to `<name>.html`. Plotly draws the chart in the browser. The page sends no data.
   - With `--static`, call `render` with `type` set to `plot`, `format` set to `svg`, the JSON as `source` and `output_path` set to `<name>.svg`. The engine draws the chart on this machine. No browser runs and no script loads.
6. Check the result with the output rules of the skill. `render_html` refuses a `plotly` source that is not valid JSON. `render` returns the engine error code when the spec is not valid.
7. Open the page or the SVG file. Give the full path of the script, the spec and the output. State the key numbers from the script output, for example the crossover frequency and the margins.
