// Converts HTML to GitHub Flavored Markdown through the sciengjs engine, and writes the Markdown and its assets.
import { existsSync, linkSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, extname, isAbsolute, join } from "node:path";
import { render, RenderError } from "@danielsimonjr/sciengjs";
import { readInput } from "./render-lib.ts";
import { engineConfig } from "./engine-config.ts";

/** The result of one conversion: the Markdown path, its byte count, the asset paths and the engine warnings. */
export interface MarkdownResult {
  path: string;
  bytes: number;
  assets: string[];
  warnings: string[];
}

/** A Windows device name. The name is reserved with any extension and in any letter case. */
const DEVICE_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

/**
 * Returns the path of an asset in the folder dir. Throws when the name is empty, holds a separator, "..", ":" or NUL,
 * is a Windows device name, ends in a dot or a space, or is absolute.
 */
export function assetFilePath(dir: string, name: string): string {
  if (name === "") throw new Error("asset name must not be empty");
  if (name.includes("..")) throw new Error('asset name must not contain ".."');
  if (name.includes("/") || name.includes("\\")) throw new Error("asset name must not contain path separators");
  if (name.includes(":") || name.includes("\0")) throw new Error('asset name must not contain ":" or NUL');
  if (DEVICE_NAME.test(name)) throw new Error(`asset name must not be a device name: ${name}`);
  if (/[. ]$/.test(name)) throw new Error("asset name must not end in a dot or a space");
  if (isAbsolute(name)) throw new Error("asset name must not be an absolute path");
  return join(dir, name);
}

/** The name with -n before the extension. n = 1 gives the name itself. */
function numbered(name: string, n: number): string {
  if (n === 1) return name;
  const ext = extname(name);
  return `${name.slice(0, name.length - ext.length)}-${n}${ext}`;
}

/** Returns a path in dir that does not exist yet. A taken name gets -2, -3 and so on before the extension. */
export function uniquePath(dir: string, name: string): string {
  for (let i = 1; ; i++) {
    const candidate = join(dir, numbered(name, i));
    if (!existsSync(candidate)) return candidate;
  }
}

/** The end of a code span that opens with a run of n backticks at i, or -1 when no run of the same length closes it. */
function codeSpanEnd(md: string, i: number, n: number): number {
  let j = i + n;
  while (j < md.length) {
    const k = md.indexOf("`", j);
    if (k < 0) return -1;
    let e = k;
    while (md[e] === "`") e++;
    if (e - k === n) return e;
    j = e;
  }
  return -1;
}

