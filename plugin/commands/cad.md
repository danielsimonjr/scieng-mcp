---
description: Build a CAD model from a CSG document (cubes, cylinders, spheres, extrusions, booleans, transforms) and render it locally to an STL file, a glb model, an HTML viewer page or a PNG image.
argument-hint: "[--format stl|glb|html|png] [--out <folder>] <a description of the part, or the path of a .json CAD document>"
---

Build a CAD model from: $ARGUMENTS

1. Load the `scieng` skill. Use the output rules of the skill.
2. Read the arguments. `--format` sets the output: `html` (the default), `stl`, `glb` or `png`. `--out <folder>` sets the output folder. The rest is a description of the part, or the path of a `.json` CAD document. When the arguments hold no description and no path, ask for one and stop.
3. With a description, write the CAD document. Never invent a dimension. When a dimension is missing, ask for it and stop.
   - The document is `{"version": 1, "model": <node>, "segments": <optional, 3 to 1024>}`.
   - Each node names its kind in the key `type`, for example `{"type": "cube", "size": [10, 10, 10]}`.
   - The primitives are `cube`, `cylinder`, `sphere` and `polyhedron`.
   - `cube` takes `size` and `center`. `sphere` takes `radius` and `segments`.
   - `cylinder` takes `height`, `center`, `segments`, and `radius` or both `radius1` and `radius2`.
   - `polyhedron` takes `points` and `faces`. Each face is counter-clockwise, seen from outside.
   - The 2D profiles are `rectangle` (`size`, `center`), `circle` (`radius`, `segments`) and `polygon` (`points`, counter-clockwise). Use a profile only as the `child` of `extrude` (`height`, `twist`, `scale`, `divisions`, `center`) or `revolve` (`degrees`, `segments`).
   - The operations `union`, `difference` and `intersection` take `children`. `difference` subtracts the second and later children from the first.
   - The transforms `translate` (`offset`), `rotate` (`angles` in degrees, about x, then y, then z), `scale` (`factor`) and `mirror` (`normal`) take one `child`.
   - Each node can have a `name` and a `color` (three numbers from 0 to 1). A cut face takes the colour of the solid that cut it.
4. Save the document as `<name>.json` in the output folder.
5. Call `render` with `type` set to `cad` and the `format`. Set `input_path` to the `.json` file. Set `output_path` to `<name>.<format>` in the output folder. For `png`, set `options.width` and `options.height` when the user gives a size.
6. Read the tool result. A result with `"status":"error"` is a failure. Report its code. `E_INPUT` gives the JSON path of the bad value. Correct the document and render again. Stop after three tries. `E_LIMIT` means that the model has too many nodes or facets: reduce `segments`. `E_STAGE_MISSING` for `png` means that the configuration names no browser: name the `SCIENG_BROWSER` environment variable.
7. Check that the file exists and that its size is more than 0. A `glb` file starts with `glTF`. An STL file holds 84 bytes plus 50 bytes for each facet. STL holds no colour, so the result warns for a coloured model.
8. Open an HTML page in the browser. Give the full path of the document and the output, and the warnings of the result.
