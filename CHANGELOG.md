# Changelog

## [Unreleased]

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
