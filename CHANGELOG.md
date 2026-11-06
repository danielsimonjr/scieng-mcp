# Changelog

## [Unreleased]

## [1.0.7] - 2026-11-06

### Added

- `render` with `type: "cad"` accepts `format: "md"`, from sciengjs 1.0.6. The file is a report of the design for manufacture. The report gives the size, the volume and the surface area of the part. The report gives the area that needs support (option `overhang`) and the walls thinner than `minWall`. The `/scieng-mcp:cad` command, the skill and the README list the format.

## [1.0.6] - 2026-11-06

### Added

- `render` with `type: "cad"` accepts `format: "dxf"`, from sciengjs 1.0.5. A DXF file is a 2D drawing in the X-Y plane: the outline of the part, or with `options: { z }` the section at that height. The `/scieng-mcp:cad` command, the skill and the README list the format.

## [1.0.5] - 2026-11-05

### Added

- `render` with `type: "cad"` accepts `format: "3mf"`, from sciengjs 1.0.4. A 3MF file keeps the colours and the names of the part. The `/scieng-mcp:cad` command, the skill and the README list the format.

## [1.0.4] - 2026-11-05

### Changed

- The engine is sciengjs 1.0.3: a browser capture that times out names the page request that the browser rejected.
- The header of `src/ooxml-edit.ts` no longer says "zero-dependency". The file imports `render-lib.ts`.
- `render_mermaid` and `render_dot` share one handler, `sourceRenderHandler` in `src/tools.ts`. The two handlers were exact copies. The behavior is unchanged.

## [1.0.3] - 2026-11-05

### Added

- CI job "Architecture docs". The job runs `repo-tools check` against `docs/architecture` and `repo-tools docs check src`, with repo-tools pinned to 2.5.0. A stale count in a Verification table now fails CI. `repo-tools map` writes the corrected value.

### Fixed

- `OVERVIEW.md` stated 5023 lines of code. `repo-tools map` wrote the measured value, 5121.
- The `ooxml_replace` tool writes through `writeOutput`, with a unique temporary name. Before this fix, it used the fixed name `.<file>.<pid>.tmp`, so it overwrote a file with that name, and two edits of one file at the same time shared one temporary file.

## [1.0.2] - 2026-11-05

### Changed

- The bundle uses sciengjs 1.0.2. A browser render that cannot guard its page fails at once with the cause, and a browser render that runs out of time names its step.

## [1.0.1] - 2026-11-05

### Changed

- The bundle uses sciengjs 1.0.1. A Mermaid class diagram accepts a one-line class body, for example `class Engine { +render() }`.

### Fixed

- The cad command states that each node of a CAD document names its kind in the key `type`. Without the rule, a document with another key rejected with E_INPUT.

## [1.0.0] - 2026-11-05

### Changed

- The server uses sciengjs 1.0.0. Every tool call runs on this machine, and no remote render service remains. The first tikz render downloads the TeX bundles from the v1.0.0 release of the engine.
- A warm tikz render is faster: the engine loads the core TeX bundle once per server process.

## [0.15.0] - 2026-11-05

### Changed

- The skill names every command and the local engine as the renderer of each. The privacy rules state that every tool call runs on this machine.
- The plugin README describes where the source of `tikz`, `sysml` and `cad` goes.

### Added

- The offline bundle gate also calls `render_mermaid`, `render_latex`, `render_html`, `html_to_markdown` and `render` with the type `plot`, with every network request refused.

## [0.14.0] - 2026-11-05

### Added

- The `render` tool renders the type `tikz` to `svg`, `png` and `pdf` through the TeX stage of the engine (sciengjs 0.10.0). The first render downloads the TeX bundles from the release of the engine into the cache folder.
- The `/scieng-mcp:tikz` command writes a TikZ picture from a description, saves it, and renders it.
- The `/scieng-mcp:circuit` command has a `--tikz` route: a circuitikz picture from the netlist, rendered by the engine.
- The bundle gate renders a tikz picture from the built bundle. The test fetches the core bundle and checks its pinned hash. The server reads the bundle from a `file:` URL and makes no network request.

