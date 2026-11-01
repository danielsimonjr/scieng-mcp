# TODO

- Consider a `render_wavedrom` SVG tool (currently `wavedrom` is only
  supported as a `render_html` block type, not a standalone renderer).
- Revisit codecogs rate limits if `render_latex` failures recur in practice —
  may need a fallback renderer or local rendering path.
- Align `RENDERERS.md`/`SCIENG.md` hand-authoring templates with the
  SRI-pinned imports `buildHtml` emits (they still document floating pins
  without integrity attributes).

- Build `sciengjs`. Move the adapter onto `sciengjs`. The design and the build plan are in https://github.com/danielsimonjr/sciengjs (`docs/superpowers/`).
- The command test pass found three defects. Fix the three defects in the next adapter release. The WaveDrom diagram is hard to read on the dark page of `render_html`. `MERMAID.md`, `GRAPHVIZ.md` and `LATEX.md` name render scripts that do not exist (`render-*-to-svg.ts`). The circuit command and `SCIENG.md` do not forbid a wire that crosses a part.
- 2026-11-01 five-axis (docs-only change: a pointer to the engine repository and three recorded defects): speed, stability, reliability, security and maintainability not changed by the change. Left: the three defects above.
