# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
