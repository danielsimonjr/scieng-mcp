# scieng-mcp Overview

## Summary

scieng-mcp is a Model Context Protocol (MCP) server. The server runs as a child process of an MCP client. The server exchanges JSON messages over standard input and standard output. The server exposes six tools.

Three tools render diagram or formula source to an image file. One tool builds an HTML page from typed blocks. One tool replaces text in an unpacked Word document. The sixth tool reports the render pairs of the local engine.

The server runs on Node.js 24 or later. Its runtime entry is the committed bundle `plugin/bundle/index.mjs`. The bundle needs no `node_modules` folder. The same repository holds the Claude Code plugin that installs the server. The plugin adds seven slash commands and one skill. Development uses Bun. The lockfile is `bun.lock`.

## Key metrics

The census is the list of code files in [FILE_INVENTORY.md](FILE_INVENTORY.md). The census lists 25 files and no file of `plugin/bundle/`.

| Metric | Value | Scope | Source |
|---|---|---|---|
| `totalSourceFiles` | 25 | The census. | `dependency-graph.json` |
| `totalLinesOfCode` | 3378 | The census. | `dependency-graph.json` |
| `totalExports` | 80 | The census: 30 exports in `src/`, 31 in `plugin/skills/scieng/engineering-patterns.ts`, 19 in `plugin/skills/scieng/stubs/docx.d.ts`. | `dependency-graph.json` |
| `runtimeCircularDeps` | 0 | Runtime import cycles in the census. | `dependency-graph.json` |
| `typeOnlyCircularDeps` | 0 | Type-only import cycles in the census. | `dependency-graph.json` |
| Tools | 6 | The `TOOLS` array in `src/tools.ts`. | Direct search. Not a `repo-tools` metric. |
| Test cases | 88 | The `test(` calls in the ten files of `test/`. | Direct count. Not a `repo-tools` metric. |

The 30 exports in `src/` are the declarations that start at the first column of a file in `src/`. The `src/index.ts` module exports nothing.

## Directory structure

```
scieng-mcp/
├── src/                    Server source. 9 files, 770 lines.
├── test/                   node:test suites. 10 files, 996 lines.
├── scripts/                Bundle build, network guard for the tests, handshake check. 3 files, 118 lines.
├── smoke/                  Live-service smoke test. 1 file, 67 lines. No package script runs it.
├── plugin/                 Files that the plugin installs.
│   ├── .claude-plugin/     Plugin manifest.
│   ├── .mcp.json           Launch definition. Node runs bundle/index.mjs.
│   ├── bundle/             Committed build output. 14 files.
│   ├── commands/           Seven slash commands, one Markdown file each.
│   ├── skills/scieng/      The skill. 9 Markdown files and 2 TypeScript files, 1015 lines of code.
│   └── README.md           User guide for the plugin.
├── docs/architecture/      These documents and the generated reports.
├── .github/workflows/      Continuous integration and Dependabot automerge.
├── package.json            Scripts, dependencies and the package entry.
├── bun.lock                Bun lockfile. CI installs from it.
└── package-lock.json       npm lockfile. Dependabot reads it.
```

The line counts of the five code folders (`src/`, `test/`, `scripts/`, `smoke/` and the two code files under `plugin/skills/scieng/`) add up to 3378. This total equals `totalLinesOfCode`. Source: the Lines column of [FILE_INVENTORY.md](FILE_INVENTORY.md).

## Tools

| Tool | Writes | Remote service | Purpose |
|---|---|---|---|
| `render_mermaid` | One SVG file | mermaid.ink | Renders Mermaid diagram source. |
| `render_dot` | One SVG or PNG file | None. The engine runs on this machine. | Renders Graphviz DOT source. |
| `render_latex` | One SVG file | latex.codecogs.com | Renders LaTeX math and the math blocks of a document. |
| `render_html` | One HTML file | None at render time. The browser loads the pinned files when the page opens. | Builds one page from typed blocks. |
| `ooxml_replace` | The `word/document.xml` file, in place | None | Replaces text in runs and keeps the run formatting. |
| `capabilities` | Nothing | None | Lists the render pairs of the engine and their readiness. |

## Commands

```
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run bundle
bun run smoke
```

Each command runs one package script. `typecheck` runs `tsc --noEmit`. `test` runs `node --test`. `bundle` runs `node scripts/bundle.mjs`. `smoke` runs `node scripts/smoke-handshake.mjs`.

