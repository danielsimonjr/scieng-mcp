# TODO

- Consider a `render_wavedrom` SVG tool (currently `wavedrom` is only
  supported as a `render_html` block type, not a standalone renderer).
- Revisit codecogs rate limits if `render_latex` failures recur in practice —
  may need a fallback renderer or local rendering path.
- Align `RENDERERS.md`/`SCIENG.md` hand-authoring templates with the
  SRI-pinned imports `buildHtml` emits (they still document floating pins
  without integrity attributes).

- Build `sciengjs`. Move the adapter onto `sciengjs`. The design and the build plan are in https://github.com/danielsimonjr/sciengjs (`docs/superpowers/`).
- 2026-11-01 five-axis (docs-only change: a pointer to the engine repository and three recorded defects): speed, stability, reliability, security and maintainability not changed by the change. Left: the three defects above (fixed in 0.4.1).
- 2026-11-01 five-axis (0.4.1, the three command-test defects and a fourth missing script in `ENGINEERING-DOCX.md`): reliability better (the skill names only real tools; a test now catches a missing script); maintainability better (the WaveDrom style is per block type, like the init scripts); speed, stability and security not changed. Left: the open items above.
- 2026-11-01 five-axis (0.4.2, runtime advisories): security better (MCP SDK 2.4.0 and zod 4.6.7 clear 5 Dependabot alerts in the shipped bundle); speed measured, not worse (bundle +21 % in bytes, start-to-result 0.7 to 1.1 s); stability, reliability and maintainability not changed. Left: two lockfiles (`bun.lock` for CI, `package-lock.json` for Dependabot) carry the same versions; the root `bun` ecosystem of Dependabot does not work (see the 2026-10-01 entry).
