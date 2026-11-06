import type { Tool } from "@modelcontextprotocol/server";
import { z } from "zod";
import { RENDER_ERROR_CODES, INPUT_TYPES, OUTPUT_FORMATS, BINARY_INPUT_TYPES, loadConfig, capabilities as engineCapabilities } from "@danielsimonjr/sciengjs";
import { readInput, readInputBytes, deriveOutputPath, writeOutput } from "./render-lib.ts";
import { renderMermaidSource, MERMAID_FORMATS } from "./render-mermaid.ts";
import { renderAny, renderPlotSvg } from "./render-any.ts";
import { renderDotSource } from "./render-dot.ts";
import { engineConfig } from "./engine-config.ts";
import { renderLatexSource, LATEX_FORMATS } from "./render-latex.ts";
import { buildHtml, resolveStaticBlocks, type HtmlBlock } from "./render-html.ts";
import { applyEdits } from "./ooxml-edit.ts";
import { htmlToMarkdownFile } from "./render-markdown.ts";

/** A tool handler. The handler takes the raw arguments of a call and returns the JSON text of the result. */
export type ToolHandler = (raw: unknown) => Promise<string>;

/** The MCP result of a tool call. Its content holds the text of the result, and isError is true when the call fails. */
export interface ToolResult {
  [x: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

/**
 * Runs the handler of the named tool, and returns the MCP result.
 * An unknown name gives an error result. A handler that throws also gives an error result.
 * The text of an error result is a JSON object with status set to error.
 */
export async function dispatchTool(
  handlers: Record<string, ToolHandler>,
  name: string,
  args: unknown,
): Promise<ToolResult> {
  if (!Object.hasOwn(handlers, name)) {
    return { content: [{ type: "text", text: JSON.stringify({ status: "error", error: `unknown tool '${name}'` }) }], isError: true };
  }
  try {
    const text = await handlers[name](args ?? {});
    return { content: [{ type: "text", text }] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`scieng-mcp: handler '${name}' threw: ${msg}\n`);
    return { content: [{ type: "text", text: JSON.stringify(errorBody(err, msg)) }], isError: true };
  }
}

/** The fields that an engine error gives: its code, and its line and column when the engine has them. */
interface EngineFailure {
  code: string;
  line?: number;
  column?: number;
}

/**
 * Reads an error of the sciengjs engine.
 * The check matches the name and the code, not the class. A bundle can hold a second copy of the engine's errors module.
 */
function engineFailure(err: unknown): EngineFailure | undefined {
  if (!(err instanceof Error) || err.name !== "RenderError") return undefined;
  const { code, line, column } = err as Error & { code?: unknown; line?: unknown; column?: unknown };
  if (typeof code !== "string" || !(RENDER_ERROR_CODES as readonly string[]).includes(code)) return undefined;
  return {
    code,
    line: typeof line === "number" ? line : undefined,
    column: typeof column === "number" ? column : undefined,
  };
}

/**
 * The JSON body of a failed tool call. An engine error adds its code, and its line and column when it has them.
 * An internal failure of the engine names the engine, so that the client can tell it from a bad request.
 */
function errorBody(err: unknown, msg: string): Record<string, unknown> {
  const failure = engineFailure(err);
  if (!failure) return { status: "error", error: msg };
  const label = failure.code === "E_INTERNAL" ? "sciengjs engine: " : "";
  return { status: "error", error: `[${failure.code}] ${label}${msg}`, code: failure.code, line: failure.line, column: failure.column };
}

const SOURCE_DESC = "Inline source text. Provide exactly one of source / input_path.";
const INPUT_DESC = "Path to a source file. Provide exactly one of source / input_path.";
const OUTPUT_DESC = "Output file path. Required with inline source; defaults to the input path with the extension swapped when input_path is used.";

const renderIo = {
  source: { type: "string" as const, description: SOURCE_DESC },
  input_path: { type: "string" as const, description: INPUT_DESC },
  output_path: { type: "string" as const, description: OUTPUT_DESC },
};
/** The seven MCP tools. Each entry holds the name, the description, the annotations and the input schema. */
export const TOOLS: Tool[] = [
  {
    name: "render_mermaid",
    description: "Render Mermaid diagram source to an SVG, PNG or PDF file locally, through the sciengjs engine. format is svg (default), png or pdf. Class, state and sequence diagrams need no browser; other types need SCIENG_BROWSER. Returns {path, bytes, warnings}.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { ...renderIo, format: { type: "string", enum: [...MERMAID_FORMATS], description: "Output format (default svg)." } },
      additionalProperties: false,
    },
  },
  {
    name: "render",
    description: "Render any input type that the local sciengjs engine supports to a file. type and format name the pair. options holds the keys of that type, and the engine checks them. STEP, IGES and BREP are binary: give input_path, not source. Returns {path, bytes, mime, backend, warnings}. An engine error returns its code.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        ...renderIo,
        type: { type: "string", enum: [...INPUT_TYPES], description: "Input type of the source." },
        format: { type: "string", enum: [...OUTPUT_FORMATS], description: "Output format." },
        options: { type: "object", description: "Per-type options, passed to the engine unchanged.", additionalProperties: true },
      },
      required: ["type", "format"],
      additionalProperties: false,
    },
  },
  {
    name: "render_dot",
    description: "Render Graphviz DOT source to an SVG or PNG file locally, through the sciengjs engine. format is svg (default) or png. Returns {path, bytes, warnings}.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { ...renderIo, format: { type: "string", enum: ["svg", "png"], description: "Output format (default svg)." } },
      additionalProperties: false,
    },
  },
  {
    name: "capabilities",
    description: "Report each input and output pair of the local engine, its stage, and whether that stage is ready on this machine. Returns {capabilities}.",
    annotations: { readOnlyHint: true, destructiveHint: false },
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "render_latex",
    description: "Render LaTeX (bare math or a full document's equation/align/display blocks) to an SVG, PNG or PDF file locally, through the sciengjs engine. format is svg (default), png or pdf; a png or pdf takes one block. For png or pdf, an output_path that ends in .svg gets the .png or .pdf extension; any other extension is kept. Partial failures are reported in a failures array, not thrown. Returns {path, bytes, failures, warnings}.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        ...renderIo,
        format: { type: "string", enum: [...LATEX_FORMATS], description: "Output format (default svg)." },
        scale: { type: "number", description: "Scale of the render. Applies to png only; svg and pdf ignore it with a warning." },
        dpi: { type: "number", description: "Deprecated alias of scale: for png with no scale, scale is dpi/100. svg and pdf ignore it with a warning." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "render_html",
    description: "Build a self-contained HTML playground from typed blocks (mermaid | dot | latex | plotly | wavedrom | raw-html). The page has only the CDN imports that the present block types need (pins per the scieng skill's RENDERERS.md). plotly source must be JSON {data, layout}; raw-html passes through verbatim, inside a div: the tool does not support an unbalanced or table-only fragment. Each block source occurs two times: in the rendered element and in its data-scieng-source attribute. Returns {path, bytes}. Open the result with `start <path>`.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        blocks: {
          type: "array", minItems: 1,
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["mermaid", "dot", "latex", "plotly", "wavedrom", "raw-html"] },
              source: { type: "string" },
              title: { type: "string", description: "Optional section heading." },
              static: { type: "boolean", description: "plotly only: draw the figure through the engine as inline SVG, with no Plotly script for this block." },
            },
            required: ["type", "source"],
            additionalProperties: false,
          },
        },
        title: { type: "string", description: "Page title (default 'scieng playground')." },
        output_path: { type: "string", description: "Output .html path (required)." },
      },
      required: ["blocks", "output_path"],
      additionalProperties: false,
    },
  },
  {
    name: "html_to_markdown",
    description: "Convert HTML to GitHub Flavored Markdown locally, through the sciengjs engine. Give exactly one of html (text) or input_path (an .html file). output_path is the .md file: it must end in .md, and an existing output_path is refused with E_INPUT. Each asset of the page is written into the folder of output_path under its asset name; an existing file is never overwritten (a new asset name gets -2, -3, and the image links follow it). A failure removes the files that the call created. download_images fetches remote images only when the engine config allows images; browser uses a headless browser. Returns {path, bytes, assets, warnings}. An engine error returns its code.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        html: { type: "string", description: "Inline HTML text. Provide exactly one of html / input_path." },
        input_path: { type: "string", description: "Path to an .html file. Provide exactly one of html / input_path." },
        output_path: { type: "string", description: "Output .md path (required). It must not exist." },
        download_images: { type: "boolean", description: "Fetch remote images (default false)." },
        browser: { type: "boolean", description: "Use a headless browser for the conversion (default false)." },
      },
      required: ["output_path"],
      additionalProperties: false,
    },
  },
  {
    name: "ooxml_replace",
    description: "Run-preserving batch find/replace on an UNPACKED Word document's word/document.xml (formatting <w:rPr> untouched). Replaces the matched text in the FIRST matching run per pair. Find and replace are plain text. An empty find is refused. A match does not cross a w:br, w:tab or w:cr element. A rewritten w:t element is re-encoded; other elements keep their bytes. For one-off edits prefer editing the XML directly; unpack/pack with the document-skills:docx scripts. Returns per-pair results and replaced_count.",
    annotations: { readOnlyHint: false, destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        document_xml_path: { type: "string", description: "Path to the unpacked word/document.xml." },
        replacements: {
          type: "array", minItems: 1,
          items: {
            type: "object",
            properties: { find: { type: "string" }, replace: { type: "string" } },
            required: ["find", "replace"],
            additionalProperties: false,
          },
        },
        preserve_space: { type: "boolean", description: "Add xml:space='preserve' to edited runs (default true)." },
      },
      required: ["document_xml_path", "replacements"],
      additionalProperties: false,
    },
  },
];

