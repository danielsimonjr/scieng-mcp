<!-- repo-map:no-verification -->
<!-- GENERATED FILE -- do not edit by hand.
     Regenerate with `repo-tools map`. -->

# Unused Files and Exports Analysis

## Summary

- **Files with no in-repo importer**: 3
- **Dormant files**: 3
  - **Orphaned (reachable from nothing)**: 3
  - **Test-only (only a test reaches them)**: 0
- **Potentially unused exports**: 57
  - **Unreferenced anywhere**: 19
  - **Referenced in their own module**: 38
  - **Not classified**: 0

## Caveats

- A literal relative `import(...)` is a graph edge. A runtime call is a namespace use (`*`), so the exports of that file count as used. A type-position `import(...).Name` counts only `Name`, and `typeof import(...)` counts none. A dynamic import built from a variable or a template, and other runtime loads (e.g. `new Worker(path)`), are still invisible -- a file or export reached ONLY through one of those is reported as no-importer/unreferenced even though it may be live.
- `noImporterFiles` is NOT a deletion-candidate list. A file with zero in-repo importers is expected, not suspicious, for: a standalone script invoked directly (e.g. a smoketest run via `node script.mjs`, never `import`ed by anything), or a build/lint config file loaded by its own tool rather than by source code (e.g. `eslint.config.mjs`, read by eslint itself). Cross-check against package.json scripts / tool configs before treating any entry here as dead.
- Only NAMED exports are analysed (`FileNode.exports` carries named exports only) -- `export default` usage is not checked here.
- The split of exports into `referencedInModule` and `unreferencedAnywhere` is a TEXT-LEVEL heuristic. The analysis counts whole-identifier occurrences in the source of the defining file, minus the declaration site itself. The count is not an AST reference count. The analysis can over-count a name that also appears in a string literal or comment. When the source text cannot be read (no `RepoGraph.root_path`, or the file is missing), the export lands in `unclassifiedExports`. The analysis does not guess a bucket for it.
- `unreferencedAnywhereNotes`'s dynamic-import check (`_dynamic_import_referrers`) only sees `import(...)` calls with a LITERAL string specifier. A dynamic import built from a variable or template literal (e.g. `import(`./cmds/${name}.js`)`, a command-dispatcher pattern) is invisible to it -- 'found none' in a note means no LITERAL match was found, NOT that nothing imports the file.

## Dormant files: orphaned

Source files that no root and no test reaches. Verify each one before you delete it.

- `plugin/skills/scieng/engineering-patterns.ts`
- `plugin/skills/scieng/stubs/docx.d.ts`
- `smoke/render.smoke.ts`

## Dormant files: test-only

Source files that only a test reaches. They ship nothing, but a test uses them.

_None._

## Files with no in-repo importer

No file of this repository imports these files. Do not use the list as a deletion list.

- `plugin/skills/scieng/engineering-patterns.ts`
- `plugin/skills/scieng/stubs/docx.d.ts`
- `smoke/render.smoke.ts`

## Exports unreferenced anywhere

No other file imports these names, and their own module does not use them.

- `plugin/skills/scieng/stubs/docx.d.ts`: `AlignmentType`, `Bookmark`, `BorderStyle`, `Footer`, `Header`, `HeadingLevel`, `ImageRun`, `InternalHyperlink`, `PageNumber`, `Paragraph`, `ShadingType`, `StyleLevel`, `Table`, `TableCell`, `TableOfContents`, `TableRow`, `TextRun`, `VerticalAlign`, `WidthType`

### Notes

- `plugin/skills/scieng/stubs/docx.d.ts` `AlignmentType`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'AlignmentType' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `Bookmark`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'Bookmark' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `BorderStyle`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'BorderStyle' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `Footer`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'Footer' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `Header`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'Header' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `HeadingLevel`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'HeadingLevel' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `ImageRun`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'ImageRun' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `InternalHyperlink`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'InternalHyperlink' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `PageNumber`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'PageNumber' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `Paragraph`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'Paragraph' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `ShadingType`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'ShadingType' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `StyleLevel`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'StyleLevel' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `Table`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'Table' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `TableCell`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'TableCell' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `TableOfContents`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'TableOfContents' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `TableRow`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'TableRow' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `TextRun`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'TextRun' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `VerticalAlign`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'VerticalAlign' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.
- `plugin/skills/scieng/stubs/docx.d.ts` `WidthType`: Checked for a dynamic import() call with a LITERAL string specifier resolving to 'plugin/skills/scieng/stubs/docx.d.ts' across the whole repo and found none. This scan can only see import() calls with a literal string specifier -- a dynamic import built from a variable or template literal (e.g. import(`./cmds/${name}.js`)) is invisible to it, so 'found none' means no LITERAL match was found, NOT that nothing imports this. 'WidthType' may still be consumed via such a call. Also verify against consumption this scan cannot see at all (docs examples, published API surface, a runtime-built path/`new Worker(...)`) before deleting.

## Exports referenced in their own module

No other file imports these names, but their own module uses them.

- `plugin/skills/scieng/engineering-patterns.ts`: `createApprovalTable`, `createCaution`, `createCodeBlock`, `createComparisonTable`, `createEquipmentTable`, `createFigure`, `createFigureCaption`, `createFigureRef`, `createImage`, `createImageWithSize`, `createIntegrationEffortTable`, `createListOfFigures`, `createListOfTables`, `createNote`, `createRequirementsTable`, `createRevisionHistory`, `createRiskAssessmentTable`, `createSignalTable`, `createSpecsTable`, `createTableCaption`, `createTableOfContents`, `createTableRef`, `createTestProcedure`, `createTitlePage`, `createTitledTable`, `createWarning`, `engineeringFooter`, `engineeringHeader`, `engineeringStyles`, `formatValue`, `mathSymbols`
- `src/ooxml-edit.ts`: `EditResult`
- `src/render-any.ts`: `AnyRenderResult`
- `src/render-html.ts`: `BlockType`
- `src/render-latex.ts`: `Block`, `LatexFailure`, `LatexFormat`
- `src/tools.ts`: `ToolResult`

## Exports not classified

The analysis could not read the source of these names.

_None._
