# Paper Explorer Playgrounds

Convert academic papers, philosophy texts, research documents, and long-form arguments into interactive single-file HTML explorers with tabbed navigation, structured content cards, and rich visual assets.

## Contents

- [When to Use](#when-to-use)
- [Architecture Overview](#architecture-overview)
- [HTML Skeleton](#html-skeleton)
- [DOM Builder Helpers](#dom-builder-helpers)
- [Tab Navigation System](#tab-navigation-system)
- [Content Patterns](#content-patterns)
- [Reference / Bibliography Tab](#reference--bibliography-tab)
- [Processing Large Documents](#processing-large-documents)
- [Complete Example Skeleton](#complete-example-skeleton)
- [Design Principles](#design-principles)

-----

## When to Use

- User wants to turn a paper, essay, or book chapter into an interactive explorer
- Converting a PDF or long document into a browsable HTML playground
- Building a multi-tab visualization of a complex argument or theory
- Creating an interactive reference for a research topic with multiple facets
- Summarizing and structuring a paper for presentation or study

-----

## Architecture Overview

Paper explorers follow a different pattern from simple renderer playgrounds. Instead of rendering one diagram or equation, they organize an entire document's worth of content into navigable sections with rich interactive elements.

**Key differences from simple playgrounds:**

| Aspect | Simple Playground | Paper Explorer |
|--------|------------------|----------------|
| Content source | User provides diagram/equation | Extracted from paper via RLM or manual curation |
| Navigation | Single page, scroll | Tabbed sections, one visible at a time |
| DOM construction | Static HTML | Programmatic JS with `el()` helpers |
| Interactivity | Controls + preview | Filters, search, expandable cards, debates |
| Size | 50-200 lines | 500-2000+ lines |
| Data | Inline | JS constants (arrays of objects) at top of script |

**Core architecture:**

```
Data Constants (TABS, SECTIONS, REFS, ARGUMENTS, etc.)
        |
        v
Builder Functions (buildOverview(), buildArguments(), buildReferences(), ...)
        |
        v
Tab Router (switchView() shows/hides sections)
        |
        v
DOM (nav > .tabs + main > .view sections)
```

-----

## HTML Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{PAPER_TITLE}} — Interactive Explorer</title>

  <!-- Only include renderers actually needed -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js"></script>

  <style>
    :root {
      --bg: #1a1a2e; --bg2: #16213e; --bg3: #1e2a4a;
      --fg: #e0e0e0; --text2: #999;
      --accent: #00d2ff; --accent2: #6c63ff;
      --border: #2a2a4a;
      --card: #1e1e3a; --card-hover: #252550;
      --radius: 12px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); }

    /* --- Navigation --- */
    nav { position: sticky; top: 0; z-index: 100; background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 1.5rem; }
    nav .brand { font-weight: 700; font-size: 15px; color: var(--accent); white-space: nowrap; padding: 12px 0; }
    nav .tabs {
      display: flex; gap: 4px; overflow-x: auto;
      scrollbar-width: thin; scrollbar-color: var(--border) transparent;
      mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
    }
    nav .tabs::-webkit-scrollbar { height: 4px; }
    nav .tabs::-webkit-scrollbar-track { background: transparent; }
    nav .tabs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    nav .tab {
      padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;
      color: var(--text2); transition: all .2s; white-space: nowrap; border: 1px solid transparent;
    }
    nav .tab:hover { color: var(--fg); background: var(--bg3); }
    nav .tab.active { color: var(--accent); border-color: var(--accent); background: rgba(0,210,255,.08); }

    /* --- Main content --- */
    main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    .view { display: none; animation: fadeIn .3s ease; }
    .view.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

    /* --- Cards --- */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem; transition: border-color .2s; }
    .card:hover { border-color: var(--accent); }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: .5rem; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin: 1.5rem 0; }

    /* --- Expandable sections --- */
    details { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: .75rem; }
    details summary { padding: 1rem 1.25rem; cursor: pointer; font-weight: 600; color: var(--fg); list-style: none; }
    details summary::before { content: "\25B6"; margin-right: .75rem; font-size: .7em; display: inline-block; transition: transform .2s; }
    details[open] summary::before { transform: rotate(90deg); }
    details .inner { padding: 0 1.25rem 1.25rem; color: var(--text2); line-height: 1.7; }

    /* --- Filter pills --- */
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 1rem 0; }
    .pill { padding: 6px 14px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text2); transition: all .2s; }
    .pill:hover { border-color: var(--accent); color: var(--fg); }
    .pill.active { background: rgba(0,210,255,.15); border-color: var(--accent); color: var(--accent); }

    /* --- Search box --- */
    .search { width: 100%; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--fg); font-size: 14px; margin: 1rem 0; }
    .search:focus { outline: none; border-color: var(--accent); }

    /* --- Stat grid --- */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .stat { text-align: center; padding: 1rem; background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); }
    .stat .num { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
    .stat .label { font-size: 12px; color: var(--text2); margin-top: 4px; }

    /* --- Typography --- */
    h1 { font-size: 2rem; color: var(--accent); margin-bottom: .5rem; }
    h2 { font-size: 1.4rem; color: var(--fg); margin: 1.5rem 0 .75rem; }
    p { line-height: 1.7; color: var(--text2); margin-bottom: .75rem; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote { border-left: 3px solid var(--accent); padding: .75rem 1.25rem; margin: 1rem 0; background: var(--card); border-radius: 0 var(--radius) var(--radius) 0; font-style: italic; color: var(--text2); }

    /* --- Footer --- */
    footer { text-align: center; padding: 2rem; font-size: 12px; color: var(--text2); border-top: 1px solid var(--border); }
  </style>
</head>
<body>

<nav>
  <div style="display:flex;align-items:center;gap:1.5rem;">
    <div class="brand">{{SHORT_TITLE}}</div>
    <div class="tabs" id="tabBar"></div>
  </div>
</nav>
<main id="main"></main>
<footer>
  <p>{{PAPER_TITLE}} — Interactive Explorer</p>
  <p>Built with the RLM Skill — {{TOTAL_CHARS}} chars across {{NUM_DOCS}} documents</p>
</footer>

<script>
// ============================================================
//  DATA CONSTANTS — all content lives here, not in HTML
// ============================================================
const TABS = [
  {id:"overview", label:"Overview"},
  // ... add tabs matching your paper's structure
];

// ============================================================
//  DOM HELPERS
// ============================================================

// Safe DOM construction — use for all user-facing text
function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k,v]) => {
    if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on")) e[k] = v;
    else e.setAttribute(k, v);
  });
  children.flat(Infinity).forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}

// For TRUSTED content from curated data constants only.
// SECURITY: Never pass user input or external data to this function.
// Use el() with textContent for untrusted strings.
function elHTML(tag, attrs, html) {
  const e = el(tag, attrs);
  if (html) e.innerHTML = html;
  return e;
}

// ============================================================
//  TAB NAVIGATION
// ============================================================
const tabBar = document.getElementById("tabBar");
const main = document.getElementById("main");

TABS.forEach(t => {
  const btn = el("div", {class:"tab", "data-view":t.id}, t.label);
  btn.onclick = () => switchView(t.id);
  tabBar.appendChild(btn);
});

function switchView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "v-"+id));
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.view === id);
    if (t.dataset.view === id) t.scrollIntoView({behavior:"smooth", block:"nearest", inline:"center"});
  });
  // Re-render Mermaid diagrams in newly visible tab
  if (typeof mermaid !== "undefined") {
    const target = document.getElementById("v-"+id);
    if (target && target.querySelector(".mermaid:not([data-processed])")) {
      mermaid.run({querySelector: "#v-"+id+" .mermaid"});
    }
  }
}

