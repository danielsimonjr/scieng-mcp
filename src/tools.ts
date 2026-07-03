import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readInput, deriveOutputPath, writeOutput, type FetchLike } from "./render-lib.ts";
import { renderMermaidSource } from "./render-mermaid.ts";
import { renderDotSource } from "./render-dot.ts";
import { renderLatexSource } from "./render-latex.ts";
import { buildHtml, type HtmlBlock } from "./render-html.ts";
import { applyEdits } from "./ooxml-edit.ts";

export type ToolHandler = (raw: unknown) => Promise<string>;

export interface ToolResult {
  [x: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

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
    return { content: [{ type: "text", text: JSON.stringify({ status: "error", error: msg }) }], isError: true };
  }
}

const SOURCE_DESC = "Inline source text. Provide exactly one of source / input_path.";
const INPUT_DESC = "Path to a source file. Provide exactly one of source / input_path.";
const OUTPUT_DESC = "Output file path. Required with inline source; defaults to the input path with the extension swapped when input_path is used.";

const renderIo = {
  source: { type: "string" as const, description: SOURCE_DESC },
  input_path: { type: "string" as const, description: INPUT_DESC },
  output_path: { type: "string" as const, description: OUTPUT_DESC },
};

export const TOOLS: Tool[] = [
  {
    name: "render_mermaid",
    description: "Render Mermaid diagram source to an SVG file via mermaid.ink. Returns {path, bytes}; never the SVG body.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: { type: "object", properties: renderIo, additionalProperties: false },
  },
  {
    name: "render_dot",
    description: "Render Graphviz DOT source to an SVG file via quickchart.io/graphviz. Returns {path, bytes}.",
    annotations: { readOnlyHint: false, destructiveHint: false },
    inputSchema: { type: "object", properties: renderIo, additionalProperties: false },
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
    description: "Run-preserving batch find/replace on an UNPACKED Word document's word/document.xml (formatting <w:rPr> untouched). Replaces the FIRST matching run per pair. For one-off edits prefer editing the XML directly; unpack/pack with the document-skills:docx scripts. Returns per-pair results and replaced_count.",
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

function resolveRenderIo<T extends z.ZodRawShape = Record<string, never>>(raw: unknown, extra?: T): { code: string; out: string; args: Record<string, unknown> } {
  const schema = extra ? RenderArgs.extend(extra) : RenderArgs;
  const a = schema.parse(raw ?? {});
  if (!!a.source === !!a.input_path) throw new Error("provide exactly one of source or input_path");
  if (a.source !== undefined) {
    if (!a.output_path) throw new Error("output_path is required when source is inline");
    return { code: a.source, out: a.output_path, args: a };
  }
  return { code: readInput(a.input_path!), out: a.output_path ?? deriveOutputPath(a.input_path!), args: a };
}

const result = (path: string, content: string, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ path, bytes: Buffer.byteLength(content, "utf-8"), ...extra });

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

export function makeHandlers(fetchImpl: FetchLike = fetch): Record<string, ToolHandler> {
  return {
    render_mermaid: async (raw) => {
      const { code, out } = resolveRenderIo(raw);
      return result(out, await renderMermaidSource(code, out, fetchImpl));
    },
    render_dot: async (raw) => {
      const { code, out } = resolveRenderIo(raw);
      return result(out, await renderDotSource(code, out, fetchImpl));
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
