import { readFileSync, writeFileSync, renameSync, statSync, mkdirSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join, basename, extname } from "node:path";

/** The type of a fetch function. The render modules accept a fetch function to replace the global fetch. */
export type FetchLike = typeof fetch;

/** The options of httpText. The defaults are the GET method, a 20000 ms timeout, three retries and a 30 s Retry-After cap. */
export interface HttpOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  maxRetryAfterMs?: number;
  fetchImpl?: FetchLike;
}

/** The longest wait that a Retry-After header can set, in milliseconds. A caller overrides it with maxRetryAfterMs. */
export const RETRY_AFTER_CAP_MS = 30000;

const TRANSIENT = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** The wait in milliseconds that a Retry-After value names: seconds, or an HTTP date. Returns null when the value is not usable. */
function parseRetryAfterMs(raw: string): number | null {
  const value = raw.trim();
  if (value === "") return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : at - Date.now();
}

/**
 * Sends an HTTP request and returns the response text.
 * The call retries a network error, a failed body read, and the statuses 429, 500, 502, 503 and 504. The wait doubles after each attempt. For a retried status, a valid Retry-After header (seconds or an HTTP date) sets the wait, capped at maxRetryAfterMs.
 * Any other error status throws at once. The message holds the host and the first 500 characters of the body.
 */
export async function httpText(url: string, opts: HttpOptions = {}): Promise<string> {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = 20000,
    retries = 3,
    maxRetryAfterMs = RETRY_AFTER_CAP_MS,
    fetchImpl = fetch,
  } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    let res: Response;
    let text: string;
    try {
      res = await fetchImpl(url, { method, body, headers, signal: ac.signal, redirect: "follow" });
      text = await res.text();
    } catch (e) {
      // A network error and a failed body read are both retried.
      clearTimeout(timer);
      lastErr = e;
      if (attempt === retries) break;
      await sleep(2 ** attempt * 500);
      continue;
    }
    clearTimeout(timer);
    if (res.ok) return text;
    // Non-2xx: fail fast on non-transient statuses (no retry); only retry transient ones.
    if (!TRANSIENT.has(res.status) || attempt === retries) {
      throw new Error(`HTTP ${res.status} from ${new URL(url).host}: ${text.slice(0, 500)}`);
    }
    const raHeader = res.headers.get("retry-after");
    const parsedMs = raHeader === null ? null : parseRetryAfterMs(raHeader);
    const waitMs = parsedMs !== null && parsedMs >= 0
      ? Math.min(parsedMs, maxRetryAfterMs)
      : 2 ** attempt * 500;
    await sleep(waitMs);
  }
  throw lastErr instanceof Error ? lastErr : new Error(`request failed: ${url}`);
}

/** Reads a file as UTF-8 text. The call throws when the file is larger than maxBytes, which defaults to 524288 bytes. */
export function readInput(path: string, maxBytes = 512 * 1024): string {
  const size = statSync(path).size;
  if (size > maxBytes) {
    throw new Error(`input too large: ${size} bytes (max ${maxBytes})`);
  }
  return readFileSync(path).toString("utf-8");
}

/** Returns the input path with its extension replaced by ext, in the same folder. The default ext is .svg. */
export function deriveOutputPath(input: string, ext = ".svg"): string {
  return join(dirname(input), basename(input, extname(input)) + ext);
}

/**
 * The function writes content to path in two steps. The first step writes a new temporary file with a unique name in the folder of path.
 * The second step renames the temporary file to path.
 * The rename replaces an existing file at path. The function never writes to any other existing file.
 * When a step fails, the function removes the temporary file and throws the error.
 */
export function writeOutput(path: string, content: string | Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    writeFileSync(tmp, content, { encoding: "utf-8", flag: "wx" });
    renameSync(tmp, path);
  } catch (error) {
    rmSync(tmp, { force: true });
    throw error;
  }
}

/**
 * Calls fn for each item, with at most limit calls at once. The results keep the order of the items.
 * Every item runs, even when another item throws. When one or more calls throw, the returned promise rejects with an AggregateError that holds each error, in input order.
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const failures: { index: number; error: unknown }[] = [];
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i], i);
      } catch (error) {
        failures.push({ index: i, error });
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  if (failures.length > 0) {
    failures.sort((a, b) => a.index - b.index);
    throw new AggregateError(
      failures.map((f) => f.error),
      `${failures.length} of ${items.length} items failed`,
    );
  }
  return results;
}
