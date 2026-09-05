# Changelog

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

## [Unreleased]

### Changed

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
