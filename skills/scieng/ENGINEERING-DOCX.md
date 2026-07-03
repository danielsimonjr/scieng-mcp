# Engineering Documentation (Word)

## Overview

Engineering-specific patterns for Word documents: title pages, approval blocks, revision history, requirements tables, test procedures, warning/caution blocks, and technical specifications.

**REQUIRED BACKGROUND:** You MUST invoke `document-skills:docx` first to load core DOCX capabilities.

## When to Use

- Document has part number format (83-xxxxx, CAGE codes)
- Need revision history with author/date/description
- Need approval signature blocks
- Need requirements traceability (Req ID → Verification → Status)
- Creating test procedures with step/action/expected/P-F columns
- Need MIL-STD-38784 style WARNING/CAUTION/NOTE blocks
- Creating Interface Control Documents (ICDs) with signal tables

## When NOT to Use

- General business documents → use `document-skills:docx` directly
- Marketing/creative content → base skill is sufficient
- Simple reports without engineering metadata

## Quick Reference

| Pattern | Function | Key Parameters |
|---------|----------|----------------|
| Title page | `createTitlePage(config)` | partNumber, revision, title, program, approvals |
| Approval block | `createApprovalTable(approvals)` | [{role, name}] |
| Revision history | `createRevisionHistory(revisions)` | [{rev, date, author, description}] |
| Requirements | `createRequirementsTable(reqs)` | [{id, text, verifyMethod, status, testRef}] |
| Test procedure | `createTestProcedure(steps)` | [{step, action, expected, result}] |
| Equipment list | `createEquipmentTable(equipment)` | [{name, partNumber, calDue, serial}] |
| Signal/ICD table | `createSignalTable(signals)` | [{name, type, direction, pin, range, description}] |
| Specs table | `createSpecsTable(specs)` | [{parameter, value, unit}] |
| WARNING block | `createWarning(text)` | Red border, personnel injury |
| CAUTION block | `createCaution(text)` | Yellow border, equipment damage |
| NOTE block | `createNote(text)` | Blue border, information |
| **Navigation** | | |
| Table of Contents | `createTableOfContents(title, maxLevel)` | Active hyperlinks to headings |
| List of Tables | `createListOfTables(title)` | TOC for tables (requires field update) |
| List of Figures | `createListOfFigures(title)` | TOC for figures (requires field update) |
| **Captions & References** | | |
| Table caption | `createTableCaption(number, title, bookmarkId)` | Creates bookmark for cross-ref |
| Table reference | `createTableRef(number, bookmarkId)` | Inline hyperlink to table |
| Figure caption | `createFigureCaption(number, title, bookmarkId)` | Creates bookmark for cross-ref |
| Figure reference | `createFigureRef(number, bookmarkId)` | Inline hyperlink to figure |
| Titled table | `createTitledTable(num, title, table, bookmarkId)` | Caption + table combined |
| **Images** | | |
| Basic image | `createImage(path, widthInches, altText)` | Proportional scaling |
| Sized image | `createImageWithSize(path, w, h, altText)` | Explicit dimensions |
| Figure (captioned) | `createFigure(path, num, title, width, bookmarkId)` | Image + caption + bookmark |
| **Trade Study Tables** | | |
| Integration effort | `createIntegrationEffortTable(tasks)` | [{task, duration, impact}] - color-coded impact |
| Risk assessment | `createRiskAssessmentTable(risks)` | [{id, description, probability, impact, mitigation}] |
| Comparison table | `createComparisonTable(col1, col2, rows)` | [{parameter, col1Value, col2Value, assessment}] |

## Implementation

**Full TypeScript patterns:** See `engineering-patterns.ts` in this skill directory for complete docx-js code.

### Basic Usage

```javascript
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = require('docx');

// Copy functions from engineering-patterns.ts (a type-checked reference, not a
// runnable module) into your own local file, then require/import that copy
const {
  engineeringStyles, engineeringHeader, engineeringFooter,
  createTitlePage, createRevisionHistory, createEquipmentTable,
  createTestProcedure, createWarning
} = require('./my-patterns.js'); // your own copy, adapted from the .ts reference

const doc = new Document({
  styles: engineeringStyles,
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: engineeringHeader("83-96913-0100", "A0", "MCU ATP") },
    footers: { default: engineeringFooter("UNCLASSIFIED") },
    children: [
      ...createTitlePage({
        partNumber: "83-96913-0100", revision: "A0",
        title: "MCU ACCEPTANCE TEST PROCEDURE", program: "MCU Test System",
        preparedBy: "Test Engineering", date: "February 2026",
        approvals: [{ role: "Author", name: "J. Smith" }, { role: "Approver", name: "R. Davis" }]
      }),
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. TEST EQUIPMENT")] }),
      createEquipmentTable([
        { name: "Digital Multimeter", partNumber: "HP34401A", calDue: "2026-06-15", serial: "MY12345678" }
      ]),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. TEST PROCEDURE")] }),
      createWarning("Ensure power is OFF before connecting test equipment."),
      createTestProcedure([
        { step: 1, action: "Connect DMM to J1 pin 1", expected: "DMM connected", result: "" },
        { step: 2, action: "Measure voltage at TP1", expected: "3.3V ±0.1V", result: "" }
      ])
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => fs.writeFileSync("MCU_ATP.docx", buffer));
```

