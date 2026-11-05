---
description: Draw a TikZ picture locally (plain TikZ, circuitikz, tikz-cd, chemfig, mhchem, bussproofs) to an SVG file, a PNG image or a PDF file, through the TeX stage of the engine.
argument-hint: "[--format svg|png|pdf] [--out <folder>] <a description of the picture, or the path of a .tex file>"
---

Draw a TikZ picture from: $ARGUMENTS

1. Load the `scieng` skill. Use the output rules of the skill.
2. Read the arguments. `--format` sets the output: `svg` (the default), `png` or `pdf`. `--out <folder>` sets the output folder. The rest is a description of the picture, or the path of a `.tex` file. When the arguments hold no description and no path, ask for one and stop.
3. With a description, write one `tikzpicture` environment. You can also write one picture of a supported package: `circuitikz`, `tikzcd`, `\chemfig`, `\ce` of `mhchem`, or `prooftree`. Never invent a part value, a label or a bond that the description does not give. When a fact is missing, ask for it and stop.
   - Add `\usepackage` lines only for the supported packages: `tikz`, `circuitikz`, `xcolor`, `tikz-cd`, `tikz-3dplot`, `smartdiagram`, `chemfig`, `mhchem`, `bussproofs`, `amsmath`, `amssymb`. The `hobby` and `cd` TikZ libraries are supported.
   - The engine refuses a package with the GPL as its only licence. The error names the replacement. For `pgfplots`, use `/scieng-mcp:plot`. For `pgf-umlsd`, use a Mermaid sequence diagram. Others: `xy` (use `tikz-cd`), `esvect` (use `\vec` or `\overrightarrow`), `mathrsfs` (use `\mathscr` from `eucal`).
   - The text is English. Only the OT1 font encoding is bundled, so do not load `fontenc` with another encoding.
4. Save the source as `<name>.tex` in the output folder.
5. Call `render` with `type` set to `tikz` and the `format`. Set `input_path` to the `.tex` file. Set `output_path` to `<name>.<format>` in the output folder. For `png`, set `options.scale` when the user gives a size.
6. Read the tool result. A result with `"status":"error"` is a failure. Report its code.
   - `E_UNSUPPORTED`: the message names the package and its replacement. Change the source and render again.
   - `E_INPUT`: TeX stopped on an error. The message gives the TeX error and the line. Correct the source and render again. Stop after three tries.
   - `E_STAGE_MISSING`: the TeX bundles are not in the cache and the engine cannot download them. The first render downloads about 10 MB from the release of the engine into the cache folder (`SCIENG_CACHE_DIR`). Tell the user that the first render needs a network connection. As an alternative, `SCIENG_TEX_BUNDLE_URL` can name a local folder of the bundles. For `pdf`, the code also means that the configuration names no browser: name the `SCIENG_BROWSER` environment variable.
   - `E_INTEGRITY`: a downloaded bundle did not match its pinned hash. The engine deleted the file. Report the code and do not retry.
7. Check that the file exists and that its size is more than 0. An SVG file starts with `<svg` or `<?xml`. Give the full path of the source and the output, and the warnings of the result.
