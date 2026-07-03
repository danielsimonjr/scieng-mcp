# TODO

- Consider a `render_wavedrom` SVG tool (currently `wavedrom` is only
  supported as a `render_html` block type, not a standalone renderer).
- Revisit codecogs rate limits if `render_latex` failures recur in practice —
  may need a fallback renderer or local rendering path.
- Align `RENDERERS.md`/`SCIENG.md` hand-authoring templates with the
  SRI-pinned imports `buildHtml` emits (they still document floating pins
  without integrity attributes).