## [0.13.0] - 2026-11-05

### Added

- The `render` tool renders the type `sysml`, a SysML v2 text subset, to `svg`, `png` and `pdf`, as a block definition, internal block or requirements view (sciengjs 0.9.0).
- The `/scieng-mcp:sysml` command writes a SysML source from a description, saves it, and renders the view.
- The bundle gate renders a sysml source to svg and an ibd view to png.

## [0.12.0] - 2026-11-04

### Added

- The `render` tool renders the type `cad`, a CSG document in JSON, to `stl`, `glb`, `html` and `png` (sciengjs 0.8.0).
- The `/scieng-mcp:cad` command writes a CAD document from a description, saves it, and renders it.
- The bundle ships `manifold.wasm` and the Apache-2.0 licence text of `manifold-3d` beside `index.mjs`. The plugin README names them.

### Changed

- The engine dependency is `@danielsimonjr/sciengjs` ^0.8.0.
- The bundle gate accepts a Node builtin without the `node:` prefix. The WASM loader of `manifold-3d` imports `module`.

## [0.11.0] - 2026-11-05

### Added

- The `render` tool renders the CAD types `step`, `iges` and `brep` to `glb`, `html` and `png`. The `html` output is a Three.js viewer page with orbit, section planes and an exploded view. A CAD file is bytes: the tool reads it from `input_path` and refuses inline `source`. The size cap is the engine limit `maxSourceBytes`, not the 512 KB cap of a text source.
- The `/scieng-mcp:step` command renders a STEP, IGES or BREP file.
- The bundle ships `occt-import-js.wasm` and its two LGPL-2.1 licence texts beside `index.mjs`, and the six pinned Three.js files in `assets/`. The plugin README names them.

### Changed

- sciengjs ^0.7.1. The tool gets the list of binary input types from the engine export `BINARY_INPUT_TYPES`.

### Fixed

- The plugin README listed the Mermaid row of the asset table two times.


## [0.10.1] - 2026-11-04

### Fixed

- The output write of `render`, `render_mermaid`, `render_dot` and `render_latex` no longer uses the fixed temporary name `<output_path>.tmp`. It writes a new temporary file with a unique name, with an exclusive create, so an existing file named `<output_path>.tmp` stays as it is. A failed write or rename removes the temporary file.

## [0.10.0] - 2026-11-04

### Added

- `html_to_markdown` tool. It converts HTML (inline text or an `.html` file) to GitHub Flavored Markdown through the sciengjs engine. It writes each asset into the folder of `output_path`. It never overwrites a file. An existing `output_path`, or one that does not end in `.md`, gives E_INPUT. A taken asset name gets `-2`, `-3`, and only the image links that name the asset follow the new name. The tool refuses an asset name with `:`, NUL, a Windows device name, or a trailing dot or space. An empty `html` gives "html is empty". A failure removes every file that the call created.
- `/scieng-mcp:markdown` command. It converts an HTML file or HTML text to Markdown with `html_to_markdown`.

### Changed

- `render_html` writes `data-scieng-type` on each `scieng-block`, so the engine reads the block type before it infers it.
- The sciengjs dependency moves to `^0.6.0`, which adds the `html` input type and the `md` output format.

## [0.9.0] - 2026-11-04

### Added

- `render_html` takes `static: true` on a `plotly` block. The engine draws that block as inline SVG, and the block loads no Plotly script. A page loads Plotly only when a non-static `plotly` block is present.
- `/scieng-mcp:plot --static` writes `<name>.svg` through `render` (type `plot`, format `svg`) instead of an HTML page.

### Security

- Each static `plotly` block gets its own suffix on the SVG ids and their `url(#id)` and `href="#id"` references. Thus two blocks on one page do not collide. The static SVG check also refuses `<foreignObject`, event-handler attributes and `javascript:` URLs. `static: true` on a block that is not `plotly` gives E_INPUT.

