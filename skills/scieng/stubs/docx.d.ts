// Minimal ambient stub for the `docx` npm package so engineering-patterns.ts
// type-checks WITHOUT a dependency. engineering-patterns.ts is a copy-paste
// reference that is never executed at skill-use time; this stub exists only
// to satisfy `tsc --noEmit`. It intentionally models only the identifiers
// actually referenced in engineering-patterns.ts (verified via grep), with
// loose (`any`-heavy) shapes — precision is not the goal here.
declare module "docx" {
  // Value-and-type dual exports: each class is constructable and usable as a type.
  export class Paragraph {
    constructor(opts?: any);
  }
  export class TextRun {
    constructor(opts?: any);
  }
  export class Header {
    constructor(opts?: any);
  }
  export class Footer {
    constructor(opts?: any);
  }
  export class Table {
    constructor(opts?: any);
  }
  export class TableRow {
    constructor(opts?: any);
  }
  export class TableCell {
    constructor(opts?: any);
  }
  export class TableOfContents {
    constructor(...args: any[]);
  }
  export class ImageRun {
    constructor(opts?: any);
  }
  export class Bookmark {
    constructor(opts?: any);
  }
  export class InternalHyperlink {
    constructor(opts?: any);
  }
  export class StyleLevel {
    constructor(...args: any[]);
  }
  // Enums/const groups referenced as values — model as loose records:
  export const HeadingLevel: Record<string, string>;
  export const AlignmentType: Record<string, string>;
  export const WidthType: Record<string, string>;
  export const BorderStyle: Record<string, string>;
  export const PageNumber: Record<string, any>;
  export const ShadingType: Record<string, string>;
  export const VerticalAlign: Record<string, string>;
}
