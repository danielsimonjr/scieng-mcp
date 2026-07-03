# CS Paper LaTeX Syntax Reference

## Overview

Write compilable LaTeX for computer science papers and algorithms. Key principle: know which packages conflict, which environments your document class already defines, and how algorithm packages differ.

## Algorithm Packages: Choose One Per Document

**algorithm2e and algorithmicx are INCOMPATIBLE.** Both redefine the `algorithm` float. Never load both.

| Package | Float | Pseudocode Style | Key Commands |
|---------|-------|-------------------|--------------|
| `algorithm2e` | Built-in | Keyword-based | `\KwIn`, `\KwOut`, `\While{}{}`, `\If{}{}`, `\Return`, `\SetKwFunction` |
| `algorithm` + `algpseudocode` | `algorithm` pkg | Procedural | `\Procedure{}{}`, `\State`, `\While{}`, `\If{}`, `\Return`, `\Call{}{}` |

### algorithm2e

```latex
\usepackage[lined,boxed,ruled]{algorithm2e}

\begin{algorithm}[H]
\caption{Binary Search}\label{alg:bsearch}
\KwIn{Sorted array $A[1..n]$, target $x$}
\KwOut{Index of $x$ or $-1$}
$l \gets 1$, $r \gets n$\;
\While{$l \leq r$}{
  $m \gets \lfloor(l+r)/2\rfloor$\;
  \lIf{$A[m] = x$}{\Return $m$}
  \eIf{$A[m] < x$}{$l \gets m+1$\;}{$r \gets m-1$\;}
}
\Return $-1$\;
\end{algorithm}
```

### algorithmicx + algpseudocode

```latex
\usepackage{algorithm}       % float wrapper
\usepackage{algpseudocode}   % pseudocode commands (loads algorithmicx)

\begin{algorithm}[H]
\caption{Dijkstra}\label{alg:dijkstra}
\begin{algorithmic}[1]       % [1] = line numbers
\Procedure{Dijkstra}{$G, s$}
  \State $d[s] \gets 0$; $d[v] \gets \infty\ \forall v \neq s$
  \While{$Q \neq \emptyset$}
    \State $u \gets$ \Call{ExtractMin}{$Q$}
    \For{each $v$ adjacent to $u$}
      \If{$d[u] + w(u,v) < d[v]$}
        \State $d[v] \gets d[u] + w(u,v)$
      \EndIf
    \EndFor
  \EndWhile
  \State \Return $d$
\EndProcedure
\end{algorithmic}
\end{algorithm}
```

**Never:** `\usepackage{algorithm2e}` + `\usepackage{algpseudocode}` in the same document.

## Document Classes

### acmart (ACM)

```latex
\documentclass[sigconf]{acmart}  % or sigplan, acmtog, etc.
```

**acmart already defines:** `theorem`, `lemma`, `corollary`, `proposition`, `conjecture`, `definition`, `example`, `proof`. Do NOT `\newtheorem` these -- you'll get "already defined" errors.

**CCS concepts:** Use `\begin{CCSXML}...\end{CCSXML}` (note: `\end{CCSXML}`, not `</end{CCSXML}>`).

### IEEEtran (IEEE)

```latex
\documentclass[conference]{IEEEtran}
```

Define your own theorem envs. Use `\IEEEauthorblockN` and `\IEEEauthorblockA` for authors.

### NeurIPS / ICML

```latex
\usepackage{neurips_2024}  % or icml2024
```

Check the style file for pre-defined environments before defining your own.

## Common Preamble

```latex
\usepackage[utf8]{inputenc}   % NOT utf-8 (no hyphen!)
\usepackage{amsmath,amssymb,amsthm}
\usepackage{booktabs}          % \toprule, \midrule, \bottomrule
\usepackage{graphicx}
\usepackage{subcaption}        % subfigures
\usepackage{listings}          % code listings
\usepackage{xcolor}            % colors for listings
\usepackage{hyperref}          % clickable refs (load LAST)
```

**inputenc option is `utf8`** -- not `utf-8`. The hyphen causes an "unknown option" error.

## Theorems and Proofs

For `article` class (define your own):
```latex
\newtheorem{theorem}{Theorem}[section]
\newtheorem{lemma}[theorem]{Lemma}        % shares counter with theorem
\newtheorem{definition}{Definition}[section]
\theoremstyle{remark}
\newtheorem{remark}{Remark}
```

For `acmart`: already defined. Just use `\begin{theorem}...\end{theorem}` directly.

## Math Quick Reference

```latex
% Complexity notation
\newcommand{\bigO}[1]{O\!\left(#1\right)}
\newcommand{\bigTheta}[1]{\Theta\!\left(#1\right)}
\newcommand{\bigOmega}[1]{\Omega\!\left(#1\right)}

% Expectation, probability
\newcommand{\E}[1]{\mathbb{E}\!\left[#1\right]}
\newcommand{\Pr}{\operatorname{Pr}}
\DeclareMathOperator*{\argmin}{arg\,min}
\DeclareMathOperator*{\argmax}{arg\,max}

% Multi-line equations
\begin{align}
  f(x) &= ax^2 + bx + c \label{eq:quad} \\
       &= a(x-h)^2 + k   \nonumber
\end{align}
```