### Changed

- The sciengjs dependency moves to `^0.5.0`, which adds the `plot` input type (svg, png and html) and the `@danielsimonjr/sciengjs/plot` helpers.

## [0.8.0] - 2026-11-04

### Changed

- `render_latex` renders each block on this machine through the sciengjs `math` type. The tool makes no network request. The latex.codecogs.com service is removed.
- `render_latex` takes `format` (`svg` default, `png` or `pdf`) and `scale`. A png or pdf takes one block. `scale` applies to png only. svg and pdf ignore `scale` and add a warning.
- `render_latex` returns a `warnings` array.
- `extractBlocks` returns the blocks in source order. Before, the display blocks came after all environments.
- The sciengjs engine dependency moves to `^0.4.0`.

### Deprecated

- `render_latex` `dpi`. For png with no `scale`, the scale is `dpi`/100. svg and pdf ignore `dpi` and add a warning.

### Fixed

- `writeOutput` creates a missing parent folder.

### Added

- A test spawns Node with no network permission and renders LaTeX, Mermaid and DOT to svg.

## [0.7.0] - 2026-11-03

### Added

- `render` tool. It renders any input type and output format of the sciengjs engine to a file, on this machine. Its arguments are `type`, `format`, `options` and one of `source` or `input_path`. Its result is `{path, bytes, mime, backend, warnings}`. An engine error returns its code. The tool count is seven.
- `render_mermaid` takes `format`: `svg` (the default), `png` or `pdf`.
- `render_html` puts a `data-scieng-source` attribute on the wrapper of each block. The value is the exact block source, HTML-attribute-escaped.

### Changed

- `render_mermaid` renders on this machine through the sciengjs engine. The source no longer goes to mermaid.ink. Class, state and sequence diagrams need no browser. Other diagram types need `SCIENG_BROWSER`, and return `E_STAGE_MISSING` without it.
- The sciengjs engine dependency moves from `^0.2.0` to `^0.3.2`. Release 0.3.2 renders under `node --test` and under `node --input-type=module -e`.
- The `render_html` description states that each block source occurs two times in the page. It also states that a `raw-html` fragment must be valid inside a `div`.
- The WaveDrom panel of `render_html` has a 1 px border. The panel keeps its light background.
- The bundle includes every backend in the engine registry. Before, the Mermaid and PDF backends were missing.

### Removed

- `encodePako` and the mermaid.ink request path of `render_mermaid`.


## [0.6.1] - 2026-11-03

### Added

- `LICENSE` at the repository root holds the MIT licence. `package.json` declares `"license": "MIT"`.
- `README.md` has a Quick Start section, with the marketplace command and one example command. The README also has a License section that links `LICENSE` and the Third-party assets table of `plugin/README.md`.
- The scieng skill references name the exact CDN pins of `render_html`. The pins are `mermaid@11.16.0` (was `mermaid@11` or unversioned), `katex@0.16.21` (was `0.16.9` in one reference) and `@viz-js/viz@3.28.0` (was unversioned). `test/skill-cdn.test.ts` fails when a skill reference names another version of a pinned library.
- Each `<script src>` and `<link href>` to a CDN in the scieng skill references has an exact version, an `integrity` attribute (sha384) and `crossorigin="anonymous"`. The hashes come from the fetched files. `test/skill-cdn.test.ts` fails when a CDN tag has no integrity attribute. The Viz.js examples load `@viz-js/viz@3.28.0/dist/viz-global.min.js` from jsDelivr, the file that `render_html` pins.
- `test/repo-metadata.test.ts` fails when `package.json` and `plugin/.claude-plugin/plugin.json` declare different versions. `AGENTS.md` names the test in the release rule.

### Fixed