## Cross-Referencing

Tables and figures can be referenced from text using bookmarks and hyperlinks:

```javascript
// Create a captioned table (bookmark auto-generated as "table_1")
createTitledTable(1, "Test Equipment List", equipmentTable),

// Reference it in text
new Paragraph({ children: [
  new TextRun("See "),
  createTableRef(1),              // Creates hyperlink "Table 1"
  new TextRun(" for required equipment.")
]}),

// Same pattern for figures
createFigure("./diagram.png", 1, "System Block Diagram"),
new Paragraph({ children: [
  new TextRun("The architecture is shown in "),
  createFigureRef(1),             // Creates hyperlink "Figure 1"
  new TextRun(".")
]})
```

**Note**: After opening in Word, press `Ctrl+A` then `F9` to update TOC and list fields.

## Key Concepts

### Verification Method Codes
| Code | Meaning |
|------|---------|
| I | Inspection |
| A | Analysis |
| D | Demonstration |
| T | Test |

### WARNING vs CAUTION (MIL-STD-38784)
- **WARNING** (red): Personnel injury or death hazard
- **CAUTION** (yellow): Equipment damage hazard
- **NOTE** (blue): Important information

### Engineering Units (Unicode)
```javascript
const mathSymbols = {
  plusMinus: '\u00B1', // ±
  degree: '\u00B0',    // °
  micro: '\u00B5',     // µ
  ohm: '\u03A9',       // Ω
};
// Usage: "5V ± 0.1V" or "25°C" or "100kΩ"
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Regular font for part numbers | Use `Courier New` for part numbers, serial numbers, requirement IDs |
| Plain text for warnings | Use `createWarning()` for MIL-STD compliance |
| CAUTION for injury hazards | CAUTION = equipment only; WARNING = personnel |
| Missing revision history | Every released doc needs revision table |
| Skipping base skill | Always invoke `document-skills:docx` first |
| TOC not clickable | Use `createTableOfContents()` with StyleLevel, update fields in Word |
| Hard-coded table/figure numbers | Use bookmarks + `createTableRef()`/`createFigureRef()` for maintainability |
| Images without captions | Use `createFigure()` for proper figure numbering and cross-referencing |

## Trade Study / Technical Report Patterns

### Integration Effort Table
For hardware/software upgrade trade studies, use realistic effort estimates:

| Task Category | Typical Hours | Station Impact |
|---------------|---------------|----------------|
| Hardware Installation | 10 | No impact |
| Driver Installation/Configuration | 10 | No impact |
| Software Development | 40 | No impact |
| Functional Verification Testing | 80 | Full downtime |
| Functional Validation Testing | 40 | Full downtime |
| Documentation Updates | 80 | No impact |

**Key distinctions:**
- **Verification** = Does the system work correctly? (longer, comprehensive)
- **Validation** = Does it meet requirements? (shorter, focused)
- **No impact** tasks can be done offline/in parallel
- **Full downtime** tasks require exclusive station access

```javascript
// Integration Effort Table pattern
createIntegrationEffortTable([
  { task: "Hardware Installation", duration: "10 hours", impact: "No impact" },
  { task: "Driver Installation/Configuration", duration: "10 hours", impact: "No impact" },
  { task: "Software Development", duration: "40 hours", impact: "No impact" },
  { task: "Functional Verification Testing", duration: "80 hours", impact: "Full downtime" },
  { task: "Functional Validation Testing", duration: "40 hours", impact: "Full downtime" },
  { task: "Documentation Updates", duration: "80 hours", impact: "No impact" }
])
```

### Title Page Conventions
- **Test Sets**: Include test set P/N in program title (e.g., "MCU ATP/ESS TEST SET: 83-96899")
- **Trade Studies**: Use descriptive title without P/N if document is informational
- **Author Format**: "Last, First" for formal documents (e.g., "Simon Jr, Daniel")
- **Initial Revision**: Use "-" (dash) for draft, "A0" for first release

### Risk Assessment Table
Standard columns: Risk ID | Description | Probability | Impact | Mitigation

Color coding:
- **High** (Prob/Impact): Red background (`FFC7CE`)
- **Medium**: Yellow background (`FFEB9C`)
- **Low**: Green background (`C6EFCE`)

## Tips

- **Part Numbers**: `Courier New` font, centered in title page
- **Traceability**: Link test steps to requirements using `[REQ-xxx]` references
- **Classification**: Add marking via `engineeringFooter("UNCLASSIFIED")`
- **Consistent widths**: All tables use DXA units (1440 = 1 inch)
- **Images**: Use absolute paths; relative paths resolve from script location
- **TOC Update**: Word TOC fields require `Ctrl+A, F9` to populate after opening
- **Cross-refs**: Use consistent bookmarkId naming (e.g., `table_1`, `fig_1`) for maintainability
- **Effort Estimates**: Don't underestimate - verification/validation testing takes significant time
- **List of Tables**: Include after TOC for documents with 3+ tables

---

## Editing Existing Word Documents (OOXML)

When you need to edit an existing Word document while **preserving all formatting**, use the OOXML workflow instead of creating a new document. This is essential for:

- Revising trade studies, procedures, or specifications
- Correcting part numbers, dates, or technical data
- Updating references without breaking document structure
- Making surgical edits to complex formatted documents

### Why OOXML Editing Preserves Formatting

A .docx file is a ZIP archive containing XML files. Each text run has this structure:

```xml
<w:r w:rsidRPr="0000551D">
  <w:rPr>
    <w:b/>           <!-- Bold -->
    <w:sz w:val="20"/>  <!-- Font size -->
  </w:rPr>
  <w:t>Your text here</w:t>