const RenderArgs = z.object({
  source: z.string().optional(),
  input_path: z.string().optional(),
  output_path: z.string().optional(),
}).strict();

const DotFormat = z.enum(["svg", "png"]);
const MermaidFormat = z.enum(MERMAID_FORMATS);
const RenderAnyExtra = {
  type: z.enum(INPUT_TYPES),
  format: z.enum(OUTPUT_FORMATS),
  options: z.record(z.string(), z.unknown()).optional(),
};

function resolveRenderIo<T extends z.ZodRawShape = Record<string, never>>(raw: unknown, extra?: T, ext = ".svg"): { code: string; out: string; args: Record<string, unknown> } {
  const schema = extra ? RenderArgs.extend(extra).strict() : RenderArgs;
  const a = schema.parse(raw ?? {});
  if (!!a.source === !!a.input_path) throw new Error("provide exactly one of source or input_path");
  if (a.source !== undefined) {
    if (!a.output_path) throw new Error("output_path is required when source is inline");
    return { code: a.source, out: a.output_path, args: a };
  }
  return { code: readInput(a.input_path!), out: a.output_path ?? deriveOutputPath(a.input_path!, ext), args: a };
}

const result = (path: string, content: string, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ path, bytes: Buffer.byteLength(content, "utf-8"), ...extra });