- The HTML playground reference of the scieng skill loads `highlight.js` 11.11.1 (was 11.9.0), the version of the other references. `test/skill-cdn.test.ts` fails when a library has two versions in the references, or when a reference loads a CDN URL through `import()` or `@import`.
- `httpText` retries a failed response-body read in the same way as a network error.
- `httpText` limits a Retry-After wait to 30 s (`RETRY_AFTER_CAP_MS`). A caller sets a different limit with `maxRetryAfterMs`. An HTTP-date Retry-After value now sets the wait.
- `mapLimit` runs every item. An item that fails no longer stops its worker. The call rejects with an `AggregateError` that holds each error.
- `readInput` checks the file size. It reads the file only when the size is within the limit.
- The `capabilities` tool rejects arguments that the tool does not know.
- The WaveDrom guard in `render_html` rejects `<script`, `</script` and `<!--` in any letter case. The error names the token.
- `ooxml_replace` writes the edited file to a temporary file, then renames the temporary file over the target. A failed call removes the temporary file.

## [0.6.0] - 2026-11-03

### Added

- `docs/architecture/` holds the architecture documents: five hand-written documents (`OVERVIEW.md`, `ARCHITECTURE.md`, `COMPONENTS.md`, `DATAFLOW.md` and `API.md`) and the reports that `repo-tools` generates. `repo-tools check . --docs=docs/architecture` compares the numbers in the `## Verification` block of each hand-written document with the code.
- The README has a `## Documentation` section. The section links the documents of `docs/architecture/`, `CHANGELOG.md`, `CLAUDE.md` and `AGENTS.md`.

### Changed

- The server uses `@danielsimonjr/sciengjs` 0.2.0. The bundle ships `assets/licenses/MIT-viz-js.txt`, the MIT licence text of `@viz-js/viz`. The Third-party assets table of `plugin/README.md` names the file.
- Each exported symbol of `src/` has a doc comment, and `repo-tools docs check src` passes. Twenty-five doc comments were added. Three doc comments were reworded, and the file header of `src/ooxml-edit.ts` changed. One blank line was removed from `src/tools.ts`. No code changed. The plugin bundle is byte-identical to the committed bundle.
- Three doc comments in `src/` state how the code behaves. The comments cover the retry of a failed body read in `httpText` and the whole-run replacement of `replaceInRuns`. The third comment is the header of `src/ooxml-edit.ts`. `TOOLS` in `src/tools.ts` has a doc comment, which the doc gate does not count. No code changed.
- `plugin/README.md` and the architecture documents state the limit of a request line as measured. At 10,485,760 bytes or more, the server stops answering requests. The process stays alive until the client closes standard input.

### Fixed

- `render_latex` stacks blocks without overlap. `combineSvgs` reads the width and the height in double quotes or single quotes.
- `combineSvgs` works in one unit, the user unit of the outer svg. A unitless value and a px value keep their number. `combineSvgs` multiplies a pt value by 4/3.
- `combineSvgs` writes the resolved width and height on each nested svg. The outer svg has no unit suffix.
- For an ex value, an em value or a missing value, `combineSvgs` uses the matching viewBox width or height.
- `render_latex` lists the failed blocks in input order, not in the order in which the requests finish.
- `ooxml_replace` replaces only the matched text of a run. The tool keeps the text before and after the match. The tool keeps the run formatting.
- `ooxml_replace` refuses an empty `find`. The tool returns the error `[EMPTY_FIND]`. The tool does not change the file.
- `ooxml_replace` escapes `&`, `<` and `>` in `replace`. The written `word/document.xml` stays well-formed.
- `ooxml_replace` reads the text of a run as plain text. A `find` of `&` matches `&amp;` in the file. A `find` of `&amp;` no longer matches. The tool does not read `<w:tab/>` as a `<w:t>` element.
- `ooxml_replace` does not stop with an error on a numeric reference that XML 1.0 forbids. The tool keeps such a reference as written.
- `ooxml_replace` gives `xml:space="preserve"` to each rewritten `w:t` element that starts or ends with a space.
- A match does not cross a `w:br`, `w:tab` or `w:cr` element. Adjacent `w:t` elements match together.
- The tool re-encodes each rewritten `w:t` element. The tool writes entities such as `&quot;` and `&#160;` as characters. The other elements of the run keep their bytes.