// ============================================================
//  BUILDER FUNCTIONS — one per tab
// ============================================================
function buildOverview() {
  const sec = el("div", {class:"view", id:"v-overview"});
  // ... build content programmatically using el()
  return sec;
}

// ... more build functions ...

// ============================================================
//  BUILD EVERYTHING
// ============================================================
main.appendChild(buildOverview());
// main.appendChild(buildNextTab());
// ... one line per tab

// Show first tab
switchView(TABS[0].id);

// Initialize renderers
if (typeof mermaid !== "undefined") mermaid.initialize({startOnLoad:false, theme:"dark"});
if (typeof renderMathInElement !== "undefined") {
  renderMathInElement(document.body, {
    delimiters: [
      {left:"$$", right:"$$", display:true},
      {left:"\\(", right:"\\)", display:false},
      {left:"\\[", right:"\\]", display:true}
    ]
  });
}
</script>
</body>
</html>
```

-----

## DOM Builder Helpers

Paper explorers build DOM programmatically rather than writing static HTML. This keeps data separate from presentation and enables filtering/search.

### `el(tag, attrs, ...children)` — Safe DOM construction

```javascript
// Creates elements with attributes and children — no XSS risk
function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k,v]) => {
    if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on")) e[k] = v;
    else e.setAttribute(k, v);
  });
  children.flat(Infinity).forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}
