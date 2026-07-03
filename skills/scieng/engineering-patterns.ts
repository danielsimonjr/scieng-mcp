/**
 * =============================================================================
 * ENGINEERING DOCX PATTERNS - TypeScript Reference
 * =============================================================================
 *
 * PURPOSE:
 *   Complete docx-js patterns for engineering documentation.
 *   Copy/adapt these functions for your documents.
 *
 * TYPE-CHECKING NOTE:
 *   This is a type-checked reference module — it is NEVER executed at
 *   skill-use time. It is copy/adapted by hand into a consumer's own
 *   document-generation script. Its types are satisfied by the LOCAL ambient
 *   stub at `stubs/docx.d.ts`; there is NO `docx` dependency in this skill.
 *   Verify correctness with `npx tsc --noEmit`, not by running this file.
 *
 * CREATED: February 2026
 * UPDATED: February 2026 - Added TOC, table/figure captions, cross-references, images
 * UPDATED: July 2026 - Converted to type-checked TypeScript reference (local docx.d.ts stub)
 * AUTHOR: Claude (for Daniel Simon Jr.)
 *
 * USAGE:
 *   Reference file - copy relevant functions into your document script.
 *   Requires (in the CONSUMING script, not here): npm install -g docx
 *
 * DEPENDENCIES:
 *   - docx (npm install -g docx) — used only by consumers who copy these
 *     patterns into an executable script; NOT a dependency of this skill.
 *   - fs (built-in Node.js)
 * =============================================================================
 */

import {
  Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  PageNumber, ShadingType, VerticalAlign, TableOfContents,
  Bookmark, InternalHyperlink, ImageRun,
  StyleLevel
} from "docx";
import * as fs from "node:fs";

// =============================================================================
// STYLES (with Caption styles for List of Tables/Figures)
// =============================================================================

// The full docx `IStylesOptions` shape is not modeled by the local stub;
// `any` documents that this is a plain data object handed to `new Document({ styles: ... })`.
const engineeringStyles: any = {
  default: { document: { run: { font: "Arial", size: 22 } } }, // 11pt body
  paragraphStyles: [
    { id: "Title", name: "Title", basedOn: "Normal",
      run: { size: 36, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER } },
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 28, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 22, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    { id: "PartNumber", name: "Part Number", basedOn: "Normal",
      run: { size: 24, bold: true, font: "Courier New" },
      paragraph: { alignment: AlignmentType.CENTER } },
    { id: "RequirementID", name: "Requirement ID", basedOn: "Normal",
      run: { size: 20, bold: true, font: "Courier New", color: "0066CC" } },
    { id: "CodeBlock", name: "Code Block", basedOn: "Normal",
      run: { size: 18, font: "Consolas" },
      paragraph: { spacing: { before: 120, after: 120 }, indent: { left: 360 } } },
    { id: "CautionNote", name: "Caution Note", basedOn: "Normal",
      run: { size: 22, bold: true, color: "FF6600" },
      paragraph: { spacing: { before: 120, after: 120 } } },
    { id: "WarningNote", name: "Warning Note", basedOn: "Normal",
      run: { size: 22, bold: true, color: "CC0000" },
      paragraph: { spacing: { before: 120, after: 120 } } },
    // Caption styles for List of Tables/Figures
    { id: "Caption", name: "Caption", basedOn: "Normal",
      run: { size: 20, italics: false, font: "Arial" },
      paragraph: { spacing: { before: 120, after: 120 } } },
    { id: "TableCaption", name: "Table Caption", basedOn: "Caption",
      run: { size: 20, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 240, after: 120 } } },
    { id: "FigureCaption", name: "Figure Caption", basedOn: "Caption",
      run: { size: 20, font: "Arial" },
      paragraph: { spacing: { before: 120, after: 240 }, alignment: AlignmentType.CENTER } }
  ],
  characterStyles: [
    { id: "Hyperlink", name: "Hyperlink", basedOn: "DefaultParagraphFont",
      run: { color: "0066CC", underline: { type: "single" } } }
  ]
};

// =============================================================================
// HEADER/FOOTER
// =============================================================================

