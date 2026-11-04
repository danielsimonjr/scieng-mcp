import type { Tool } from "@modelcontextprotocol/server";
import { z } from "zod";
import { RENDER_ERROR_CODES, INPUT_TYPES, OUTPUT_FORMATS, capabilities as engineCapabilities } from "@danielsimonjr/sciengjs";
import { readInput, deriveOutputPath, writeOutput, type FetchLike } from "./render-lib.ts";
import { renderMermaidSource, MERMAID_FORMATS } from "./render-mermaid.ts";
import { renderAny } from "./render-any.ts";
import { renderDotSource } from "./render-dot.ts";
import { engineConfig } from "./engine-config.ts";
import { renderLatexSource } from "./render-latex.ts";
import { buildHtml, type HtmlBlock } from "./render-html.ts";
import { applyEdits } from "./ooxml-edit.ts";

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
    description: "Render any input type that the local sciengjs engine supports to a file. type and format name the pair. options holds the keys of that type, and the engine checks them. Returns {path, bytes, mime, backend, warnings}. An engine error returns its code.",
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
    description: "Render LaTeX (bare math or a full document's equation/align/display blocks) to an SVG file via latex.codecogs.com. Partial failures are reported in a failures array, not thrown. Returns {path, bytes, failures}.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { ...renderIo, dpi: { type: "number", description: "Render DPI (default 200)." } },
      additionalProperties: false,
    },
  },
  {
    name: "render_html",
    description: "Assemble a self-contained HTML playground from typed blocks (mermaid | dot | latex | plotly | wavedrom | raw-html). Emits only the CDN imports the present block types need (pins per the scieng skill's RENDERERS.md). plotly source must be JSON {data, layout}; raw-html passes through verbatim. Returns {path, bytes}. Open the result with `start <path>`.",
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
  }).strict()).min(1),
  title: z.string().optional(),
  output_path: z.string(),
}).strict();

const OoxmlArgs = z.object({
  document_xml_path: z.string(),
  replacements: z.array(z.object({ find: z.string(), replace: z.string() }).strict()).min(1),
  preserve_space: z.boolean().optional(),
}).strict();

/**
 * Creates the handler of each tool, keyed by the tool name.
 * The fetchImpl parameter replaces the global fetch for the two remote renderers, Mermaid and LaTeX.
 */
export function makeHandlers(fetchImpl: FetchLike = fetch): Record<string, ToolHandler> {
  return {
    render_mermaid: async (raw) => {
      const format = MermaidFormat.parse((raw as { format?: unknown } | undefined)?.format ?? "svg");
      const { code, out } = resolveRenderIo(raw, { format: MermaidFormat.optional() }, `.${format}`);
      const res = await renderMermaidSource(code, out, format);
      return JSON.stringify({ path: out, bytes: res.bytes, warnings: res.warnings });
    },
    render: async (raw) => {
      const pre = z.object({ format: z.enum(OUTPUT_FORMATS) }).passthrough().parse(raw ?? {});
      const { code, out, args } = resolveRenderIo(raw, RenderAnyExtra, `.${pre.format}`);
      const format = args.format as (typeof OUTPUT_FORMATS)[number];
      return JSON.stringify(await renderAny(args.type as (typeof INPUT_TYPES)[number], format, code, out, args.options as Record<string, unknown> | undefined));
    },
    render_dot: async (raw) => {
      const format = DotFormat.parse((raw as { format?: unknown } | undefined)?.format ?? "svg");
      const { code, out } = resolveRenderIo(raw, { format: DotFormat.optional() }, `.${format}`);
      const res = await renderDotSource(code, out, format);
      return JSON.stringify({ path: out, bytes: res.bytes, warnings: res.warnings });
    },
    capabilities: async (raw) => {
      NoArgs.parse(raw ?? {});
      return JSON.stringify({ capabilities: await engineCapabilities(engineConfig()) });
    },
    render_latex: async (raw) => {
      const { code, out, args } = resolveRenderIo(raw, { dpi: z.number().optional() });
      const { svg, failures } = await renderLatexSource(code, out, { dpi: args.dpi as number | undefined, fetchImpl });
      return result(out, svg, { failures });
    },
    render_html: async (raw) => {
      const a = HtmlArgs.parse(raw ?? {});
      const html = buildHtml(a.blocks as HtmlBlock[], a.title);
      writeOutput(a.output_path, html);
      return result(a.output_path, html);
    },
    ooxml_replace: async (raw) => {
      const a = OoxmlArgs.parse(raw ?? {});
      return JSON.stringify(applyEdits(a.document_xml_path, a.replacements, a.preserve_space ?? true));
    },
  };
}