## Tables with booktabs

```latex
\begin{table}[t]
\centering
\caption{Results}\label{tab:results}
\begin{tabular}{lrrr}
\toprule
Method     & Accuracy & F1    & Time (s) \\
\midrule
Baseline   & 85.2     & 0.83  & 120 \\
Ours       & \textbf{91.7} & \textbf{0.90} & 95 \\
\bottomrule
\end{tabular}
\end{table}
```

**Never use `\hline`** with booktabs. Use `\toprule`, `\midrule`, `\bottomrule`.

## Code Listings

```latex
\usepackage{listings}
\usepackage{xcolor}
\lstset{
  language=Python,
  basicstyle=\ttfamily\small,
  keywordstyle=\color{blue}\bfseries,
  commentstyle=\color{gray}\itshape,
  numbers=left, numberstyle=\tiny\color{gray},
  frame=single, breaklines=true
}

\begin{lstlisting}[caption=Example]
def train(model, data):
    for batch in data:
        loss = model(batch)
        loss.backward()
\end{lstlisting}
```

## Subfigures

```latex
\usepackage{subcaption}

\begin{figure}[t]
\centering
\begin{subfigure}[b]{0.48\textwidth}
  \includegraphics[width=\textwidth]{fig_a.pdf}
  \caption{Training loss}\label{fig:loss}
\end{subfigure}
\hfill
\begin{subfigure}[b]{0.48\textwidth}
  \includegraphics[width=\textwidth]{fig_b.pdf}
  \caption{Accuracy}\label{fig:acc}
\end{subfigure}
\caption{Experimental results}\label{fig:results}
\end{figure}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Loading `algorithm2e` + `algorithmicx` together | Choose ONE. They redefine the same float. |
| `\newtheorem{theorem}` in `acmart` | `acmart` pre-defines it. Just use `\begin{theorem}`. |
| `\usepackage[utf-8]{inputenc}` | Use `utf8` (no hyphen): `[utf8]` |
| `</end{CCSXML}>` in acmart | LaTeX syntax: `\end{CCSXML}` (backslash, not angle bracket) |
| `\hline` with booktabs | Use `\toprule`, `\midrule`, `\bottomrule` |
| `\ref` to undefined `\label` | Every `\ref{X}` needs a matching `\label{X}` in the document |
| `hyperref` loaded before other packages | Load `hyperref` LAST in preamble |
| Missing `\;` at end of algorithm2e lines | Each line in algorithm2e needs `\;` for line-ending |

## Rendering to SVG

Use `render-latex-to-svg.ts` (in this skill directory) to render LaTeX math to SVG:

```bash
node render-latex-to-svg.ts <input.tex> [output.svg] [--dpi=N]
```

- Uses the latex.codecogs.com API (no local LaTeX install needed)
- Extracts math blocks (`$...$`, `\begin{align}`, etc.) from `.tex` files
- Raw LaTeX math files render as-is
- Multiple blocks are combined into a stacked SVG
- Default DPI is 200

## Format Conversion: Markdown ↔ LaTeX ↔ DOCX ↔ PDF

Academic papers often need multiple output formats from a single source. This section covers the conversion workflows.

### The `$$...$$` Math Convention

Some projects use `$$...$$` for ALL math (both inline and display), diverging from LaTeX's standard `$...$` (inline) and `$$...$$` (display). This causes problems with tools that distinguish the two:

| Tool | `$...$` | `$$...$$` |
|------|---------|-----------|
| LaTeX | Inline math | Display math |
| Pandoc | Inline math | Display math |
| KaTeX | Inline math | Display math |
| UpMath | Both (context-dependent) | Both (context-dependent) |

**When converting from `$$`-only sources**, preprocess to fix inline math:

```python
import re

def fix_math_delimiters(text):
    """Convert $$...$$ inline math to $...$ for pandoc compatibility."""
    lines = text.split('\n')
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped == '$$':
            result.append(line)  # Display math boundary
        elif stripped.startswith('$$') and stripped.endswith('$$') and len(stripped) > 4:
            result.append(line)  # Full display equation on one line
        elif '$$' in line:
            result.append(re.sub(r'\$\$([^$]+?)\$\$', r'$\1$', line))  # Inline
        else:
            result.append(line)
    return '\n'.join(result)
```

### Markdown → DOCX (Three-Stage Workflow)

For academic papers with math, a three-stage process produces the best results:

**Stage 1: Preprocess**
- Fix `$$...$$` inline math → `$...$`
- Remove zero-width characters (`\u200b`, `\ufeff`)
- Ensure blank lines before headers
- Clean up raw HTML (`<br>` → newlines)

**Stage 2: Pandoc conversion**

```bash
pandoc input.md -f markdown -t docx \
  --mathml \
  --toc --toc-depth=3 \
  --number-sections \
  -o output.docx
