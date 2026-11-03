import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";

/** The type of a fetch function. The render modules accept a fetch function to replace the global fetch. */
export type FetchLike = typeof fetch;

/** The options of httpText. The defaults are the GET method, a 20000 ms timeout and three retries. */
export interface HttpOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: FetchLike;
}

const TRANSIENT = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Sends an HTTP request and returns the response text.
 * The call retries a network error, and the statuses 429, 500, 502, 503 and 504. The wait doubles after each attempt. For a retried status, a valid Retry-After header sets the wait.
 * Any other error status throws at once. The message holds the host and the first 500 characters of the body.
 */
export async function httpText(url: string, opts: HttpOptions = {}): Promise<string> {
  const { method = "GET", body, headers = {}, timeoutMs = 20000, retries = 3, fetchImpl = fetch } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetchImpl(url, { method, body, headers, signal: ac.signal, redirect: "follow" });
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt === retries) break;
      await sleep(2 ** attempt * 500);
      continue;
    }
    const text = await res.text();
    clearTimeout(timer);
    if (res.ok) return text;
    // Non-2xx: fail fast on non-transient statuses (no retry); only retry transient ones.
    if (!TRANSIENT.has(res.status) || attempt === retries) {
      throw new Error(`HTTP ${res.status} from ${new URL(url).host}: ${text.slice(0, 500)}`);
    }
    const raHeader = res.headers.get("retry-after");
    const ra = raHeader === null ? NaN : Number(raHeader);
    await sleep(Number.isFinite(ra) && ra >= 0 ? ra * 1000 : 2 ** attempt * 500);
  }
  throw lastErr instanceof Error ? lastErr : new Error(`request failed: ${url}`);
}

/** Reads a file as UTF-8 text. The call throws when the file is larger than maxBytes, which defaults to 524288 bytes. */
export function readInput(path: string, maxBytes = 512 * 1024): string {
  const buf = readFileSync(path);
  if (buf.byteLength > maxBytes) {
    throw new Error(`input too large: ${buf.byteLength} bytes (max ${maxBytes})`);
  }
  return buf.toString("utf-8");
}

/** Returns the input path with its extension replaced by ext, in the same folder. The default ext is .svg. */
export function deriveOutputPath(input: string, ext = ".svg"): string {
  return join(dirname(input), basename(input, extname(input)) + ext);
}

/**
 * The function writes content to path in two steps. The first step writes a temporary file named path plus .tmp.
 * The second step renames the temporary file to path.
 * The rename replaces an existing file.
 */
export function writeOutput(path: string, content: string | Uint8Array): void {
  const tmp = path + ".tmp";
  writeFileSync(tmp, content, "utf-8");
  renameSync(tmp, path);
}

/**
 * Calls fn for each item, with at most limit calls at once. The results keep the order of the items.
 * When a call throws, the returned promise rejects with that error. The other items still run.
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