</w:r>
```

The key is extracting and reusing the `<w:rPr>` (run properties) block when replacing text.

### Quick Reference

> **Path note:** the commands below run from the `document-skills:docx` skill directory (the plugin you invoked first). **Do not hardcode the plugin cache path** — it contains a version hash (e.g. `…/document-skills/<hash>/skills/docx`) that changes on every plugin update. Invoke the scripts relative to that skill directory.

| Step | Command |
|------|---------|
| 1. Unpack | `python scripts/office/unpack.py input.docx unpacked_dir` |
| 2. Find text | `grep -n "search term" unpacked_dir/word/document.xml` |
| 3. Edit | Use the **Edit tool** directly on `unpacked_dir/word/document.xml` (see below) |
| 4. Pack | `python scripts/office/pack.py unpacked_dir output.docx --original input.docx` |

### Editing: use the Edit tool, not a Python script

The current `document-skills:docx` skill edits the unpacked XML **directly with the Edit tool** — simpler than a script, it shows exactly what changes, and it needs no dependencies.

> ⚠️ Earlier versions of this skill imported a Python `Document` class from the docx skill (`from scripts.document import Document`) and `sys.path.insert`-ed a hardcoded cache path. **That class no longer exists in the upstream plugin** — do not import it and do not hardcode a cache path. Use the Edit-tool workflow below.

**Preserve formatting** by editing only the text inside `<w:t>` and leaving the run-properties block `<w:rPr>…</w:rPr>` untouched:

```xml
<!-- BEFORE -->
<w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>P/N 779068-01</w:t></w:r>
<!-- AFTER — rPr preserved, only the <w:t> text changed -->
<w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>P/N 779630-01</w:t></w:r>
```

**Preserve whitespace** for text with leading/trailing spaces by adding `xml:space="preserve"`:

```xml
<w:r><w:rPr>…</w:rPr><w:t xml:space="preserve">CAUTION: </w:t></w:r>
```

**Tracked changes / comments**: the docx skill ships helpers — `python scripts/comment.py unpacked/ 0 "comment text"` adds a comment; `python scripts/accept_changes.py in.docx out.docx` flattens tracked changes. See the docx skill's SKILL.md for the `<w:ins>`/`<w:del>` XML patterns.

> If you must script a large batch of repetitive replacements, `ooxml-edit-template.ts` in this skill directory (run via `node ooxml-edit-template.ts`) is a **self-contained, zero-dependency** helper that does run-level find/replace while preserving each run's `<w:rPr>` — no docx-skill import and no hardcoded paths.

### Common Engineering Document Edits

| Edit Type | Find this `<w:t>` text | Replace with |
|-----------|------------------------|--------------|
| Part number correction | `P/N 779068-01` | corrected P/N |
| Date format change | `02/03/2026` | `03 Feb 2026` |
| Status update | `NRND` | `EOL` |
| Reference update | `[1]` | `[1]` + document number |
| Terminology change | `APPROVED` | `RECOMMENDED` |

### Workflow Example: Trade Study Revision

```bash
# 1. Copy original to a working location
cp "Trade_Study_A0.docx" "C:/Temp/Trade_Study_B0.docx"

# 2. Unpack (run from the document-skills:docx skill directory)
python scripts/office/unpack.py "C:/Temp/Trade_Study_B0.docx" "C:/Temp/unpacked"

# 3. Search for the text to edit
grep -n "779068-01" "C:/Temp/unpacked/word/document.xml"
grep -n "approaching end-of-life" "C:/Temp/unpacked/word/document.xml"

# 4. Edit C:/Temp/unpacked/word/document.xml with the Edit tool
#    (change <w:t> text only; keep each run's <w:rPr> intact)

# 5. Pack back to docx
python scripts/office/pack.py "C:/Temp/unpacked" "C:/Temp/Trade_Study_B0.docx" --original "Trade_Study_A0.docx"
```

### Windows Notes

- Use forward slashes `/` or escaped backslashes `\\` in paths
- `unpack.py` converts smart quotes to XML entities (e.g. `&#x201C;`) so they survive editing — use those entities when adding new quoted text
- If `pack.py` validation fails on Windows due to encoding, re-run it with `--validate false`