const engineeringHeader = (partNumber: string, revision: string, title: string): Header => new Header({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${partNumber} Rev ${revision}`, bold: true, size: 20 }),
        new TextRun({ text: `  |  ${title}`, size: 20 })
      ]
    })
  ]
});

const engineeringFooter = (classification: string = "UNCLASSIFIED"): Footer => new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: classification, size: 18 }),
        new TextRun({ text: "  |  Page ", size: 18 }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
        new TextRun({ text: " of ", size: 18 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })
      ]
    })
  ]
});

// =============================================================================
// TABLE OF CONTENTS (Active/Clickable)
// =============================================================================

/**
 * Creates an active Table of Contents with hyperlinks.
 * User must update TOC in Word: Right-click TOC → "Update Field" → "Update entire table"
 *
 * @param title - Title for the TOC section (e.g., "TABLE OF CONTENTS")
 * @param maxLevel - Maximum heading level to include (1-3 recommended)
 */
function createTableOfContents(title: string = "TABLE OF CONTENTS", maxLevel: number = 3): (Paragraph | TableOfContents)[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(title)]
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: `1-${maxLevel}`,
      stylesWithLevels: [
        new StyleLevel("Heading1", 1),
        new StyleLevel("Heading2", 2),
        new StyleLevel("Heading3", 3)
      ]
    })
  ];
}

/**
 * Creates a List of Tables (requires manual TOC field in Word)
 * This creates a placeholder - in Word, insert Table of Figures field with \c "Table"
 */
function createListOfTables(): Paragraph[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("LIST OF TABLES")]
    }),
    new Paragraph({
      children: [new TextRun({ text: "[Update this field in Word: Insert → Table of Figures → Caption label: Table]", italics: true, color: "888888", size: 20 })]
    })
  ];
}

/**
 * Creates a List of Figures (requires manual TOC field in Word)
 */
function createListOfFigures(): Paragraph[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("LIST OF FIGURES")]
    }),
    new Paragraph({
      children: [new TextRun({ text: "[Update this field in Word: Insert → Table of Figures → Caption label: Figure]", italics: true, color: "888888", size: 20 })]
    })
  ];
}

// =============================================================================
// TABLE CAPTIONS WITH BOOKMARKS (for cross-references)
// =============================================================================

/**
 * Creates a table caption with bookmark for cross-referencing.
 * Place ABOVE the table.
 *
 * @param number - Table number (e.g., 1, 2, 3)
 * @param title - Table title
 * @param bookmarkId - Unique bookmark ID for cross-references (e.g., "tbl_equipment")
 * @returns Caption paragraph with embedded bookmark
 */
function createTableCaption(number: number, title: string, bookmarkId: string | null = null): Paragraph {
  const id = bookmarkId || `table_${number}`;
  return new Paragraph({
    style: "TableCaption",
    spacing: { before: 240, after: 120 },
    children: [
      new Bookmark({
        id: id,
        children: [
          new TextRun({ text: `Table ${number}: `, bold: true, size: 20 }),
          new TextRun({ text: title, size: 20 })
        ]
      })
    ]
  });
}

/**
 * Creates an inline reference to a table (hyperlink).
 *
 * @param number - Table number to reference
 * @param bookmarkId - Bookmark ID of the target table
 * @returns Clickable reference
 */
function createTableRef(number: number, bookmarkId: string | null = null): InternalHyperlink {
  const id = bookmarkId || `table_${number}`;
  return new InternalHyperlink({
    anchor: id,
    children: [
      new TextRun({ text: `Table ${number}`, style: "Hyperlink", color: "0066CC", underline: {} })
    ]
  });
}

// =============================================================================
// FIGURE/IMAGE CAPTIONS WITH BOOKMARKS
// =============================================================================

/**
 * Creates a figure caption with bookmark for cross-referencing.
 * Place BELOW the figure/image.
 *
 * @param number - Figure number
 * @param title - Figure title/description
 * @param bookmarkId - Unique bookmark ID (e.g., "fig_schematic")
 * @returns Caption paragraph with embedded bookmark
 */
function createFigureCaption(number: number, title: string, bookmarkId: string | null = null): Paragraph {
  const id = bookmarkId || `figure_${number}`;
  return new Paragraph({
    style: "FigureCaption",
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240 },
    children: [
      new Bookmark({
        id: id,
        children: [
          new TextRun({ text: `Figure ${number}: `, bold: true, size: 20 }),
          new TextRun({ text: title, size: 20 })
        ]
      })
    ]
  });
}

/**
 * Creates an inline reference to a figure (hyperlink).
 *
 * @param number - Figure number to reference
 * @param bookmarkId - Bookmark ID of the target figure
 * @returns Clickable reference
 */
function createFigureRef(number: number, bookmarkId: string | null = null): InternalHyperlink {
  const id = bookmarkId || `figure_${number}`;
  return new InternalHyperlink({
    anchor: id,
    children: [
      new TextRun({ text: `Figure ${number}`, style: "Hyperlink", color: "0066CC", underline: {} })
    ]
  });
}

// =============================================================================
// IMAGE INSERTION
// =============================================================================

/**
 * Creates an image paragraph from a file.
 *
 * @param imagePath - Path to image file
 * @param widthInches - Width in inches (height auto-calculated to preserve aspect)
 * @param altText - Alternative text for accessibility
 * @returns Paragraph containing the image
 */
function createImage(imagePath: string, widthInches: number = 6, altText: string = "Image"): Paragraph {
  const imageBuffer = fs.readFileSync(imagePath);
  const ext = imagePath.split('.').pop()!.toLowerCase();
  const typeMap: Record<string, string> = { png: "png", jpg: "jpg", jpeg: "jpeg", gif: "gif", bmp: "bmp" };

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        data: imageBuffer,
        type: typeMap[ext] || "png",
        transformation: {
          width: widthInches * 72,  // Convert inches to points
          height: widthInches * 72 * 0.75  // Default 4:3 aspect ratio
        },
        altText: { title: altText, description: altText, name: altText }
      })
    ]
  });
}

/**
 * Creates an image with specific dimensions.
 *
 * @param imagePath - Path to image file
 * @param widthInches - Width in inches
 * @param heightInches - Height in inches
 * @param altText - Alternative text
 * @returns Paragraph containing the image
 */
function createImageWithSize(imagePath: string, widthInches: number, heightInches: number, altText: string = "Image"): Paragraph {
  const imageBuffer = fs.readFileSync(imagePath);
  const ext = imagePath.split('.').pop()!.toLowerCase();
  const typeMap: Record<string, string> = { png: "png", jpg: "jpg", jpeg: "jpeg", gif: "gif", bmp: "bmp" };

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        data: imageBuffer,
        type: typeMap[ext] || "png",
        transformation: {
          width: widthInches * 72,
          height: heightInches * 72
        },
        altText: { title: altText, description: altText, name: altText }
      })
    ]
  });
}

/**
 * Creates a complete figure block: image + caption with bookmark.
 *
 * @param imagePath - Path to image file
 * @param figureNumber - Figure number
 * @param title - Figure caption title
 * @param widthInches - Image width in inches
 * @param bookmarkId - Optional bookmark ID
 * @returns Array of [image paragraph, caption paragraph]
 */
function createFigure(imagePath: string, figureNumber: number, title: string, widthInches: number = 5, bookmarkId: string | null = null): Paragraph[] {
  return [
    createImage(imagePath, widthInches, title),
    createFigureCaption(figureNumber, title, bookmarkId)
  ];
}

// =============================================================================
// TITLED TABLE (Table with caption above)
// =============================================================================

/**
 * Creates a complete table block: caption + table.
 *
 * @param tableNumber - Table number
 * @param title - Table caption title
 * @param table - The table object
 * @param bookmarkId - Optional bookmark ID
 * @returns Array of [caption paragraph, table]
 */
function createTitledTable(tableNumber: number, title: string, table: Table, bookmarkId: string | null = null): (Paragraph | Table)[] {
  return [
    createTableCaption(tableNumber, title, bookmarkId),
    table
  ];
}

// =============================================================================
// TITLE PAGE & APPROVAL
// =============================================================================

interface ApprovalEntry {
  role: string;
  name: string;
}

interface TitlePageConfig {
  partNumber: string;
  revision: string;
  title: string;
  program: string;
  preparedBy: string;
  date: string;
  approvals: ApprovalEntry[];
}

function createTitlePage(config: TitlePageConfig): (Paragraph | Table)[] {
  const { partNumber, revision, title, program, preparedBy, date, approvals } = config;
  return [
    new Paragraph({ spacing: { before: 2400 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: program, bold: true, size: 32 })] }),
    new Paragraph({ spacing: { before: 480 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, bold: true, size: 48 })] }),
    new Paragraph({ spacing: { before: 480 } }),
    new Paragraph({ style: "PartNumber", children: [new TextRun({ text: partNumber })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Revision ${revision}`, size: 24 })] }),
    new Paragraph({ spacing: { before: 960 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Prepared by: ${preparedBy}`, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Date: ${date}`, size: 22 })] }),
    new Paragraph({ spacing: { before: 960 } }),
    createApprovalTable(approvals)
  ];
}

