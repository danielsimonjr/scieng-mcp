# AGENTS.md

Rules for an agent that works on this repository. `CLAUDE.md` loads this file.

## What this repository is

scieng-mcp is an MCP server over stdio and a Claude Code plugin. The server has six tools:

| Tool | Job |
|---|---|
| `render_mermaid` | Mermaid source to an SVG file, through mermaid.ink |
| `render_dot` | Graphviz DOT source to an SVG or PNG file, drawn on this machine by the sciengjs engine |
| `render_latex` | LaTeX math to an SVG file, through latex.codecogs.com |
| `render_html` | typed blocks to one self-contained HTML page with pinned CDN imports |
| `ooxml_replace` | find and replace in an unpacked `word/document.xml`, with the run formatting kept |
| `capabilities` | the render pairs of the engine (type and format) with their readiness. Read-only |

The plugin also ships the `scieng` skill and one slash command per diagram type.

## Layout

| Path | Holds |
|---|---|
| `src/` | the server source in TypeScript. `index.ts` starts the server; `tools.ts` defines the tools and their handlers. |
| `test/` | `node:test` tests. `plugin-content.test.ts` checks the commands and the skill against `TOOLS`. |
| `smoke/`, `scripts/smoke-handshake.mjs` | checks against the live services and of the built bundle |
| `scripts/bundle.mjs` | esbuild. It writes `src/index.ts`, the engine worker and its two backends to `plugin/bundle/`, and the engine assets to `plugin/bundle/assets/` |
| `plugin/` | everything that the plugin installs: `.claude-plugin/plugin.json`, `.mcp.json`, `bundle/`, `commands/`, `skills/scieng/`, `README.md` |

`plugin/` holds no `package.json` and no lockfile. The plugin installer runs a package install when it finds both files. The server needs no runtime package. Keep the two out of `plugin/`.

## Commands

```bash
bun install --frozen-lockfile
bun run typecheck      # tsc --noEmit
bun run test           # node --test: unit tests and plugin-content tests
bun run bundle         # writes plugin/bundle/ (index.mjs and the files beside it)
bun run smoke          # starts the bundle and sends an MCP initialize
```

CI runs the typecheck, the tests, a Node load of the bundle, and a check that the committed `plugin/bundle/` equals a fresh build. CI runs on Ubuntu and on Windows. Windows is the production platform.

## Rules

- **The bundle is committed.** After each change under `src/`, run `bun run bundle`. Commit the files of `plugin/bundle/` in the same commit as the source.
- **The tests come first.** Write the failing test, see it fail, then change the code or the prose.
- **A command or the skill names only real tools and real reference files.** `plugin-content.test.ts` checks this. Add a new command to its `EXPECTED` list, and to the command table of `SKILL.md`.
- **Privacy is part of each command.** A command that sends source to a remote service names the service and offers `--local`. `render_html` pages load only exact-pinned CDN files with a Subresource Integrity hash. A new pin and its hash change together, in `src/render-html.ts`.
- **Trust model of `render_html`.** Mermaid and LaTeX sources are HTML-escaped. DOT and Plotly sources go in as JSON with `<` escaped. WaveDrom goes in as it is. The tool rejects a source with `<script`, `</script` or `<!--` in any letter case. `raw-html` goes in as it is: the caller owns its safety.
- **No machine names and no personal names** in `plugin/`. Use roles: "the user", "the model host".
- **Documents use ASD-STE100 Simplified Technical English**: one instruction per sentence, active voice, present tense.

## Release and deploy

The marketplace entry lives in the separate `skills` repository (`.claude-plugin/marketplace.json`). It installs this repository with `git-subdir` and `path: "plugin"`. The plugin cache uses the version as its key. A change that ships without a new version deploys nothing.

1. Bump the version in `package.json` and `plugin/.claude-plugin/plugin.json`, in the same commit as the content. The test `test/repo-metadata.test.ts` fails when the two versions differ. Run `bun run bundle`, because the bundle reads the version from `package.json`.
2. Add the CHANGELOG entry. Commit and push to `main`. Check that CI passes for that commit.
3. In the `skills` repository, set the same version on the `scieng-mcp` entry. Commit, push and check CI.
4. Run `claude plugin marketplace update local-marketplace`, then `claude plugin update scieng-mcp@local-marketplace`. The user runs `/reload-plugins`.
5. Check the deploy: compare the files of the plugin cache folder for the new version with `plugin/`, one by one. Then run one command from the cache.

This repository is public. A commit message or a PR body holds no session URL and no session trailer.