const NoArgs = z.object({}).strict();

const HtmlArgs = z.object({
  blocks: z.array(z.object({
    type: z.enum(["mermaid", "dot", "latex", "plotly", "wavedrom", "raw-html"]),
    source: z.string(),
    title: z.string().optional(),
    static: z.boolean().optional(),
  }).strict()).min(1),
  title: z.string().optional(),
  output_path: z.string(),
}).strict();

const HtmlToMarkdownArgs = z.object({
  html: z.string().optional(),
  input_path: z.string().optional(),
  output_path: z.string(),
  download_images: z.boolean().optional(),
  browser: z.boolean().optional(),
}).strict();

const OoxmlArgs = z.object({
  document_xml_path: z.string(),
  replacements: z.array(z.object({ find: z.string(), replace: z.string() }).strict()).min(1),
  preserve_space: z.boolean().optional(),
}).strict();

/**
 * Resolves the scale of a LaTeX render from scale and the deprecated dpi alias.
 * For png, scale wins; with no scale, scale is dpi/100. For svg and pdf, both values are ignored with a warning.
 */
function latexScale(format: string, scale: number | undefined, dpi: number | undefined): { scale: number | undefined; warnings: string[] } {
  const warnings: string[] = [];
  if (format !== "png") {
    if (dpi !== undefined) warnings.push(`dpi is deprecated and applies to png only; ignored for ${format}`);
    if (scale !== undefined) warnings.push(`scale applies to png only; ignored for ${format}`);
    return { scale: undefined, warnings };
  }
  if (dpi === undefined) return { scale, warnings };
  if (scale !== undefined) {
    warnings.push("dpi is deprecated; ignored because scale is set");
    return { scale, warnings };
  }
  warnings.push(`dpi is deprecated; use scale (dpi ${dpi} gives scale ${dpi / 100})`);
  return { scale: dpi / 100, warnings };
}