```

**Usage patterns:**

```javascript
// Simple element with text
el("h1", null, "Paper Title")

// Element with attributes
el("div", {class:"card", id:"intro"}, "Content here")

// Nested elements
el("div", {class:"card"},
  el("div", {class:"card-label"}, "Key Concept"),
  el("p", null, "Explanation of the concept...")
)

// Inline styles (object form)
el("span", {style:{color:"#ff6b6b", fontWeight:"bold"}}, "Important")

// Event handlers
el("div", {class:"pill", onclick: () => filterBy("category")}, "Category Name")

// Conditional children (nulls are skipped)
el("div", null,
  el("h2", null, "Title"),
  item.doi ? el("a", {href:item.doi}, "DOI") : null
)
```

### `elHTML(tag, attrs, html)` — Trusted content only

This helper sets element content as HTML markup. **Only use for content from your own curated data constants** — never for user input or external data. For untrusted strings, use `el()` with text children instead.

```javascript
function elHTML(tag, attrs, html) {
  const e = el(tag, attrs);
  if (html) e.innerHTML = html;  // SECURITY: trusted source only
  return e;
}

// SAFE: curated data constant with known markup
elHTML("p", {class:"description"}, "The paper argues that <strong>key claim</strong>...")

// UNSAFE — never do this with external input
// elHTML("p", null, externalUserString)  // XSS vulnerability!
```

-----

## Tab Navigation System

### Data-driven tabs

Define all tabs in a single array. Each tab has an `id` (used for routing) and a `label` (displayed in the nav bar):

```javascript
const TABS = [
  {id:"overview",     label:"Overview"},
  {id:"architecture", label:"Architecture"},
  {id:"arguments",    label:"Argument Map"},
  {id:"sections",     label:"Paper Sections"},
  {id:"critics",      label:"Critics & Debate"},
  {id:"references",   label:"References"}
];
```

### Tab rendering and routing

```javascript
TABS.forEach(t => {
  const btn = el("div", {class:"tab", "data-view":t.id}, t.label);
  btn.onclick = () => switchView(t.id);
  tabBar.appendChild(btn);
});

function switchView(id) {
  document.querySelectorAll(".view").forEach(v =>
    v.classList.toggle("active", v.id === "v-"+id)
  );
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.view === id);
    // Auto-scroll active tab into view (important for 8+ tabs)
    if (t.dataset.view === id)
      t.scrollIntoView({behavior:"smooth", block:"nearest", inline:"center"});
  });
}
```

### Overflow handling for many tabs

With 8+ tabs the tab bar overflows. The CSS in the skeleton handles this with:
- `overflow-x: auto` for horizontal scrolling
- `scrollbar-width: thin` for a slim scrollbar
- `mask-image` gradient for fade-out edges
- `scrollIntoView()` to auto-center the active tab

### Mermaid in hidden tabs

Mermaid diagrams in initially hidden tabs won't render with `startOnLoad: true`. Use `startOnLoad: false` and trigger rendering when the tab becomes visible:

```javascript
// In switchView(), after showing the tab:
if (typeof mermaid !== "undefined") {
  const target = document.getElementById("v-" + id);
  const unprocessed = target.querySelectorAll(".mermaid:not([data-processed])");
  if (unprocessed.length) mermaid.run({querySelector: "#v-" + id + " .mermaid"});
}
```

-----

## Content Patterns

### Overview tab with thesis + stats

```javascript
function buildOverview() {
  const sec = el("div", {class:"view", id:"v-overview"});

  sec.appendChild(el("h1", null, "Paper Title"));
  sec.appendChild(el("p", null, "Subtitle or one-line summary"));

  // Central thesis card
  const thesis = el("div", {class:"card"});
  thesis.appendChild(el("div", {class:"card-label"}, "Central Thesis"));
  thesis.appendChild(el("p", null, "The paper argues that key claim because..."));
  sec.appendChild(thesis);

  // Quick stats grid
  const stats = el("div", {class:"stat-grid"});
  [{num:"9", label:"Sections"}, {num:"136", label:"References"}, {num:"8", label:"Objections"}]
    .forEach(s => stats.appendChild(
      el("div", {class:"stat"},
        el("div", {class:"num"}, s.num),
        el("div", {class:"label"}, s.label)
      )
    ));
  sec.appendChild(stats);

  return sec;
}
```

### Expandable section cards (for paper sections, objections, etc.)

```javascript
const SECTIONS = [
  {title:"Introduction", summary:"...", body:"Full text or analysis..."},
  {title:"Methods", summary:"...", body:"..."},
];

