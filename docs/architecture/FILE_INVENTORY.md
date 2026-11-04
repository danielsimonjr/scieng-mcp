<!-- repo-map:no-verification -->
<!-- GENERATED FILE -- do not edit by hand.
     Regenerate with `repo-tools map`. -->

# Complete File Inventory

This report lists each source file that the map census finds, with a disposition. The census reads the files that git tracks. Outside a git work tree, it walks the folder. The census skips tool state, dependency folders and build output (for example `.git/`, `node_modules/`, `dist/` and `target/`), and `obj/` and `bin/` for C#.

**Language**: typescript

**Total files**: 29

## Disposition counts

| Disposition | Count | Meaning |
| --- | --: | --- |
| `reachable` | 9 | A `src`-area file that an entry root reaches. |
| `build-entry` | 1 | A `src`-area file that is an entry root. |
| `test-only` | 0 | A `src`-area file that only a test reaches. |
| `orphan` | 3 | A `src`-area file that nothing reaches. Delete it, or wire it to a root. |
| `test` | 13 | A file in a `test/` or `tests/` folder, or a `*.test.ts` or `*.spec.ts` file. |
| `tool` | 3 | A file in a `tools/` or `scripts/` folder outside `src/`. |
| `config` | 0 | A `*.config.*` file of TypeScript or JavaScript. |
| `example` | 0 | A file in `examples/` or `docs/`. |
| `bench` | 0 | A file in `bench/` or `benchmarks/`, or a `*.bench.*` file. |
| **Total** | **29** | |

## Per-area counts

| Area | Files |
| --- | --: |
| `src` | 13 |
| `tests` | 13 |
| `tools` | 3 |

## Per-package counts

| Package | Files |
| --- | --: |
| `(root)` | 19 |
| `scieng-mcp` | 10 |

## All files

| File | Package | Area | Disposition | Lines |
| --- | --- | --- | --- | --: |
| `plugin/skills/scieng/engineering-patterns.ts` | (root) | src | orphan | 962 |
| `plugin/skills/scieng/stubs/docx.d.ts` | (root) | src | orphan | 53 |
| `scripts/block-network.mjs` | (root) | tools | tool | 37 |
| `scripts/bundle.mjs` | (root) | tools | tool | 68 |
| `scripts/smoke-handshake.mjs` | (root) | tools | tool | 22 |
| `smoke/render.smoke.ts` | (root) | src | orphan | 67 |
| `src/engine-config.ts` | scieng-mcp | src | reachable | 23 |
| `src/index.ts` | scieng-mcp | src | build-entry | 34 |
| `src/ooxml-edit.ts` | scieng-mcp | src | reachable | 213 |
| `src/render-any.ts` | scieng-mcp | src | reachable | 28 |
| `src/render-dot.ts` | scieng-mcp | src | reachable | 16 |
| `src/render-html.ts` | scieng-mcp | src | reachable | 141 |
| `src/render-latex.ts` | scieng-mcp | src | reachable | 197 |
| `src/render-lib.ts` | scieng-mcp | src | reachable | 140 |
| `src/render-mermaid.ts` | scieng-mcp | src | reachable | 23 |
| `src/tools.ts` | scieng-mcp | src | reachable | 289 |
| `test/bundle-gate.test.ts` | (root) | tests | test | 192 |
| `test/engine-config.test.ts` | (root) | tests | test | 15 |
| `test/ooxml-edit.test.ts` | (root) | tests | test | 199 |
| `test/plugin-content.test.ts` | (root) | tests | test | 141 |
| `test/render-any.test.ts` | (root) | tests | test | 32 |
| `test/render-dot.test.ts` | (root) | tests | test | 56 |
| `test/render-html.test.ts` | (root) | tests | test | 210 |
| `test/render-latex.test.ts` | (root) | tests | test | 200 |
| `test/render-lib.test.ts` | (root) | tests | test | 175 |
| `test/render-mermaid.test.ts` | (root) | tests | test | 55 |
| `test/repo-metadata.test.ts` | (root) | tests | test | 46 |
| `test/skill-cdn.test.ts` | (root) | tests | test | 105 |
| `test/tools.test.ts` | (root) | tests | test | 312 |

## Skipped links

Links (symbolic links and junctions) that the census did not follow. A link can point to another repository, so no file behind a link is in this inventory or in the graph.

_None._

## Warnings

- package.json entry 'plugin/bundle/index.mjs' did not resolve to a known source file. The entry is ignored.
