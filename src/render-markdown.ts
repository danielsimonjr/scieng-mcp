// Converts HTML to GitHub Flavored Markdown through the sciengjs engine, and writes the Markdown and its assets.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { render } from "@danielsimonjr/sciengjs";
import { readInput, writeOutput } from "./render-lib.ts";
import { engineConfig } from "./engine-config.ts";

/** The result of one conversion: the Markdown path, its byte count, the asset paths and the engine warnings. */
export interface MarkdownResult {
  path: string;
  bytes: number;
  assets: string[];
  warnings: string[];
}

/** Returns the path of an asset in the folder dir. Throws when the name holds a separator or "..". */
export function assetFilePath(dir: string, name: string): string {
  if (name === "") {
    throw new Error("asset name must not be empty");
  }
  if (name.includes("..")) {
    throw new Error('asset name must not contain ".."');
  }
  if (name.includes("/") || name.includes("\\")) {
    throw new Error("asset name must not contain path separators");
  }
  return join(dir, name);
}

/** Returns a path in dir that does not exist yet. A taken name gets -2, -3 and so on before the extension. */
export function uniquePath(dir: string, name: string): string {
  const first = join(dir, name);
  if (!existsSync(first)) return first;
  const ext = extname(name);
  const base = name.slice(0, name.length - ext.length);
  for (let i = 2; ; i++) {
    const candidate = join(dir, `${base}-${i}${ext}`);
    if (!existsSync(candidate)) return candidate;
  }
}

/** The arguments of the html_to_markdown tool, after the schema check. */
export interface HtmlToMarkdownArgs {
  html?: string;
  input_path?: string;
  output_path: string;
  download_images?: boolean;
  browser?: boolean;
}

/**
 * Converts HTML (inline or from a file) to Markdown at output_path.
 * The assets go into the folder of output_path. A name that is taken gets a new name, and the links of the
 * Markdown follow the new name.
 */
export async function htmlToMarkdownFile(a: HtmlToMarkdownArgs): Promise<MarkdownResult> {
  if (!!a.html === !!a.input_path) throw new Error("provide exactly one of html or input_path");
  const source = a.html !== undefined ? a.html : readInput(a.input_path!);
  const res = await render(
    {
      type: "html",
      format: "md",
      source,
      options: { downloadImages: a.download_images ?? false, browser: a.browser ?? false },
    },
    engineConfig(),
  );
  let markdown = new TextDecoder().decode(res.bytes);
  const dir = dirname(a.output_path);
  const assetPaths: string[] = [];
  if (res.assets && res.assets.length > 0) mkdirSync(dir, { recursive: true });
  for (const asset of res.assets ?? []) {
    assetFilePath(dir, asset.name);
    const target = uniquePath(dir, asset.name);
    const finalName = target.slice(dir.length + 1);
    if (finalName !== asset.name) {
      markdown = markdown.split(`(${asset.name})`).join(`(${finalName})`);
    }
    writeFileSync(target, asset.bytes);
    assetPaths.push(target);
  }
  writeOutput(a.output_path, markdown);
  return { path: a.output_path, bytes: Buffer.byteLength(markdown, "utf-8"), assets: assetPaths, warnings: res.warnings };
}
