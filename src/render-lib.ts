import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";

export type FetchLike = typeof fetch;

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

export function readInput(path: string, maxBytes = 512 * 1024): string {
  const buf = readFileSync(path);
  if (buf.byteLength > maxBytes) {
    throw new Error(`input too large: ${buf.byteLength} bytes (max ${maxBytes})`);
  }
  return buf.toString("utf-8");
}

export function deriveOutputPath(input: string, ext = ".svg"): string {
  return join(dirname(input), basename(input, extname(input)) + ext);
}

export function writeOutput(path: string, content: string): void {
  const tmp = path + ".tmp";
  writeFileSync(tmp, content, "utf-8");
  renameSync(tmp, path);
}

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