function createApprovalTable(approvals: ApprovalEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [2340, 3120, 2340, 1560],
    rows: [
      new TableRow({
        children: ["Role", "Name", "Signature", "Date"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "CCCCCC", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20 })] })]
          })
        )
      }),
      ...approvals.map(({ role, name }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: role, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: name, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] })
          ]
        })
      )
    ]
  });
}

// =============================================================================
// REVISION HISTORY
// =============================================================================

interface RevisionEntry {
  rev: string;
  date: string;
  author: string;
  description: string;
}

function createRevisionHistory(revisions: RevisionEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [1200, 1560, 2000, 4600],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Rev", "Date", "Author", "Description of Changes"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20 })] })]
          })
        )
      }),
      ...revisions.map(({ rev, date, author, description }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rev, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: date, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: author, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 4600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: description, size: 20 })] })] })
          ]
        })
      )
    ]
  });
}

// =============================================================================
// REQUIREMENTS TRACEABILITY
// =============================================================================

interface RequirementEntry {
  id: string;
  text: string;
  verifyMethod: string;
  status: string;
  testRef: string;
}

function createRequirementsTable(requirements: RequirementEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [1400, 4000, 1200, 1200, 1560],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Req ID", "Requirement Text", "Verify", "Status", "Test Ref"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })]
          })
        )
      }),
      ...requirements.map(({ id, text, verifyMethod, status, testRef }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: id, size: 18, font: "Courier New" })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: verifyMethod, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, shading: { fill: status === "Pass" ? "C6EFCE" : status === "Fail" ? "FFC7CE" : "FFFFFF", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: status, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: testRef, size: 18 })] })] })
          ]
        })
      )
    ]
  });
}

