---
description: Draw a SysML v2 model (a textual subset) locally as a block definition view, an internal block view or a requirements view, to an SVG file, a PNG image or a PDF file.
argument-hint: "[--view bdd|ibd|requirements] [--root <part def>] [--format svg|png|pdf] [--out <folder>] <a description of the system, or the path of a .sysml file>"
---

Draw a SysML v2 model from: $ARGUMENTS

1. Load the `scieng` skill. Use the output rules of the skill.
2. Read the arguments. `--view` sets the view: `bdd` (the default), `ibd` or `requirements`. `--root` names the part def of an `ibd` view. `--format` sets the output: `svg` (the default), `png` or `pdf`. `--out <folder>` sets the output folder. The rest is a description of the system, or the path of a `.sysml` file. When the arguments hold no description and no path, ask for one and stop. When `--view ibd` has no `--root`, ask for the part def and stop.
3. With a description, write the SysML source in the subset. Never invent a part, a port, a value or a requirement that the description does not give. When a fact is missing, ask for it and stop.
   - The statements are `package Name { … }`, `part def Name (:> Base)? ( ; | { … } )`, `port def Name`, `interface def Name`, `requirement def Name (:> Base)?` and `requirement name (: Def)?`.
   - A `part def` holds `attribute name (: Type)? (= value)? ;`, `part name : Type ([n] | [n..m] | [n..*])? ;`, `port name : Type ;`, `connect a.p to b.q ;`, `interface name : Def connect a.p to b.q ;` and `satisfy Req by path ;`.
   - A `connect` end is `part.port`, or `port` for a port of the enclosing part def.
   - `satisfy Req by Path ;` names a requirement and a `part def` or `Def.part`. A nested requirement has the address `Owner.name`.
   - The subset has no `doc`, `import`, `alias`, `action`, `state` and `item`. Use `//` or `/* */` comments.
4. Save the source as `<name>.sysml` in the output folder.
5. Call `render` with `type` set to `sysml` and the `format`. Set `input_path` to the `.sysml` file. Set `output_path` to `<name>.<format>` in the output folder. Set `options.view`, and `options.root` for `ibd`. For `png`, set `options.scale` when the user gives a size.
6. Read the tool result. A result with `"status":"error"` is a failure. Report its code. `E_INPUT` gives the line of the bad statement. Correct the source and render again. Stop after three tries. `E_STAGE_MISSING` for `pdf` means that the configuration names no browser: name the `SCIENG_BROWSER` environment variable.
7. Check that the file exists and that its size is more than 0. An SVG file starts with `<svg` or `<?xml`. Give the full path of the source and the output, the view, and the warnings of the result.
