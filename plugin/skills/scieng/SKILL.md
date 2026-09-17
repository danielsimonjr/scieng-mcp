---
name: scieng
description: "Science & engineering authoring: create, edit, debug, and render technical diagrams, scientific/CS papers, and engineering Word documents. Diagrams — Mermaid (flowchart, sequence, class, state, ER, gantt, mindmap, timeline), Graphviz DOT (record nodes, HTML labels, clusters, state machines), WaveDrom timing, Bode plots, SVG circuits — rendered to self-contained HTML. LaTeX for CS/engineering papers: algorithms, pseudocode, theorems, proofs, complexity notation, BibTeX, conference classes (ACM, IEEE, NeurIPS), and format conversion (markdown to DOCX/PDF/LaTeX). Engineering Word docs (invoke document-skills:docx first): part numbers (83-xxxxx), revision history, approval/signature blocks, requirements traceability, test procedures (ATP/ESS), MIL-STD warning/caution blocks, SI-unit formatting. Use when creating or fixing diagrams, when Mermaid/DOT syntax or LaTeX compilation errors occur, or for technical document layout."
---

# Science & Engineering Skill

## Overview

Unified reference for writing correct diagram/math/document markup and rendering it as self-contained HTML playgrounds opened in the user's browser. Covers syntax rules, rendering libraries, and scientific/engineering document authoring. Also covers engineering Word/OOXML document authoring (via `document-skills:docx`).

## Quick Reference

| Need | Reference | Renderer |
|------|-----------|----------|
| Flowcharts, sequence, ER, state, gantt, etc. | <MERMAID.md> | Mermaid.js |
| Directed/undirected graphs (DOT language) | <GRAPHVIZ.md> | Viz.js (@viz-js/viz) |
| CS/eng paper LaTeX, algorithms, theorems, format conversion | <LATEX.md> | KaTeX/MathJax |
| CDN imports, version pins, all renderers | <RENDERERS.md> | — |
| Sci/eng docs: circuits, Bode plots, WaveDrom, SI units | <SCIENG.md> | MathJax + Plotly + WaveDrom + SVG |
| Engineering Word docs: part numbers, revision/approval, ATP/ESS, MIL-STD | <ENGINEERING-DOCX.md> | document-skills:docx |
| Data charts, scientific plots, 3D, code highlighting | <RENDERERS.md> | Chart.js / Plotly / D3 / Three.js / Highlight.js |
| Structuring/writing CS & scientific papers | <PAPERS.md> | — |
| Playground pattern background & rationale | <Claude Code HTML Playground.md> | — |

## When NOT to Use

- Pure terminal text output with no visualization needed
- User already has a rendering pipeline (e.g., local LaTeX install, Mermaid CLI)
- Simple inline code block -- just use markdown fenced blocks

## Core Workflow

1. Identify what the user needs: a static SVG artifact, an interactive HTML
   playground, a LaTeX paper, or an engineering Word document.
2. Consult the syntax reference first (<MERMAID.md>, <GRAPHVIZ.md>, <LATEX.md>) —
   the MCP tools render what you write; they don't fix syntax errors.
3. Render with the scieng-mcp tools:
   - Mermaid/DOT/LaTeX → static SVG file: `render_mermaid` / `render_dot` /
     `render_latex` (inline `source` or `input_path`; returns the saved path).
   - Interactive playground (common case): `render_html` with typed blocks
     (mermaid | dot | latex | plotly | wavedrom | raw-html). Only the needed
     CDN imports are emitted.
   - Complex/custom pages (bespoke JS, Three.js, D3, custom layout):
     hand-author the HTML per <RENDERERS.md> — the tool covers the common
     case only.
   - Batch OOXML edits on an unpacked Word doc: `ooxml_replace`. One-off
     edits: use the Edit tool on word/document.xml directly
     (see <ENGINEERING-DOCX.md>).
4. Open HTML results in the browser: `start <file>.html` (Windows),
   `open` (macOS), `xdg-open` (Linux).

## Renderer Content Patterns

### Mermaid

Wrap diagrams in `<pre class="mermaid">` blocks. See <MERMAID.md> for syntax rules.

```html
<pre class="mermaid">
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]
  B -->|No| D[Other Action]
</pre>
```

### KaTeX

Use `$$ ... $$` (display) and `\( ... \)` (inline). See <LATEX.md> for syntax.

```html
<p>The quadratic formula is $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$</p>
```

Switch to MathJax when the user needs `\newcommand` across blocks, `\begin{align}`, `\ce{}` chemistry, or `\qty{}` physics. See <RENDERERS.md> for MathJax config, or <SCIENG.md> for a complete engineering setup.

### Graphviz

Render DOT strings via Viz.js. See <GRAPHVIZ.md> for DOT syntax rules, <RENDERERS.md> for layout engines.

```html
<div id="graph"></div>
<script>
  Viz.instance().then(viz => {
    document.getElementById('graph').appendChild(
      viz.renderSVGElement('digraph { rankdir=LR; A -> B -> C; }')
    );
  });
</script>
```

### SVG

Embed directly. No library needed. For circuit schematics with `<defs>`/`<use>` symbol libraries, see <SCIENG.md>.

## Rendering to SVG (Standalone)

Three scieng-mcp tools render markup to SVG files, no local installs needed:

| Tool | Input | API Used |
|------|-------|----------|
| `render_latex` | inline `source` or `input_path` (`.tex`) | latex.codecogs.com |
| `render_dot` | inline `source` or `input_path` (`.dot`) | quickchart.io/graphviz |
| `render_mermaid` | inline `source` or `input_path` (`.mmd`) | mermaid.ink |

Each call returns `{path, bytes}` for the saved SVG (`render_latex` also returns a
`failures` array for any block that didn't compile, without throwing).

**Privacy:** the tools send your input's contents to third-party web APIs (quickchart.io,
codecogs.com, mermaid.ink). A `.dot` file with `URL="…"` edges may cause the remote service to
fetch that URL (SSRF) — don't render untrusted DOT.

## Common Pitfalls

- **KaTeX `renderMathInElement` undefined**: Forgetting `defer` on scripts or no `DOMContentLoaded` listener.
- **Mermaid not rendering dynamic content**: Use `mermaid.run({ querySelector: '.mermaid' })` instead of `startOnLoad` for injected diagrams.
- **Viz.js synchronous call**: `Viz.instance()` is async. Always use `.then()` or `await`.
- **Dollar sign conflicts**: Prefer `\(...\)` for inline math if the document has currency `$` amounts.
- **Three.js r128 limits**: No `CapsuleGeometry`, no `OrbitControls`. Use `CylinderGeometry`/`SphereGeometry` and manual camera controls.

## Dependencies

All libraries load from CDN at runtime. No installation required. For the library size/compatibility matrix, see <RENDERERS.md>.
