# TODO

- Consider a `render_wavedrom` SVG tool (currently `wavedrom` is only
  supported as a `render_html` block type, not a standalone renderer).
- Revisit codecogs rate limits if `render_latex` failures recur in practice —
  may need a fallback renderer or local rendering path.
- Align `RENDERERS.md`/`SCIENG.md` hand-authoring templates with the
  SRI-pinned imports `buildHtml` emits (they still document floating pins
  without integrity attributes).

- Build `sciengjs`. Move the adapter onto `sciengjs`. The design and the build plan are in https://github.com/danielsimonjr/sciengjs (`docs/superpowers/`). Status 2026-11-02: `render_dot` runs on the engine in 0.5.0, on sciengjs `^0.1.0`. Open until sciengjs 0.1.1 is on npm: the dependency and lockfile bump, the bundle gate (engine assets and WASM), and the release.
- 2026-11-01 five-axis (docs-only change: a pointer to the engine repository and three recorded defects): speed, stability, reliability, security and maintainability not changed by the change. Left: the three defects above (fixed in 0.4.1).
- 2026-11-01 five-axis (0.4.1, the three command-test defects and a fourth missing script in `ENGINEERING-DOCX.md`). Reliability is better. The skill names only real tools, and a test catches a missing script. Maintainability is better. The WaveDrom style is set per block type, like the init scripts. Speed, stability and security are not changed. Left: the open items above.
- 2026-11-01 five-axis (0.4.2, runtime advisories). Security is better. MCP SDK 2.4.0 and zod 4.6.7 clear 5 Dependabot alerts in the shipped bundle. Speed was measured and is not worse. The bundle grows by 21 % in bytes, and start to result takes 0.7 to 1.1 s. Stability, reliability and maintainability are not changed. Left: two lockfiles (`bun.lock` for CI, `package-lock.json` for Dependabot) carry the same versions. The root `bun` ecosystem of Dependabot does not work (see the 2026-10-01 entry).
- 2026-11-02 five-axis (0.5.0, `render_dot` through the sciengjs engine). Speed: one render call takes 0.34 s for SVG and 0.44 s for PNG, measured by the unit tests on this machine. The remote path was not timed, so no comparison is made. Stability: the DOT tests make no network request. Reliability: DOT no longer depends on quickchart.io. Security: no DOT source leaves the machine, and the engine removes `image` and `stylesheet` attributes with a warning. Maintainability: one remote renderer fewer, and a CI check that the committed bundle matches a fresh build. Left: the sciengjs 0.1.1 bump and the bundle gate (see the sciengjs line above). The CI bundle check has not run on a runner yet.
