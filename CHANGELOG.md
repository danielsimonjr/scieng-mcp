# Changelog

## 2026-10-01

- **Removed the dead root `bun` Dependabot entry.** No dependency-update ecosystem works on a
  Bun-managed root right now: `bun` fails with "Unsupported bun.lock 'lockfileVersion' 2" and `npm`
  aborts during file fetching with "npm_and_yarn ecosystem cannot update bun.lock". Each error
  recommends the other. Measured fleet-wide 2026-10-01: 19 dead updater jobs. The entry was failing
  weekly and proposing nothing, so it was removed and the reason recorded in `dependabot.yml`.
  Security alerts are unaffected; automated remediation is what stops. `github-actions` updates
  continue.

## [0.3.0] - 2026-09-17

### Changed

- **The plugin now installs from `plugin/`, so Claude Code no longer installs the dev
  toolchain into the plugin cache.** The marketplace entry installed the repo root, which
  holds `package.json`, `bun.lock` and `package-lock.json`. Claude Code's plugin installer
  runs `bun install --frozen-lockfile --ignore-scripts` when it finds a manifest plus a
  lockfile at the plugin root, and it has no omit-dev option, so `typescript`, `esbuild`
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
  `^7.0`, which installs 7.0.2+ today but declares a floor of 7.0.0 -- a declaration is
  reproducible, whatever the registry happens to serve is not. `packageManager` was
  absent entirely, so the toolchain version was not stated where most tools read it;
  it and the CI workflow now both say 1.4.2.

- **Removed the now-dead `@modelcontextprotocol/sdk@1.x` dependency.** The port left it in
  `package.json` though nothing imported it any more, which made a fleet scan classify this repo
  as MIXED-generation -- the manifest claimed both SDKs and could not say which was live. A
  dependency nothing imports is not harmless: it is a second source of truth about what this
  server runs on.

- **Ported to the MCP 2.0 SDK** — `@modelcontextprotocol/sdk@1.x` replaced by
  `@modelcontextprotocol/server` + `core` @2.0.0. Three non-obvious differences, recorded because
  they are not import swaps:
  - **Handlers register by SPEC METHOD NAME, not by schema object.** `setRequestHandler("tools/list", fn)`
    and `setRequestHandler("tools/call", fn)`. The v1 form `setRequestHandler(CallToolRequestSchema, fn)`
    throws at runtime: *"is not a spec request method; pass schemas as the second argument"*.
  - **`serveStdio()` replaces `connect(new StdioServerTransport())`** and owns the transport
    lifecycle, including legacy-era clients via `legacy: "serve"`.
  - **The `Tool` type moved to `@modelcontextprotocol/server`** (type-only). It is NOT in `core`,
    and v2 types `inputSchema.properties` as recursive JSON values rather than `object`, so leaving
    the v1 `Tool` import in place fails typecheck with a deeply nested and misleading error.

  Verified against the BUILT bundle over real stdio, not just a passing build: a live `initialize`
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

- **Windows CI leg.** CI ran on `ubuntu-latest` only — but Windows is the *production*
  platform for this MCP server (it runs on the user's Windows box), so CI had never once
  tested the OS the server actually ships on. The `build` job now runs a
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
- **The wire protocol is UNCHANGED at `2025-11-25`.** Verified by a live stdio round trip against
  the rebuilt `bundle/index.mjs` -- the exact file `.mcp.json` launches -- which reports version
  0.2.0, negotiates 2025-11-25, lists all 5 tools, and returns -32601 for a bogus method so the
  probe is known failure-capable. The v2 package major and the protocol era are separate facts.
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
- Tool dispatch guarded with `Object.hasOwn` (prototype names like `toString` no longer bypass the unknown-tool error); unknown-tool errors now use the same JSON envelope as handler throws.
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
- `render_html` assembles self-contained HTML playgrounds from typed content
  blocks, emitting only the CDN imports each block type needs, pinned via
  Subresource Integrity (SRI) hashes, with script-breakout hardening for
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