function buildSections() {
  const sec = el("div", {class:"view", id:"v-sections"});
  sec.appendChild(el("h1", null, "Paper Sections"));

  SECTIONS.forEach(s => {
    const d = el("details");
    d.appendChild(el("summary", null, s.title));
    const inner = el("div", {class:"inner"});
    inner.appendChild(el("p", {style:{fontStyle:"italic"}}, s.summary));
    inner.appendChild(el("p", null, s.body));
    d.appendChild(inner);
    sec.appendChild(d);
  });

  return sec;
}
```

### Argument map with pro/con cards

```javascript
const ARGUMENTS = [
  {claim:"X is true", support:["Evidence A", "Evidence B"], objections:["Counter C"]},
];

function buildArguments() {
  const sec = el("div", {class:"view", id:"v-arguments"});
  sec.appendChild(el("h1", null, "Argument Map"));

  ARGUMENTS.forEach(a => {
    const card = el("div", {class:"card"});
    card.appendChild(el("h3", {style:{color:"var(--accent)"}}, a.claim));

    // Support column
    const pros = el("div", {style:{marginTop:"1rem"}});
    pros.appendChild(el("div", {class:"card-label", style:{color:"#4ecdc4"}}, "Supporting Evidence"));
    a.support.forEach(s => pros.appendChild(
      el("div", {style:{padding:".5rem 0", borderBottom:"1px solid var(--border)", color:"var(--text2)"}}, s)
    ));
    card.appendChild(pros);

    // Objections column
    if (a.objections.length) {
      const cons = el("div", {style:{marginTop:"1rem"}});
      cons.appendChild(el("div", {class:"card-label", style:{color:"#ff6b6b"}}, "Objections"));
      a.objections.forEach(o => cons.appendChild(
        el("div", {style:{padding:".5rem 0", borderBottom:"1px solid var(--border)", color:"var(--text2)"}}, o)
      ));
      card.appendChild(cons);
    }

    sec.appendChild(card);
  });

  return sec;
}
```

### Debate / critic response pattern

```javascript
const CRITICS = [
  {
    critic: "Reviewer Name",
    position: "Summary of their critique...",
    quotes: ["Direct quote 1", "Direct quote 2"],
    response: "Paper's response to this critique...",
    verdict: "Addressed" // or "Partially Addressed", "Open"
  }
];

