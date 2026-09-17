# Claude Code HTML Playground: Rendering Capabilities for Mermaid, Graphviz, LaTeX & Beyond

## Executive Summary

The **Claude Code “HTML Playground”** is not a single built-in feature — it refers to the **Playground plugin** from Anthropic’s official `claude-plugins-official` repository, combined with Claude Code’s general ability to generate self-contained HTML files and open them in the user’s default browser via `open <filename>.html`. This architecture has **profound implications** for what can be rendered, because the rendering environment is the user’s full browser, not a sandboxed terminal or constrained widget.

**Short answer**: Yes — Claude Code’s HTML playground approach can render Mermaid charts, Graphviz diagrams, LaTeX/KaTeX math, and virtually any web-renderable asset, because the output is a standard HTML file opened in a real browser. But the *how* varies by technology.

-----

## 1. The Architecture: What “HTML Playground” Actually Is

### 1.1 The Official Playground Plugin

Anthropic maintains an official **Playground plugin** in [`anthropics/claude-plugins-official/plugins/playground`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/playground). It’s a Claude Code Skill with these core principles:

- **Single HTML file** — All CSS and JS are inlined. No external dependencies.
- **Live preview** — Controls update a visual preview instantly (no “Apply” button).
- **Prompt output** — Generates natural-language prompts the user can copy back into Claude.
- **Opens in browser** — After writing the HTML file, runs `open <filename>.html` to launch it.
- **Dark theme, presets, state management** — Follows opinionated UI patterns.

The plugin provides **templates** for different playground types:

|Template           |Purpose                                                         |
|-------------------|----------------------------------------------------------------|
|`design-playground`|Visual design decisions (components, layouts, color, typography)|
|`data-explorer`    |Data and query building (SQL, APIs, regex)                      |
|`concept-map`      |Learning and exploration (concept maps, knowledge gaps)         |
|`document-critique`|Document review with approve/reject/comment                     |
|`diff-review`      |Code review (git diffs, PRs, line-by-line commenting)           |
|`code-map`         |Codebase architecture (component relationships, data flow)      |

### 1.2 The General Pattern (Beyond the Plugin)

Even *without* the Playground plugin, Claude Code can:

1. Generate any `.html` file with inlined JavaScript/CSS
1. Write it to disk
1. Execute `open filename.html` (macOS) or `xdg-open filename.html` (Linux) to launch it in the default browser
1. The browser then renders whatever the HTML contains — including any JS library loaded via CDN or inlined

This is the fundamental mechanism. The “playground” is just an opinionated structure on top of this.

-----

## 2. Rendering Capabilities by Technology

### 2.1 Mermaid Charts ✅ FULLY SUPPORTED

