---
description: Make a WaveDrom digital timing diagram (clocks, buses, handshakes, edge annotations) as a local HTML page.
argument-hint: "[--out <folder>] <description of the signals | path to a WaveJSON .json file>"
---

Make a WaveDrom timing diagram from: $ARGUMENTS

1. Load the `scieng` skill. Read the "WaveDrom Timing Diagrams" section of `SCIENG.md` in its folder. Use the output rules of the skill.
2. Read the arguments. `--out <folder>` sets the output folder. The rest is a description of the signals or the path of a WaveJSON file. When there is no description and no file, ask for one and stop.
3. Write the WaveJSON. Use one `signal` entry per line and the `wave` characters from `SCIENG.md`. Add `data` labels for a bus, groups for related lines, and `edge` arrows for a timing relation. Give every line the same number of cycles. Get the cycle counts from the description, never from a guess. When a count is missing, ask.
4. Save the source as `<name>.json` in the output folder.
5. Call `render_html` with one `wavedrom` block that holds the WaveJSON, the title and `output_path` set to `<name>.html`. WaveDrom renders the diagram in the browser. The page sends no source.
6. Check the result with the output rules of the skill. `render_html` refuses a source that holds `</script`.
7. Open the page in the browser. Give the full path of the source and the page, and list each signal with its cycle count.