## [0.5.0] - 2026-11-02

### Changed

- `render_dot` draws the graph on this machine with the sciengjs engine (`@danielsimonjr/sciengjs`). `render_dot` makes no network request. DOT source no longer goes to quickchart.io. The result is `{path, bytes, warnings}`.
- `render_dot` takes a `format` argument: `svg` (the default) or `png`.
- The engine removes each `image` and `stylesheet` attribute from a DOT source. The result holds a warning for each attribute that the engine removes.
- The `dot` command, the `scieng` skill, `GRAPHVIZ.md`, `plugin/README.md` and the README describe the local render.
- The sciengjs dependency changes from `^0.1.0` to `^0.1.1`. The server gives the engine the `assets/` folder beside the bundle. The bundle needs no `node_modules`.
- A failed tool call from the sciengjs engine returns the engine error code (`code`). The result also gives `line` and `column` when the engine gives them. An internal engine failure names the engine in the error text.

### Added

- The `capabilities` tool lists the render pairs of the engine (type and format, with the stage of each pair and whether the pair is ready). The tool is read-only and takes no input.
- CI checks that the committed `plugin/bundle/` equals a fresh build.
- `.gitattributes` stores the bundle's `.mjs` files with LF line endings, and the bundle's font and WASM files as binary. Git stores the engine assets without line-ending conversion, so each asset is a byte-exact copy of the engine package.
- `plugin/bundle/assets/index_bg.wasm`, the WASM file of the raster stage. `test/bundle-gate.test.ts` runs the built bundle in a fresh folder with no `node_modules`. The test renders SVG and PNG. The test checks that the bundle sends no network request.
- The bundle gate checks that each engine asset is a byte-exact copy of the engine package file. On systems other than Windows, the bundle gate checks that each bundle file has mode 0644. `scripts/bundle.mjs` sets that mode on each file the build writes.
- `plugin/README.md` states the Node.js version (24 or later), the limit of one request line (10,485,760 bytes) and the limit of an `input_path` file (512 KiB).
- `plugin/README.md` has a Third-party assets section. The Third-party assets section names the licence of each engine asset. The licences are SIL Open Font License 1.1 (Liberation Serif), MPL-2.0 (the resvg WASM file) and EPL-2.0 (Graphviz, inside `@viz-js/viz`). The wrapper of `@viz-js/viz` is MIT.

## [0.4.2] - 2026-11-01

### Security

- `@modelcontextprotocol/server` and `@modelcontextprotocol/core` go from 2.0.0 to 2.4.0, and `zod` from 4.4.3 to 4.6.7. The bundle holds both packages, so the old versions shipped in the plugin. The update clears five Dependabot alerts. Four are for the server package: three high and one medium, all fixed by 2.3.0. One high alert is for `zod`, fixed in 4.6.6. `bun.lock` and `package-lock.json` hold the same versions. `npm audit --omit=dev` finds 0 vulnerabilities.
- The bundle grows from 1,160,960 to 1,409,956 bytes. The time from start to the first tool result does not increase. Ten runs of each bundle gave 0.7 to 1.1 s for the new bundle and 0.7 to 2.3 s for the old bundle.

## [0.4.1] - 2026-11-01

### Fixed