// =============================================================================
// TEST PROCEDURES
// =============================================================================

interface TestStep {
  step: number | string;
  action: string;
  expected: string;
  result?: string;
}

function createTestProcedure(steps: TestStep[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [800, 4800, 2400, 1360],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Step", "Action", "Expected Result", "P/F"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20 })] })]
          })
        )
      }),
      ...steps.map(({ step, action, expected, result }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: step.toString(), size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: action, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: expected, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: result || "", size: 20 })] })] })
          ]
        })
      )
    ]
  });
}

interface EquipmentEntry {
  name: string;
  partNumber: string;
  calDue: string;
  serial: string;
}

function createEquipmentTable(equipment: EquipmentEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [2800, 2400, 2000, 2160],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Equipment", "Part Number", "Cal Due", "Serial #"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20 })] })]
          })
        )
      }),
      ...equipment.map(({ name, partNumber, calDue, serial }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: name, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: partNumber, size: 20, font: "Courier New" })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: calDue, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: serial, size: 20 })] })] })
          ]
        })
      )
    ]
  });
}

// =============================================================================
// WARNING/CAUTION/NOTE BLOCKS (MIL-STD-38784)
// =============================================================================

function createWarning(text: string): Table {
  const border = { style: BorderStyle.SINGLE, size: 2, color: "CC0000" };
  return new Table({
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: border, bottom: border, left: border, right: border },
        shading: { fill: "FFCCCC", type: ShadingType.CLEAR },
        children: [
          new Paragraph({ children: [new TextRun({ text: "WARNING", bold: true, color: "CC0000", size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text, size: 22 })] })
        ]
      })]
    })]
  });
}

