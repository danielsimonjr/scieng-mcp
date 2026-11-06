---
description: Render a CAD file (STEP, IGES or BREP) locally to a glb model, an HTML viewer page with orbit, section planes and an exploded view, or a PNG image.
argument-hint: "[--format glb|html|png|dxf] [--z <height>] [--out <folder>] <path to a .step, .stp, .iges, .igs or .brep file>"
---

Render a CAD file from: $ARGUMENTS

1. Load the `scieng` skill. Use the output rules of the skill.
2. Read the arguments. `--format` sets the output: `html` (the default), `glb`, `png` or `dxf`. A `dxf` file is a 2D drawing in the X-Y plane, in millimetres: the outline seen from above. `--z <height>` gives the section at that height. Pass it as `options: { z: <height> }`. `--out <folder>` sets the output folder. The rest is the path of the CAD file. When there is no file, ask for one and stop.
3. Get the input type from the extension: `.step` and `.stp` are `step`, `.iges` and `.igs` are `iges`, `.brep` is `brep`. When the extension is not one of these, ask for the type.
4. Call `render` with `type`, `format`, `input_path` set to the file and `output_path` set to `<name>.<format>` in the output folder. A CAD file is bytes, so give `input_path`, never `source`. For `png`, set `options.width` and `options.height` when the user gives a size.
5. Read the tool result. A result with `"status":"error"` is a failure. Report its code. `E_STAGE_MISSING` for `png` means that no browser is set: name the `SCIENG_BROWSER` environment variable. `E_LIMIT` means that the file is larger than the engine limit.
6. Check that the file exists and that its size is more than 0. A `glb` file starts with `glTF`. A `png` file starts with the PNG signature.
7. Open an HTML page in the browser. Give the full path of the output and the warnings of the result.
