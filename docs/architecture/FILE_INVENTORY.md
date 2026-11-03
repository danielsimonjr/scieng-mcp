<!-- repo-map:no-verification -->
<!-- GENERATED FILE -- do not edit by hand.
     Regenerate with `repo-tools map`. -->

# Complete File Inventory

This report lists each source file that the map census finds, with a disposition. The census reads the files that git tracks. Outside a git work tree, it walks the folder. The census skips tool state, dependency folders and build output (for example `.git/`, `node_modules/`, `dist/` and `target/`), and `obj/` and `bin/` for C#.

**Language**: typescript

**Total files**: 25

## Disposition counts

| Disposition | Count | Meaning |
| --- | --: | --- |
| `reachable` | 8 | A `src`-area file that an entry root reaches. |
| `build-entry` | 1 | A `src`-area file that is an entry root. |
| `test-only` | 0 | A `src`-area file that only a test reaches. |
| `orphan` | 3 | A `src`-area file that nothing reaches. Delete it, or wire it to a root. |
| `test` | 10 | A file in a `test/` or `tests/` folder, or a `*.test.ts` or `*.spec.ts` file. |
| `tool` | 3 | A file in a `tools/` or `scripts/` folder outside `src/`. |
| `config` | 0 | A `*.config.*` file of TypeScript or JavaScript. |
| `example` | 0 | A file in `examples/` or `docs/`. |
| `bench` | 0 | A file in `bench/` or `benchmarks/`, or a `*.bench.*` file. |
| **Total** | **25** | |

## Per-area counts

| Area | Files |
| --- | --: |
| `src` | 12 |
| `tests` | 10 |
| `tools` | 3 |

## Per-package counts

| Package | Files |
| --- | --: |
| `(root)` | 16 |
| `scieng-mcp` | 9 |

## All files

| File | Package | Area | Disposition | Lines |
| --- | --- | --- | --- | --: |
| `plugin/skills/scieng/engineering-patterns.ts` | (root) | src | orphan | 962 |
| `plugin/skills/scieng/stubs/docx.d.ts` | (root) | src | orphan | 53 |
| `scripts/block-network.mjs` | (root) | tools | tool | 37 |
| `scripts/bundle.mjs` | (root) | tools | tool | 59 |
| `scripts/smoke-handshake.mjs` | (root) | tools | tool | 22 |
| `smoke/render.smoke.ts` | (root) | src | orphan | 67 |
| `src/engine-config.ts` | scieng-mcp | src | reachable | 23 |
| `src/index.ts` | scieng-mcp | src | build-entry | 34 |
| `src/ooxml-edit.ts` | scieng-mcp | src | reachable | 88 |
| `src/render-dot.ts` | scieng-mcp | src | reachable | 16 |
| `src/render-html.ts` | scieng-mcp | src | reachable | 134 |
| `src/render-latex.ts` | scieng-mcp | src | reachable | 105 |
| `src/render-lib.ts` | scieng-mcp | src | reachable | 100 |
| `src/render-mermaid.ts` | scieng-mcp | src | reachable | 26 |
| `src/tools.ts` | scieng-mcp | src | reachable | 244 |
| `test/bundle-gate.test.ts` | (root) | tests | test | 181 |
| `test/engine-config.test.ts` | (root) | tests | test | 15 |
| `test/ooxml-edit.test.ts` | (root) | tests | test | 70 |
| `test/plugin-content.test.ts` | (root) | tests | test | 131 |
| `test/render-dot.test.ts` | (root) | tests | test | 56 |
| `test/render-html.test.ts` | (root) | tests | test | 111 |
| `test/render-latex.test.ts` | (root) | tests | test | 96 |
| `test/render-lib.test.ts` | (root) | tests | test | 97 |
| `test/render-mermaid.test.ts` | (root) | tests | test | 27 |
| `test/tools.test.ts` | (root) | tests | test | 212 |

## Skipped links

Links (symbolic links and junctions) that the census did not follow. A link can point to another repository, so no file behind a link is in this inventory or in the graph.

_None._

## Warnings

- package.json entry 'plugin/bundle/index.mjs' did not resolve to a known source file. The entry is ignored.