function createCaution(text: string): Table {
  const border = { style: BorderStyle.SINGLE, size: 2, color: "FF9900" };
  return new Table({
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: border, bottom: border, left: border, right: border },
        shading: { fill: "FFF2CC", type: ShadingType.CLEAR },
        children: [
          new Paragraph({ children: [new TextRun({ text: "CAUTION", bold: true, color: "FF6600", size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text, size: 22 })] })
        ]
      })]
    })]
  });
}

function createNote(text: string): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "0066CC" };
  return new Table({
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: border, bottom: border, left: border, right: border },
        shading: { fill: "DEEAF6", type: ShadingType.CLEAR },
        children: [
          new Paragraph({ children: [new TextRun({ text: "NOTE: ", bold: true, color: "0066CC", size: 22 }), new TextRun({ text, size: 22 })] })
        ]
      })]
    })]
  });
}

// =============================================================================
// TECHNICAL DATA TABLES
// =============================================================================

interface SpecEntry {
  parameter: string;
  value: string | number;
  unit?: string;
}

function createSpecsTable(specs: SpecEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [3600, 5760],
    rows: specs.map(({ parameter, value, unit }) =>
      new TableRow({
        children: [
          new TableCell({ borders: cellBorders, shading: { fill: "F2F2F2", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: parameter, bold: true, size: 22 })] })] }),
          new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: `${value}${unit ? ' ' + unit : ''}`, size: 22 })] })] })
        ]
      })
    )
  });
}

interface SignalEntry {
  name: string;
  type: string;
  direction: string;
  pin: string;
  range: string;
  description: string;
}

function createSignalTable(signals: SignalEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [1800, 1200, 1200, 1200, 1600, 2360],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Signal Name", "Type", "Direction", "Pin", "Range", "Description"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })]
          })
        )
      }),
      ...signals.map(({ name, type, direction, pin, range, description }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: name, size: 18, font: "Courier New" })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: type, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: direction, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pin, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: range, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: description, size: 18 })] })] })
          ]
        })
      )
    ]
  });
}

// =============================================================================
// INTEGRATION EFFORT / TRADE STUDY TABLES
// =============================================================================

interface IntegrationTask {
  task: string;
  duration: string;
  impact: string;
}

/**
 * Creates an integration effort estimate table for trade studies.
 * Station Impact column is color-coded: No impact=green, Limited=blue, Full downtime=yellow
 *
 * @param tasks - [{task, duration, impact}]
 */
function createIntegrationEffortTable(tasks: IntegrationTask[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  const impactColor = (impact: string): string => {
    if (impact.toLowerCase().includes("no impact")) return "C6EFCE";  // Green
    if (impact.toLowerCase().includes("full downtime")) return "FFEB9C";  // Yellow
    if (impact.toLowerCase().includes("limited")) return "DEEAF6";  // Blue
    return "FFFFFF";
  };

  return new Table({
    columnWidths: [4000, 2680, 2680],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Task", "Duration", "Station Impact"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20 })] })]
          })
        )
      }),
      ...tasks.map(({ task, duration, impact }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: task, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: duration, size: 20 })] })] }),
            new TableCell({ borders: cellBorders, shading: { fill: impactColor(impact), type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: impact, size: 20 })] })] })
          ]
        })
      )
    ]
  });
}

interface RiskEntry {
  id: string;
  description: string;
  probability: string;
  impact: string;
  mitigation: string;
}

/**
 * Creates a risk assessment matrix table.
 * Probability and Impact columns are color-coded: High=red, Medium=yellow, Low=green
 *
 * @param risks - [{id, description, probability, impact, mitigation}]
 */
function createRiskAssessmentTable(risks: RiskEntry[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  const riskColor = (level: string): string => {
    const l = level.toLowerCase();
    if (l === "high") return "FFC7CE";  // Red
    if (l === "medium") return "FFEB9C";  // Yellow
    if (l === "low") return "C6EFCE";  // Green
    return "FFFFFF";
  };

  return new Table({
    columnWidths: [1200, 3400, 1100, 1100, 2560],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Risk ID", "Description", "Prob", "Impact", "Mitigation"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })]
          })
        )
      }),
      ...risks.map(({ id, description, probability, impact, mitigation }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: id, size: 18, font: "Courier New" })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: description, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, shading: { fill: riskColor(probability), type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: probability, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, shading: { fill: riskColor(impact), type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: impact, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: mitigation, size: 18 })] })] })
          ]
        })
      )
    ]
  });
}