/** Rewrites the image links of one text run that holds no fenced block. */
function rewriteRun(md: string, map: ReadonlyMap<string, string>): string {
  let out = "";
  let i = 0;
  while (i < md.length) {
    const c = md[i];
    if (c === "\\") {
      out += md.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (c === "`") {
      let e = i;
      while (md[e] === "`") e++;
      const end = codeSpanEnd(md, i, e - i);
      const stop = end < 0 ? e : end;
      out += md.slice(i, stop);
      i = stop;
      continue;
    }
    if (c === "!" && md[i + 1] === "[") {
      const link = /^!\[((?:\\.|[^\\\]])*)\]\(([ \t]*)(<(?:\\.|[^\\<>\n])*>|[^\s()<>]+)/.exec(md.slice(i));
      if (link) {
        const raw = link[3];
        const bracketed = raw.startsWith("<");
        const dest = bracketed ? raw.slice(1, -1) : raw;
        const next = map.get(dest);
        const after = md[i + link[0].length];
        if (next !== undefined && (after === ")" || after === " " || after === "\t" || after === "\n")) {
          out += `![${link[1]}](${link[2]}${bracketed ? `<${next}>` : next}`;
          i += link[0].length;
          continue;
        }
      }
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * Rewrites the destination of each image link whose destination equals a key of map. The link text, a code span,
 * a fenced block, a plain link and the prose keep their text.
 */
export function rewriteImageLinks(md: string, map: ReadonlyMap<string, string>): string {
  if (map.size === 0) return md;
  const lines = md.split("\n");
  const out: string[] = [];
  let run: string[] = [];
  let fence: { char: string; len: number } | undefined;
  const flush = (): void => {
    if (run.length > 0) out.push(rewriteRun(run.join("\n"), map));
    run = [];
  };
  for (const line of lines) {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      out.push(line);
      if (m && m[1][0] === fence.char && m[1].length >= fence.len && line.trim() === m[1]) fence = undefined;
    } else if (m) {
      flush();
      out.push(line);
      fence = { char: m[1][0], len: m[1].length };
    } else {
      run.push(line);
    }
  }
  flush();
  return out.join("\n");
}

/** The arguments of the html_to_markdown tool, after the schema check. */
export interface HtmlToMarkdownArgs {
  html?: string;
  input_path?: string;
  output_path: string;
  download_images?: boolean;
  browser?: boolean;
}

/** The file write of the conversion. A test replaces it to make a write fail. */
export interface MarkdownFs {
  writeFile: (path: string, data: Uint8Array | string, options: { flag: string }) => void;
}

const realFs: MarkdownFs = { writeFile: (p, d, o) => writeFileSync(p, d, o) };

const isExists = (e: unknown): boolean => (e as { code?: unknown }).code === "EEXIST";

/**
 * Converts HTML (inline or from a file) to Markdown at output_path, which must end in .md and must not exist.
 * The assets go into the folder of output_path. Each asset file is created new: a taken name gets -2, -3, and the
 * image links of the Markdown follow the new name. The Markdown goes to a temporary file first and then gets its
 * final name. A failure removes every file that the call created.
 */
export async function htmlToMarkdownFile(
  a: HtmlToMarkdownArgs,
  engine: typeof render = render,
  fs: MarkdownFs = realFs,
): Promise<MarkdownResult> {
  const hasHtml = typeof a.html === "string";
  if (hasHtml === (typeof a.input_path === "string")) throw new Error("provide exactly one of html or input_path");
  if (hasHtml && a.html === "") throw new Error("html is empty");
  if (extname(a.output_path).toLowerCase() !== ".md") {
    throw new RenderError("E_INPUT", `output_path must end in .md: ${a.output_path}`);
  }
  if (existsSync(a.output_path)) {
    throw new RenderError("E_INPUT", `output_path exists, and the tool does not overwrite it: ${a.output_path}`);
  }
  const source = hasHtml ? a.html! : readInput(a.input_path!);
  const res = await engine(
    {
      type: "html",
      format: "md",
      source,
      options: { downloadImages: a.download_images ?? false, browser: a.browser ?? false },
    },
    engineConfig(),
  );
  const dir = dirname(a.output_path);
  const assets = res.assets ?? [];
  for (const asset of assets) assetFilePath(dir, asset.name);
  const text = new TextDecoder().decode(res.bytes);
  mkdirSync(dir, { recursive: true });

  const created: string[] = [];
  const tmp = join(dir, `.${basename(a.output_path)}.${randomUUID()}.tmp`);
  const renames = new Map<string, string>();
  const taken = new Set<string>();
  // Plan each name first, so that the Markdown in the temporary file already names the planned files.
  const plan = assets.map((asset) => {
    let n = 1;
    while (taken.has(numbered(asset.name, n)) || existsSync(join(dir, numbered(asset.name, n)))) n++;
    taken.add(numbered(asset.name, n));
    return n;
  });
  const markdownFor = (): string => rewriteImageLinks(text, renames);
  try {
    assets.forEach((asset, i) => { if (plan[i] > 1) renames.set(asset.name, numbered(asset.name, plan[i])); });
    let markdown = markdownFor();
    fs.writeFile(tmp, markdown, { flag: "wx" });
    created.push(tmp);
    const assetPaths: string[] = [];
    let moved = false;
    assets.forEach((asset, i) => {
      let n = plan[i];
      for (;;) {
        const name = numbered(asset.name, n);
        const target = join(dir, name);
        try {
          fs.writeFile(target, asset.bytes, { flag: "wx" });
        } catch (e) {
          if (!isExists(e)) throw e;
          do n++; while (taken.has(numbered(asset.name, n)));
          continue;
        }
        created.push(target);
        assetPaths.push(target);
        if (n !== plan[i]) {
          taken.add(name);
          moved = true;
          if (n > 1) renames.set(asset.name, name);
        }
        return;
      }
    });
    if (moved) {
      markdown = markdownFor();
      fs.writeFile(tmp, markdown, { flag: "w" });
    }
    try {
      linkSync(tmp, a.output_path);
    } catch (e) {
      if (isExists(e)) throw new RenderError("E_INPUT", `output_path exists, and the tool does not overwrite it: ${a.output_path}`);
      throw e;
    }
    try { unlinkSync(tmp); } catch { /* the Markdown has its final name; a left temporary file does no harm */ }
    return { path: a.output_path, bytes: Buffer.byteLength(markdown, "utf-8"), assets: assetPaths, warnings: res.warnings };
  } catch (e) {
    for (const p of created) {
      try { unlinkSync(p); } catch { /* the file is already gone */ }
    }
    throw e;
  }
}