**How it works**: Claude Code generates an HTML file that includes the [Mermaid.js](https://mermaid.js.org/) library (either via CDN like `https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js` or inlined) and embeds Mermaid diagram definitions in `<pre class="mermaid">` blocks.

**Key details**:

- All Mermaid diagram types are supported: flowcharts, sequence diagrams, Gantt charts, class diagrams, ER diagrams, state diagrams, Git graphs, pie charts, mindmaps, etc.
- The Playground plugin’s “no external dependencies” rule would require *inlining* Mermaid.js (~2MB minified), which is feasible but heavy. In practice, using a CDN `<script>` tag is far more practical and is the common pattern.
- There is also a dedicated **[claude-mermaid MCP server](https://github.com/veelenga/claude-mermaid)** that provides live-reload Mermaid previews via a local WebSocket server — a more sophisticated approach for iterative diagram development.

**Current gap in Claude Code itself**: As of late January 2026, there is an [open feature request (#14375)](https://github.com/anthropics/claude-code/issues/14375) for native Mermaid rendering in the Claude Code terminal (via ASCII rendering), and [another (#20529)](https://github.com/anthropics/claude-code/issues/20529) for native rendering in the VSCode extension. These are *not yet implemented* — which is precisely why the HTML-file-in-browser approach is the current workaround.

**Example pattern**:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad: true, theme: 'dark'});</script>
</head>
<body>
  <pre class="mermaid">
    graph TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Action 1]
      B -->|No| D[Action 2]
  </pre>
</body>
</html>
```

### 2.2 LaTeX / KaTeX / MathJax ✅ FULLY SUPPORTED

**How it works**: Claude Code generates an HTML file that includes either [KaTeX](https://katex.org/) or [MathJax](https://www.mathjax.org/) via CDN, then embeds LaTeX expressions using the appropriate delimiters.

**KaTeX vs MathJax**:

- **KaTeX**: Faster rendering, smaller footprint. Best for real-time interactive playgrounds. Supports most common LaTeX math.
- **MathJax**: More complete LaTeX support (including obscure packages, environments). Heavier but more faithful to full LaTeX.

**Important nuance from claude.ai Artifacts**: In the claude.ai web interface, Artifacts support LaTeX via `application/x-latex` content type — but it renders the *code*, not the typeset output. The HTML playground approach in Claude Code is actually *superior* here because it uses KaTeX/MathJax to produce properly rendered math.

**Example pattern**:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
</head>
<body onload="renderMathInElement(document.body);">
  <p>The quadratic formula: $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$</p>
  <p>Inline: \(E = mc^2\)</p>
</body>
</html>
```

### 2.3 Graphviz / DOT Language ⚠️ SUPPORTED WITH CAVEATS

**How it works**: Graphviz is traditionally a *native binary* (the `dot` command). In the browser, there are two approaches:

1. **Viz.js / @viz-js/viz** — A WebAssembly/Emscripten port of Graphviz that runs entirely in the browser. This is the recommended approach for HTML playgrounds.
1. **d3-graphviz** — A D3.js-based wrapper around Viz.js that adds animation and DOM manipulation capabilities.

**Key details**:

- Native Graphviz (`dot`, `neato`, `fdp`, etc.) is NOT available in the browser — it requires the Graphviz binary. Claude Code *could* install Graphviz on the system and render to SVG/PNG, then embed the result in HTML, but this loses interactivity.
- Viz.js is the web-native solution and supports all major Graphviz layout engines.
- From the claude.ai Artifacts research: `text/vnd.graphviz` is a recognized content type, but it shows the DOT code rather than rendering it. The HTML playground approach again provides superior results.

**Important**: The Playground plugin’s strict “no external dependencies” rule makes pure Graphviz rendering challenging because Viz.js is quite large (~3-5MB). Using a CDN is the practical path.

**Example pattern**:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@viz-js/viz"></script>
</head>
<body>
  <div id="graph"></div>
  <script>
    Viz.instance().then(viz => {
      const svg = viz.renderSVGElement(`
        digraph G {
          rankdir=LR;
          A -> B -> C;
          A -> C;
          B -> D;
        }
      `);
      document.getElementById('graph').appendChild(svg);
    });
  </script>
</body>
</html>
```

### 2.4 SVG ✅ FULLY SUPPORTED (Native)

SVG is natively supported in all browsers. Claude Code can:

- Generate inline SVG directly in HTML
- Create standalone `.svg` files
- Use SVG as the rendering target for other tools (Mermaid renders to SVG, Viz.js renders to SVG, etc.)

### 2.5 D3.js Visualizations ✅ FULLY SUPPORTED

D3.js is available via CDN and is a first-class citizen in browser-based HTML files. Claude Code can generate sophisticated data visualizations, force-directed graphs, geographic maps, and more.

### 2.6 Three.js / WebGL ✅ SUPPORTED

3D rendering via Three.js is possible in HTML playgrounds. Claude Code can generate interactive 3D scenes, which is particularly powerful for visualizing mathematical surfaces, molecular structures, or architectural models.

### 2.7 Plotly.js ✅ FULLY SUPPORTED

Scientific plotting with Plotly.js via CDN provides interactive charts with zoom, pan, hover tooltips, and export capabilities.

### 2.8 Chart.js ✅ FULLY SUPPORTED

Lightweight charting via Chart.js is well-suited for the playground pattern — small library size, responsive, interactive.

-----

## 3. Comparison: Playground vs. Claude.ai Artifacts

|Capability                |Claude.ai Artifacts                   |Claude Code HTML Playground             |
|--------------------------|--------------------------------------|----------------------------------------|
|**Mermaid**               |✅ Native `application/vnd.ant.mermaid`|✅ Via Mermaid.js in HTML                |
|**LaTeX**                 |⚠️ Shows code, not rendered            |✅ Full rendering via KaTeX/MathJax      |
|**Graphviz/DOT**          |⚠️ Shows code, not rendered            |✅ Via Viz.js in HTML                    |
|**React**                 |✅ Native `application/vnd.ant.react`  |✅ Via bundled React in HTML             |
|**SVG**                   |✅ Native `.svg` rendering             |✅ Native browser rendering              |
|**Interactive controls**  |Limited (React state only)            |✅ Full DOM + any JS framework           |
|**External CDN libraries**|⚠️ Limited allowlist                   |✅ Any CDN, unrestricted                 |
|**File system access**    |❌ Sandboxed                           |✅ Full local file access                |
|**Local storage**         |❌ Blocked                             |✅ Full browser storage APIs             |
|**Multi-file**            |❌ Single artifact                     |✅ Multiple files + assets               |
|**Live reload**           |❌                                     |✅ Via MCP servers (e.g., claude-mermaid)|

**Key insight**: The HTML playground approach is *more powerful* than Artifacts for rendering complex assets because it runs in the user’s full, unrestricted browser environment.

-----

## 4. The Ecosystem: Plugins That Enhance Rendering

### 4.1 claude-mermaid MCP Server

- **Repo**: [veelenga/claude-mermaid](https://github.com/veelenga/claude-mermaid)
- **Capabilities**: Live-reload Mermaid preview in browser, SVG/PNG/PDF export, multiple themes, multiple simultaneous previews
- **How**: Runs a local WebSocket server; diagram auto-refreshes as Claude edits

### 4.2 Mermaid Chart MCP (Connected to this conversation)

- Anthropic’s own Mermaid Chart MCP server for validating and rendering diagrams
- Can generate summary and title metadata for diagrams

### 4.3 The Playground Plugin

- **Source**: `anthropics/claude-plugins-official/plugins/playground`
- **Install**: `/plugin install @anthropics/claude-plugins-official --skill playground`
- **Templates**: design, data-explorer, concept-map, document-critique, diff-review, code-map

### 4.4 Frontend Design Skill

- **Source**: Built into Claude Code (`claude-code/plugins/frontend-design`)
- **Purpose**: High-quality, distinctive HTML/CSS/JS generation
- **Relevance**: Produces the visual quality layer on top of any playground

-----

## 5. Practical Patterns for Maximum Rendering Power

### 5.1 The “Universal Renderer” HTML Template

A single HTML file that can render Mermaid, LaTeX, Graphviz, and syntax-highlighted code simultaneously:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Universal Renderer</title>
  <!-- KaTeX for LaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <!-- Mermaid for diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <!-- Viz.js for Graphviz -->
  <script src="https://unpkg.com/@viz-js/viz"></script>
  <!-- Highlight.js for code -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
</head>
<body onload="renderMathInElement(document.body); mermaid.initialize({startOnLoad:true, theme:'dark'}); hljs.highlightAll();">
  <!-- All four rendering engines active simultaneously -->
</body>
</html>
```

### 5.2 The Self-Contained Offline Pattern

For the Playground plugin’s “no external dependencies” requirement, Claude Code can:

1. Download library files via `curl` or `wget`
1. Inline them into the HTML using `<script>` and `<style>` blocks
1. Result: A single HTML file that works offline, but may be several MB

### 5.3 The Live-Reload Development Pattern

For iterative work:

1. Claude Code writes/updates an HTML file
1. A file-watcher (or the claude-mermaid MCP’s WebSocket server) detects changes
1. The browser auto-reloads
1. The user sees updates in near-real-time

-----

## 6. Current Limitations & Workarounds

|Limitation                         |Impact                                                                              |Workaround                                                                                 |
|-----------------------------------|------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
|No native terminal rendering       |Diagrams can’t display in the CLI itself                                            |HTML + browser launch                                                                      |
|No VSCode extension rendering (yet)|Mermaid/Graphviz blocks show as raw code in the extension chat                      |HTML + browser launch, or use Mermaid Preview VSCode extension                             |
|CDN dependency for large libraries |Requires internet; “no external deps” rule makes inlining impractical for large libs|Download and inline, or relax the rule                                                     |
|Graphviz WASM size                 |Viz.js is ~3-5MB                                                                    |Use CDN; accept the load time                                                              |
|LaTeX in Mermaid nodes             |Mermaid’s own LaTeX support is inconsistent across versions/browsers                |Use KaTeX separately alongside Mermaid, or use `htmlLabels: true` with embedded KaTeX spans|

-----

## 7. Bottom Line

The Claude Code HTML Playground is essentially a **“generate and launch” pattern** where Claude Code:

1. Writes a self-contained HTML file
1. Includes whatever JS rendering libraries are needed (Mermaid, KaTeX, Viz.js, D3, Three.js, Plotly, etc.)
1. Opens it in the user’s real browser

This makes it **capable of rendering virtually anything that runs in a modern browser**, which is a superset of what claude.ai Artifacts can render. The official Playground plugin adds opinionated structure (controls panel, live preview, prompt output, presets) but the underlying mechanism is simply “HTML file + browser.”

For Mermaid, Graphviz, and LaTeX specifically — **all three are fully renderable** through their respective JavaScript implementations. The HTML playground approach actually provides *better* rendering for LaTeX and Graphviz than claude.ai Artifacts, which only show the source code for those formats.