interface ComparisonRow {
  parameter: string;
  col1Value: string;
  col2Value: string;
  assessment: string;
}

/**
 * Creates a comparison table for trade studies (e.g., PXI-6229 vs PXIe-6363).
 * Assessment column is color-coded: "Superior"=green, "Equivalent"=white
 *
 * @param col1Header - First comparison item header
 * @param col2Header - Second comparison item header
 * @param rows - [{parameter, col1Value, col2Value, assessment}]
 */
function createComparisonTable(col1Header: string, col2Header: string, rows: ComparisonRow[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  return new Table({
    columnWidths: [2600, 2200, 2200, 2360],
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Parameter", col1Header, col2Header, "Assessment"].map(text =>
          new TableCell({
            borders: cellBorders,
            shading: { fill: "D9E2F3", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })]
          })
        )
      }),
      ...rows.map(({ parameter, col1Value, col2Value, assessment }) =>
        new TableRow({
          children: [
            new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: parameter, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: col1Value, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: col2Value, size: 18 })] })] }),
            new TableCell({ borders: cellBorders, shading: { fill: assessment.toLowerCase().includes("superior") ? "C6EFCE" : "FFFFFF", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: assessment, size: 18 })] })] })
          ]
        })
      )
    ]
  });
}

// =============================================================================
// UTILITIES
// =============================================================================

const mathSymbols: Record<string, string> = {
  plusMinus: '±', degree: '°', micro: 'µ', ohm: 'Ω',
  delta: 'Δ', sigma: 'σ', squared: '²', cubed: '³',
  sqrt: '√', infinity: '∞', leq: '≤', geq: '≥',
  neq: '≠', approx: '≈', times: '×', divide: '÷'
};

function formatValue(value: string | number, unit: string): string {
  const unitMap: Record<string, string> = {
    'V': 'V', 'mV': 'mV', 'uV': 'µV', 'A': 'A', 'mA': 'mA', 'uA': 'µA',
    'ohm': 'Ω', 'kohm': 'kΩ', 'Mohm': 'MΩ',
    'Hz': 'Hz', 'kHz': 'kHz', 'MHz': 'MHz', 'GHz': 'GHz',
    'degC': '°C', 'degF': '°F',
    's': 's', 'ms': 'ms', 'us': 'µs', 'ns': 'ns',
    'W': 'W', 'mW': 'mW', 'kW': 'kW', 'dB': 'dB', 'dBm': 'dBm',
    'psi': 'psi', 'kPa': 'kPa', 'bar': 'bar'
  };
  return `${value} ${unitMap[unit] || unit}`;
}

function createCodeBlock(code: string): Table {
  const lines = code.split('\n');
  return new Table({
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
        children: lines.map(line => new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new TextRun({ text: line || " ", font: "Consolas", size: 18 })] }))
      })]
    })]
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Styles
  engineeringStyles,

  // Header/Footer
  engineeringHeader, engineeringFooter,

  // Table of Contents
  createTableOfContents, createListOfTables, createListOfFigures,

  // Captions and Cross-References
  createTableCaption, createTableRef,
  createFigureCaption, createFigureRef,
  createTitledTable,

  // Images
  createImage, createImageWithSize, createFigure,

  // Document Structure
  createTitlePage, createApprovalTable, createRevisionHistory,

  // Requirements
  createRequirementsTable,

  // Test Procedures
  createTestProcedure, createEquipmentTable,

  // Warning/Caution/Note
  createWarning, createCaution, createNote,

  // Technical Data
  createSpecsTable, createSignalTable,

  // Trade Study / Technical Reports
  createIntegrationEffortTable, createRiskAssessmentTable, createComparisonTable,

  // Utilities
  mathSymbols, formatValue, createCodeBlock
};