function buildCritics() {
  const sec = el("div", {class:"view", id:"v-critics"});
  sec.appendChild(el("h1", null, "Critics & Debate"));

  CRITICS.forEach(c => {
    const card = el("div", {class:"card"});
    card.appendChild(el("h3", null, c.critic));
    card.appendChild(el("p", {style:{fontStyle:"italic", color:"var(--text2)"}}, c.position));

    // Quotes
    c.quotes.forEach(q => card.appendChild(
      el("blockquote", null, q)
    ));

    // Response
    card.appendChild(el("div", {class:"card-label", style:{marginTop:"1rem"}}, "Paper's Response"));
    card.appendChild(el("p", null, c.response));

    // Verdict badge
    const colors = {Addressed:"#4ecdc4", "Partially Addressed":"#ffd93d", Open:"#ff6b6b"};
    card.appendChild(el("span", {
      style:{
        display:"inline-block", padding:"4px 12px", borderRadius:"12px", fontSize:"12px",
        background: colors[c.verdict] + "22", color: colors[c.verdict], marginTop:".5rem"
      }
    }, c.verdict));

    sec.appendChild(card);
  });

  return sec;
}
```

### Filter pills with search

A reusable pattern for any tab with categorized items:

```javascript
function buildFilterableList(viewId, title, items, categories, getCat, renderItem) {
  const sec = el("div", {class:"view", id:"v-"+viewId});
  sec.appendChild(el("h1", null, title));

  // Filter pills
  const pills = el("div", {class:"pills"});
  const allPill = el("div", {class:"pill active"}, "All (" + items.length + ")");
  allPill.onclick = () => filter(null);
  pills.appendChild(allPill);
  categories.forEach(cat => {
    const count = items.filter(i => getCat(i) === cat).length;
    const p = el("div", {class:"pill"}, cat + " (" + count + ")");
    p.onclick = () => filter(cat);
    pills.appendChild(p);
  });
  sec.appendChild(pills);

  // Search box
  const search = el("input", {class:"search", type:"text", placeholder:"Search..."});
  sec.appendChild(search);

  // Items list
  const list = el("div", {id:viewId+"-list"});
  items.forEach(i => list.appendChild(renderItem(i)));
  sec.appendChild(list);

  // Filter + search logic
  let activeCat = null;
  function filter(cat) {
    activeCat = cat;
    pills.querySelectorAll(".pill").forEach((p, idx) =>
      p.classList.toggle("active", idx === 0 ? !cat : categories[idx-1] === cat)
    );
    applyFilters();
  }
  function applyFilters() {
    const q = search.value.toLowerCase();
    Array.from(list.children).forEach((node, i) => {
      const item = items[i];
      const matchesCat = !activeCat || getCat(item) === activeCat;
      const matchesSearch = !q || JSON.stringify(item).toLowerCase().includes(q);
      node.style.display = matchesCat && matchesSearch ? "" : "none";
    });
  }
  search.oninput = applyFilters;

  return sec;
}
```

### Timeline / evolution pattern

```javascript
const TIMELINE = [
  {era:"Ancient", period:"~500 BCE", entries:[
    {name:"Aristotle", desc:"De Anima — soul as form of the body"}
  ]},
  {era:"Modern", period:"1600-1900", entries:[
    {name:"Descartes", desc:"Mind-body dualism"},
    {name:"Hume", desc:"Bundle theory of self"}
  ]},
];

function buildTimeline() {
  const sec = el("div", {class:"view", id:"v-timeline"});
  sec.appendChild(el("h1", null, "Historical Timeline"));

  TIMELINE.forEach(era => {
    sec.appendChild(el("h2", null, era.era + " (" + era.period + ")"));
    const grid = el("div", {class:"card-grid"});
    era.entries.forEach(e => grid.appendChild(
      el("div", {class:"card"},
        el("div", {class:"card-label"}, e.name),
        el("p", null, e.desc)
      )
    ));
    sec.appendChild(grid);
  });

  return sec;
}
```

-----

## Reference / Bibliography Tab

A complete pattern for rendering an academic bibliography with category filtering, search, and domain distribution stats.

### Data structure

```javascript
const REFS = [
  {authors:"Barrett, L. F.", year:"2017", title:"How emotions are made", cat:"Emotion Theory", doi:"https://doi.org/..."},
  {authors:"Chalmers, D. J.", year:"1995", title:"Facing up to the problem of consciousness", cat:"Philosophy of Mind"},
  // ... 100+ entries
];

const REF_CATS = ["Consciousness Theories","Emotion Theory","Philosophy of Mind","Neuroscience"];
const REF_COLORS = {"Consciousness Theories":"#6c63ff","Emotion Theory":"#ff6b6b","Philosophy of Mind":"#4ecdc4","Neuroscience":"#ffd93d"};
```

### Builder function

```javascript
function buildReferences() {
  return buildFilterableList(
    "references", "References", REFS, REF_CATS,
    r => r.cat,
    r => {
      const color = REF_COLORS[r.cat] || "#666";
      return el("div", {style:{display:"flex", alignItems:"baseline", gap:"12px", padding:"10px 0", borderBottom:"1px solid var(--border)"}},
        el("span", {style:{width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:"0",marginTop:"6px"}}),
        el("span", {style:{fontFamily:"monospace",fontSize:"13px",color:"var(--accent)",minWidth:"50px"}}, r.year),
        el("span", null,
          el("strong", null, r.authors),
          " ",
          el("span", {style:{color:"var(--text2)"}}, r.title)
        ),
        r.doi ? el("a", {href:r.doi, target:"_blank", style:{marginLeft:"auto",fontSize:"12px",flexShrink:"0"}}, "DOI") : null
      );
    }
  );
}
```

-----

## Processing Large Documents

For papers exceeding ~50KB, use the **RLM skill** to extract and structure content before building the playground. The workflow:

1. **Load the paper** into a Python variable via RLM (handles PDFs, DOCX, plain text)
2. **Extract structure** — use sub-LLM calls to identify sections, arguments, key claims
3. **Generate JS constants** — output the data as JavaScript arrays/objects
4. **Paste into the playground** — the data constants go at the top of the `<script>` block
5. **Build the HTML** — write builder functions that consume the data constants

### Extraction prompts for sub-LLM calls

When using RLM to extract paper content, request structured JSON output:

```python
# Extract sections
result = llm_query(f"""Extract all sections from this paper text. Return JSON array:
[{{"title":"Section Title", "summary":"2-3 sentence summary",
   "key_claims":["claim1","claim2"], "page_range":"1-5"}}]

Paper text:
{chunk}""")