## Design principles

1. Source text leaves the machine only for `render_mermaid` and `render_latex`. A check: only `src/render-mermaid.ts` and `src/render-latex.ts` call `httpText`.
2. A render call writes one output file. The call returns the path and the byte count. The call never returns the file content. A check: each render handler returns `path` and `bytes`.
3. A generated page loads exact-version files only. Each file has a Subresource Integrity hash. A check: every entry of `HEAD_IMPORTS` in `src/render-html.ts` has an `integrity` attribute.
4. Each tool input object refuses an unknown key, except the `capabilities` tool. A check: each schema in `src/tools.ts` that takes input is `.strict()` or sets `additionalProperties: false`. The `capabilities` handler accepts any argument. [API.md](API.md) states the exception.
5. The committed bundle equals a fresh build. A check: the "Bundle is current" step of the CI workflow.
6. The server needs no install step at run time. A check: the bundle gate test runs the bundle in a folder with no `node_modules`.
7. The plugin folder holds no package manifest and no lockfile. A check: `plugin/` has no `package.json` and no lockfile.
8. Source code reads no environment variable and carries no type-check suppression. A check: a search of `src/` for `process.env` and for suppression comments finds no match.

## How the code gets loaded

- **Static imports.** `src/index.ts` imports `src/tools.ts`. `src/tools.ts` imports the renderers, `src/render-lib.ts`, `src/engine-config.ts` and `src/ooxml-edit.ts`. The census graph shows each edge.
- **Name-keyed dispatch.** `makeHandlers()` returns one handler for each tool name. `dispatchTool()` looks up the name with `Object.hasOwn`. The server answers the protocol methods `tools/list` and `tools/call`.
- **Build-time constants.** The build replaces `__PKG_VERSION__` and `__SCIENG_BUNDLED__`. An unbundled run finds neither constant.
- **Loads by URL inside the engine.** The engine loads its worker module and two backend modules by URL. The build writes `entry.mjs`, `graph/backend-svg.mjs` and `graph/backend-png.mjs` at the paths that the engine computes. No import statement in `src/` reaches these files.
- **Plugin content.** Each command is a Markdown file in `plugin/commands/`. The skill is Markdown text in `plugin/skills/scieng/`. The skill names `engineering-patterns.ts` as a reference to copy from. No import reaches that file.

## Unused code

- Three files have no importer: `plugin/skills/scieng/engineering-patterns.ts`, `plugin/skills/scieng/stubs/docx.d.ts` and `smoke/render.smoke.ts`. The first two are reference files for the skill. The third runs on demand. The census classifies all three as orphaned. The classification is correct for a static import graph. The classification does not show intent.
- Five exports have no importer outside their own module: `HttpOptions`, `Block`, `BlockType`, `EditResult` and `ToolResult`. Each is a type declaration.
- The package entry module, `plugin/bundle/index.mjs`, exports nothing. Removing a `src/` export therefore changes no package API. The public surface is the set of six tools. Removing a tool is a breaking change for each client that calls it. See [API.md](API.md).

## Related documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): the design decisions, the constraints and the trust model.
- [COMPONENTS.md](COMPONENTS.md): each module, with its exported declarations.
- [DATAFLOW.md](DATAFLOW.md): the path of a tool call, from the request to the result.
- [API.md](API.md): the tools, their arguments and results, and the exports of each module.
- [FILE_INVENTORY.md](FILE_INVENTORY.md), [TEST_COVERAGE.md](TEST_COVERAGE.md), [DEPENDENCY_GRAPH.md](DEPENDENCY_GRAPH.md), [unused-analysis.md](unused-analysis.md) and [duplicate-symbols.md](duplicate-symbols.md): generated reports.
- [../../README.md](../../README.md): install steps and the tool table.
- [../../CHANGELOG.md](../../CHANGELOG.md): changes, by version.

## Verification

Generated 2026-11-03 by `repo-tools map`.
Regenerate: `repo-tools map . --out=docs/architecture` · Check: `repo-tools check . --docs=docs/architecture`

| Claim | Value | Source |
|---|---|---|
| totalSourceFiles | 25 | dependency-graph.json |
| totalLinesOfCode | 3378 | dependency-graph.json |
| totalExports | 80 | dependency-graph.json |
| runtimeCircularDeps | 0 | dependency-graph.json |
| typeOnlyCircularDeps | 0 | dependency-graph.json |