/**
 * The handler of a tool that renders diagram source to one file: `render_mermaid` and `render_dot`.
 * The format defaults to `svg`. The result is `{path, bytes, warnings}`.
 */
function sourceRenderHandler<F extends string>(
  formats: z.ZodType<F>,
  render: (code: string, out: string, format: F) => Promise<{ bytes: number; warnings: string[] }>,
): ToolHandler {
  return async (raw) => {
    const format = formats.parse((raw as { format?: unknown } | undefined)?.format ?? "svg");
    const { code, out } = resolveRenderIo(raw, { format: formats.optional() }, `.${format}`);
    const res = await render(code, out, format);
    return JSON.stringify({ path: out, bytes: res.bytes, warnings: res.warnings });
  };
}

/**
 * Creates the handler of each tool, keyed by the tool name.
 */
export function makeHandlers(): Record<string, ToolHandler> {
  return {
    render_mermaid: sourceRenderHandler(MermaidFormat, renderMermaidSource),
    render: async (raw) => {
      const pre = z.object({ format: z.enum(OUTPUT_FORMATS), type: z.enum(INPUT_TYPES) }).passthrough().parse(raw ?? {});
      const format = pre.format;
      const options = (raw as { options?: Record<string, unknown> }).options;
      if ((BINARY_INPUT_TYPES as readonly string[]).includes(pre.type)) {
        // A CAD file is bytes. It comes from input_path only, and the engine limit is the cap.
        const a = RenderArgs.extend(RenderAnyExtra).strict().parse(raw ?? {});
        if (a.source !== undefined || a.input_path === undefined) throw new Error(`${pre.type} is a binary input type: give input_path, not source`);
        const { maxSourceBytes } = await loadConfig(engineConfig());
        const out = a.output_path ?? deriveOutputPath(a.input_path, `.${format}`);
        return JSON.stringify(await renderAny(pre.type, format, readInputBytes(a.input_path, maxSourceBytes), out, options));
      }
      const { code, out } = resolveRenderIo(raw, RenderAnyExtra, `.${format}`);
      return JSON.stringify(await renderAny(pre.type, format, code, out, options));
    },
    render_dot: sourceRenderHandler(DotFormat, renderDotSource),
    capabilities: async (raw) => {
      NoArgs.parse(raw ?? {});
      return JSON.stringify({ capabilities: await engineCapabilities(engineConfig()) });
    },
    render_latex: async (raw) => {
      const { code, out, args } = resolveRenderIo(raw, { format: z.enum(LATEX_FORMATS).optional(), scale: z.number().optional(), dpi: z.number().optional() }, ".svg");
      const format = (args.format as (typeof LATEX_FORMATS)[number] | undefined) ?? "svg";
      const outPath = format === "svg" ? out : out.replace(/\.svg$/i, `.${format}`);
      const { scale, warnings } = latexScale(format, args.scale as number | undefined, args.dpi as number | undefined);
      const { bytes, failures } = await renderLatexSource(code, outPath, scale === undefined ? { format } : { format, scale });
      return JSON.stringify({ path: outPath, bytes, failures, warnings });
    },
    render_html: async (raw) => {
      const a = HtmlArgs.parse(raw ?? {});
      const blocks = await resolveStaticBlocks(a.blocks as HtmlBlock[], renderPlotSvg);
      const html = buildHtml(blocks, a.title);
      writeOutput(a.output_path, html);
      return result(a.output_path, html);
    },
    html_to_markdown: async (raw) => {
      const a = HtmlToMarkdownArgs.parse(raw ?? {});
      return JSON.stringify(await htmlToMarkdownFile(a));
    },
    ooxml_replace: async (raw) => {
      const a = OoxmlArgs.parse(raw ?? {});
      return JSON.stringify(applyEdits(a.document_xml_path, a.replacements, a.preserve_space ?? true));
    },
  };
}