# Extract arguments and objections
result = llm_query(f"""Identify the main arguments in this paper.
For each, list supporting evidence and potential objections. Return JSON:
[{{"claim":"The main claim", "support":["evidence1","evidence2"],
   "objections":["counter1"]}}]

Text:
{chunk}""")

# Extract and categorize references
result = llm_query(f"""Parse these references into structured data.
Categorize each by domain. Return JSON:
[{{"authors":"Last, F. I.", "year":"2024", "title":"Paper title",
   "cat":"Category", "doi":"https://doi.org/..."}}]

References:
{chunk}""")
```

### Typical paper-to-playground pipeline

| Step | Tool | Output |
|------|------|--------|
| 1. Load PDF | RLM + pdfplumber | Raw text in Python variable |
| 2. Identify structure | RLM sub-LLM calls | Section list, argument map |
| 3. Extract references | Regex + sub-LLM | REFS array |
| 4. Extract key concepts | Sub-LLM | Data constants for overview, cards |
| 5. Curate and correct | Manual review | Clean JS constants |
| 6. Build HTML | This skill | Complete playground file |
| 7. Open in browser | `start file.html` | Interactive explorer |

-----

## Complete Example Skeleton

A minimal working example with 3 tabs — copy and extend:

```javascript
const TABS = [
  {id:"overview", label:"Overview"},
  {id:"sections", label:"Sections"},
  {id:"references", label:"References"}
];

const SECTIONS = [
  {title:"Introduction", summary:"Sets up the problem", body:"Full analysis..."},
  {title:"Methods", summary:"Approach taken", body:"Detailed methods..."},
  {title:"Results", summary:"Key findings", body:"Data and analysis..."},
  {title:"Discussion", summary:"Implications", body:"What it means..."}
];

const REFS = [
  {authors:"Smith, J.", year:"2024", title:"Example paper", cat:"Methods", doi:null},
  {authors:"Jones, A. and Lee, B.", year:"2023", title:"Another paper",
   cat:"Theory", doi:"https://doi.org/10.1234/example"}
];

// Builder functions use el() to construct each tab's DOM
// See Content Patterns section above for full implementations
```

-----

## Design Principles

1. **Data-driven**: All content lives in JS constants at the top. Builder functions only handle presentation. This makes it easy to update content without touching layout code.

2. **Progressive disclosure**: Start with overview/summary, let users drill into details via tabs, expandable sections, and filters. Don't dump everything on one scrollable page.

3. **Consistent card metaphor**: Every piece of content is a card with `background: var(--card)`, border, border-radius, and hover effect. This creates visual rhythm.

4. **Color coding for categories**: Assign a color to each domain/category and use it consistently across filter pills, dot indicators, and stat cards. Define colors in a constant object.

5. **Safe DOM construction**: Always use `el()` for user-facing text. Only use `elHTML()` for trusted curated content from your own data constants. Never inject external or user-supplied strings as HTML.

6. **Mobile-friendly**: The tab bar scrolls horizontally. Card grids use `auto-fill` to reflow. Content max-width is 960px centered.

7. **Dark theme default**: Academic content looks sharp on dark backgrounds. The CSS variables make it trivial to add a light theme toggle if needed.

8. **Mermaid in hidden tabs**: Always use `startOnLoad: false` and trigger `mermaid.run()` in `switchView()`. Diagrams in hidden divs won't render otherwise.

9. **Footer attribution**: Include paper title and processing stats (chars processed, documents used) in the footer. This gives credit and context.

10. **One build function per tab**: Each tab gets its own `build*()` function that returns a single DOM element. This keeps the code modular and each function independently testable.