```

Key flags:
- `--mathml` — produces native Word math equations (editable, not images). This is critical for academic papers.
- `--toc` — auto-generates table of contents
- `--number-sections` — adds section numbering
- `-f markdown-yaml_metadata_block` — use if YAML front matter causes parse errors

**Stage 3: Polish styles via unpack/repack**

Pandoc's default DOCX uses generic fonts and spacing. Fix with the docx skill's XML workflow:

```bash
# Unpack
python scripts/office/unpack.py output.docx unpacked/

# Edit unpacked/word/styles.xml:
# - Change fonts to Times New Roman (or journal's required font)
# - Set body line spacing to double: <w:spacing w:line="480" w:lineRule="auto"/>
# - Increase heading spacing for visual hierarchy

# Repack
python scripts/office/pack.py unpacked/ output.docx --original output.docx
```

Style XML replacements for academic formatting:

```python
# In styles.xml — change all fonts to Times New Roman
t = t.replace('w:asciiTheme="minorHAnsi"', 'w:ascii="Times New Roman"')
t = t.replace('w:hAnsiTheme="minorHAnsi"', 'w:hAnsi="Times New Roman"')
t = t.replace('w:cstheme="minorBidi"', 'w:cs="Times New Roman"')
t = t.replace('w:eastAsiaTheme="minorEastAsia"', 'w:eastAsia="Times New Roman"')
# Same for heading fonts (majorHAnsi, majorBidi, majorEastAsia)
t = t.replace('w:asciiTheme="majorHAnsi"', 'w:ascii="Times New Roman"')
t = t.replace('w:hAnsiTheme="majorHAnsi"', 'w:hAnsi="Times New Roman"')
t = t.replace('w:cstheme="majorBidi"', 'w:cs="Times New Roman"')
t = t.replace('w:eastAsiaTheme="majorEastAsia"', 'w:eastAsia="Times New Roman"')

# Set double line spacing for body text (first occurrence of default spacing)
t = t.replace(
    '<w:spacing w:after="200"/>',
    '<w:spacing w:after="0" w:line="480" w:lineRule="auto"/>',
    1  # Only first occurrence
)
```

### Markdown → PDF via UpMath

UpMath (https://upmath.me/) is a browser-based Markdown & LaTeX editor that renders equations **server-side to SVG** (not client-side like KaTeX/MathJax), producing resolution-independent output.

**Workflow:**
1. Write paper in markdown with `$$...$$` math
2. Paste/upload into UpMath (or use its editor directly)
3. Download as HTML with embedded SVG equations
4. Open HTML in browser → Print → Save as PDF

This avoids the need for a local LaTeX installation entirely.

**Supported packages** (far more than most online renderers):

| Category | Packages |
|----------|----------|
| Math | All standard LaTeX math, `mathrsfs` (script fonts), `esvect` (vectors), `stmaryrd` (logic symbols) |
| Graphics | `tikz` + libraries (positioning, calc, decorations, hobby), `tikz-3dplot`, `pgfplots`, `pgflibrary` |
| Diagrams | `circuitikz` (circuits), `bussproofs` (natural deduction proofs) |
| Chemistry | `mhchem` (chemical equations) |
| Formatting | `array`, `xcolor` (colors), `kotex` (Korean) |

**Features:** Multiple documents, version history, sync scroll, tab indentation, upload/download, full-screen mode.

**Special:** Use `\dvisvgm` driver for gradient shadings. Direct Unicode support. Cyrillic in `\text{}`. Documents stored in browser local storage (no data transmitted).

**Does NOT support:** Mermaid charts, BibTeX processing.

### Markdown → LaTeX

```bash
pandoc input.md -f markdown -t latex \
  --standalone \
  --number-sections \
  -o output.tex
```

Then compile with `pdflatex` or `xelatex`. Useful when a journal requires LaTeX source.

### Pandoc Installation

```bash
# Windows
winget install --id JohnMacFarlane.Pandoc

# macOS
brew install pandoc

# Linux
sudo apt install pandoc
```

Typical install location on Windows: `C:\Users\<user>\AppData\Local\Pandoc\pandoc.exe`

## Validation Checklist

Before outputting LaTeX, verify:
- [ ] Only ONE algorithm package family loaded
- [ ] No `\newtheorem` for environments the document class already defines
- [ ] `inputenc` uses `utf8` (no hyphen)
- [ ] Every `\ref{}` has a matching `\label{}`
- [ ] `booktabs` commands not mixed with `\hline`
- [ ] `hyperref` loaded last (if used)
- [ ] All `\end{...}` use backslash syntax (not `</end{...}>`)

Before converting markdown → DOCX, verify:
- [ ] `$$...$$` inline math preprocessed to `$...$`
- [ ] Using `--mathml` flag (not `--mathjax` or default)
- [ ] Blank lines before all headers
- [ ] No raw HTML that pandoc can't convert
- [ ] Styles polished after pandoc conversion (fonts, spacing)