- `render_html` puts each WaveDrom block on a light panel. The default WaveDrom skin draws black lines and text. The lines and text did not show on the dark page. The panel style goes into the page only when the page has a WaveDrom block.
- `MERMAID.md`, `GRAPHVIZ.md` and `LATEX.md` named render scripts that do not exist (`render-*-to-svg.ts`). Each section now names the matching tool (`render_mermaid`, `render_dot`, `render_latex`) and the service that receives the source.
- `ENGINEERING-DOCX.md` named an `ooxml-edit-template.ts` helper that does not exist. The section now names the `ooxml_replace` tool.
- The circuit command and `SCIENG.md` forbid a wire that crosses a part.
- A `render_html` LaTeX block that held an `equation`, `align` or `gather` environment (or a starred form) showed as literal text. The block is not wrapped in display delimiters. The KaTeX auto-render call did not list the environments. The call now lists the environments. `LATEX.md` tells how to keep a LaTeX source private with `render_html`. The Copilot review found the defect.
- `test/plugin-content.test.ts` checks that each script that a reference file places "in this skill directory" exists, and that the circuit rule is present.

### Added

- `TODO.md`: a pointer to `sciengjs` (https://github.com/danielsimonjr/sciengjs), the local rendering engine that the adapter moves onto, and three defects that the command test pass found.

## [0.4.0] - 2026-10-31

### Added

- **One slash command per diagram type**, in `plugin/commands/`: `/scieng-mcp:mermaid`, `dot`, `latex`, `wavedrom`, `plot`, `circuit` and `playground`. Each command reads the syntax reference of its type, saves the source next to the output, never overwrites a file, and checks the output file.
- `mermaid`, `dot` and `latex` make an SVG file through the remote render tools, and name the service that receives the source. `--local` makes an HTML page that renders in the browser, so the source stays on the machine. `dot` refuses to send a source with a `URL`, `href` or `image` attribute.
- `plot` computes every point with a script that it saves next to the chart. `circuit` writes a netlist first and never invents a part value.
- `AGENTS.md` (with a `CLAUDE.md` loader) for agents that work on the repository, and `plugin/README.md`, a short usage guide.
- `test/plugin-content.test.ts` checks the plugin content. The seven commands exist. Each command has a description and an argument hint. Each tool and reference file that a command or the skill names exists. The remote commands name their service and offer `--local`.

### Changed

- `plugin/skills/scieng/SKILL.md` is rewritten in Simplified Technical English. It lists the commands, states the privacy rules, and gives one output rule (the `--out` folder, else `SCIENG_OUT_DIR`, else `./diagrams`). The reference files do not change.

## 2026-10-01

- **Removed the dead root `bun` Dependabot entry.** No dependency-update ecosystem works on a
  Bun-managed root right now. `bun` fails with "Unsupported bun.lock 'lockfileVersion' 2". `npm`
  aborts during file fetching with "npm_and_yarn ecosystem cannot update bun.lock". Each error
  recommends the other. Measured fleet-wide 2026-10-01: 19 dead updater jobs. The entry was failing
  weekly and proposing nothing. The change removed the entry and recorded the reason in `dependabot.yml`.
  Security alerts are unaffected. Automated remediation is what stops. `github-actions` updates
  continue.

## [0.3.0] - 2026-09-17

### Changed

- **The plugin now installs from `plugin/`, so Claude Code no longer installs the dev
  toolchain into the plugin cache.** The marketplace entry installed the repo root, which
  holds `package.json`, `bun.lock` and `package-lock.json`. Claude Code's plugin installer
  runs `bun install --frozen-lockfile --ignore-scripts` when the plugin root holds a manifest
  plus a lockfile. The installer has no omit-dev option, so `typescript`, `esbuild`
  and `@types/node` were installed into the cache. The 0.2.0 cache measured **59 MB of
  `node_modules` out of 60 MB total**, for a server that needs none of it at runtime.

  `plugin/` now holds `.claude-plugin/plugin.json`, `.mcp.json`, `bundle/` and `skills/`
  only - no `package.json` and no lockfile, so the installer finds nothing to install. The
  repo root keeps its manifests for development, and `scripts/bundle.mjs` writes to
  `plugin/bundle/index.mjs`. `.gitignore` keeps the `.mcp.json` negation, now pointed at
  `plugin/.mcp.json`. The marketplace entry must become `git-subdir` with
  `path: "plugin"`.

  **The renderers need no runtime packages and no external binaries.** `render_mermaid`,
  `render_dot` and `render_latex` call remote HTTP services with the global `fetch`
  (`mermaid.ink`, `quickchart.io/graphviz`, `upmath`); `render_html` writes CDN `<script>`
  tags into the output page. `bundle/index.mjs` imports only `node:` builtins.

  Verified from a copy of `plugin/` that carries no `node_modules`: `initialize` and
  `tools/list` both succeed over stdio and report 5 tools. Repeated with a preload that
  throws on any non-builtin `require`/`import`: same result. The guard is failure-capable -
  a deliberate `import "typescript"` under the same preload is denied.

  The version bump is required, not cosmetic: the plugin cache is keyed by version, so
  without it a marketplace refresh reuses the existing clone.

- **TypeScript range tightened to `^7.0.2` and Bun pinned to 1.4.2.** The range was
  `^7.0`, which installs 7.0.2+ today but declares a floor of 7.0.0. A declaration is
  reproducible. What the registry happens to serve is not reproducible. `packageManager` was
  absent entirely, so the toolchain version was not stated where most tools read it;
  it and the CI workflow now both say 1.4.2.

- **Removed the now-dead `@modelcontextprotocol/sdk@1.x` dependency.** The port left the dependency in
  `package.json`. Nothing imported the dependency any more. The dependency made a fleet scan
  classify this repo as MIXED-generation. The manifest claimed both SDKs and could not say
  which SDK was live. An unused dependency is not harmless. Such a dependency is a second source
  of truth about what this server runs on.

- **Ported to the MCP 2.0 SDK** — `@modelcontextprotocol/sdk@1.x` replaced by
  `@modelcontextprotocol/server` + `core` @2.0.0. Three non-obvious differences, recorded because
  they are not import swaps:
  - **Handlers register by SPEC METHOD NAME, not by schema object.** `setRequestHandler("tools/list", fn)`
    and `setRequestHandler("tools/call", fn)`. The v1 form `setRequestHandler(CallToolRequestSchema, fn)`
    throws at runtime: *"is not a spec request method; pass schemas as the second argument"*.
  - **`serveStdio()` replaces `connect(new StdioServerTransport())`** and owns the transport
    lifecycle, including legacy-era clients via `legacy: "serve"`.
  - **The `Tool` type moved to `@modelcontextprotocol/server`** (type-only). The type is NOT in `core`.
    In v2, `inputSchema.properties` is typed as recursive JSON values, not as `object`. If the v1 `Tool`
    import stays in place, the typecheck fails with a deeply nested and misleading error.

  The verification covers the BUILT bundle over real stdio, not only a passing build. A live `initialize`
  negotiates `2025-11-25` (the SDK's actual latest) and `tools/list` returns all 5 tools.
  Note this is a DEPENDENCY-generation change; the wire protocol is 2025-11-25 before and after.


### Security (2026-08-04)

Lock-only via `npm update`; no manifest changed. Transitive dependencies of the
MCP SDK / server stack:

- `ip-address` -> 10.4.0 (1 high + 2 medium; needed 10.3.1)
- `hono` -> 4.13.0 (medium; needed 4.12.34)
- `fast-uri` -> 3.1.5 (high; needed 3.1.5)

Only the packages present in this repo's tree are listed above by the resolver;
`npm audit` reports 0 vulnerabilities. Verified with `npm ci` plus this repo's
own build and test scripts.


### Added

- **Windows CI leg.** CI ran on `ubuntu-latest` only. Windows is the *production* platform for this MCP server,
  and the server runs on the user's Windows box. So CI had never once tested the OS the server
  actually ships on. The `build` job now runs a
  `[ubuntu-latest, windows-latest]` matrix.


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.0] - 2026-09-05 - MCP SDK v2 (dependency major; wire protocol unchanged)

- **Runtime moved from `@modelcontextprotocol/sdk@1.x` to `@modelcontextprotocol/{server,core}@2.x`**
  (23063bd), and the dead `sdk@1.x` entry that the port left behind in the manifest was dropped
  (38802ca). Until that second commit the manifest declared BOTH generations, so a fleet scan read
  this repo as MIXED even though nothing imported v1.
- **Breaking for anything resolving alongside this package, so a major bump in 0.x terms.**
  0.1.3 -> **0.2.0**, not 2.0.0: under semver a breaking change while below 1.0.0 moves the MINOR.
  Jumping to 2.0.0 would invent a 1.0.0 that never existed and claim an API stability this package
  has never declared.
- **The wire protocol is UNCHANGED at `2025-11-25`.** Verified by a live stdio round trip against the rebuilt `bundle/index.mjs`, which is the exact
  file that `.mcp.json` launches. The round trip reports version 0.2.0, negotiates 2025-11-25,
  lists all 5 tools, and returns -32601 for a bogus method. The bogus method shows that the probe
  is known failure-capable. The v2 package major and the protocol era are separate facts.
- **Tag history note:** the previous tag is `v0.1.1` while `package.json` had reached `0.1.3`, and
  this repo had NO GitHub releases at all. Versions 0.1.2 and 0.1.3 were never tagged or released,
  so the tag sequence skips them. Recorded rather than back-filled: inventing tags after the fact
  would misrepresent when those versions actually shipped.


## 2026-09-03 - CI now exercises the NODE runtime, not just Bun

- Every CI step ran through `bun run` while `setup-node` was installed and never invoked,
  so the production runtime was never exercised. Measured across the workspace: 13 of 14
  sampled repos had this shape.
- Added a Node smoke step that imports the shipped entry (`./bundle/index.mjs`) under Node and fails on a
  throw, a syntax error, or an unresolvable import. A server that self-starts on import
  passes after 5s, because starting without crashing is the signal.
- **Proven failure-capable before adoption**, on librarian-mcp: corrupt artifact -> exit 1;
  missing dependency -> exit 1; good artifact -> exit 0. The missing-dependency case is the
  class that forced six repos to revert during the Bun migration.
- Smoke verified locally against this repo's built artifact before the step was added.

## [0.1.1] - 2026-07-02

### Fixed
- `Object.hasOwn` guards tool dispatch. Prototype names like `toString` no longer bypass the unknown-tool error. Unknown-tool errors now use the same JSON envelope as handler throws.
- `httpText` non-2xx errors name the remote service host.
- Nested `blocks[]`/`replacements[]` schemas reject unknown keys, matching the declared JSON Schema.
- SKILL.md Quick Reference now routes to PAPERS.md and the HTML-playground background doc.

## [0.1.0] - 2026-07-02

### Added

- Converted the science/engineering authoring tools into a standalone MCP
  server (`scieng-mcp`), porting each renderer's source core (Mermaid, DOT,
  LaTeX) from the prior implementation.
- `render_latex` reports per-item render failures in a `failures` array
  instead of throwing, so partial document renders still return usable
  output.
- `render_html` assembles self-contained HTML playgrounds from typed content blocks.
  The tool emits only the CDN imports that each block type needs. Subresource Integrity (SRI)
  hashes pin the imports. The tool adds script-breakout hardening for
  embedded/user-supplied content.
- `ooxml_replace` applies run-preserving batch find/replace edits to unpacked
  Word `document.xml`, leaving `<w:rPr>` formatting untouched.
- Wired all five tools into an MCP server over stdio (`src/index.ts`).
- Added `scripts/bundle.mjs` (esbuild, single-file ESM bundle) and
  `scripts/smoke-handshake.mjs` (spawns the bundle and verifies an MCP
  `initialize` handshake returns `serverInfo`).
- Committed the generated `bundle/index.mjs` so the plugin can run without a
  build step, plus `.claude-plugin/plugin.json` and `.mcp.json` for
  distribution as a `local-marketplace` plugin.
