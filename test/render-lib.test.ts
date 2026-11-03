import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { httpText, readInput, writeOutput, deriveOutputPath, mapLimit } from "../src/render-lib.ts";
import { createRequire, syncBuiltinESMExports } from "node:module";

const cjsFs = createRequire(import.meta.url)("node:fs") as typeof import("node:fs");

test("readInput rejects an oversize file without reading its content (F23)", () => {
  const dir = mkdtempSync(join(tmpdir(), "readinput-"));
  const f = join(dir, "big.txt");
  writeFileSync(f, "x".repeat(600 * 1024));
  const realRead = cjsFs.readFileSync;
  let reads = 0;
  cjsFs.readFileSync = ((...args: Parameters<typeof realRead>) => { reads++; return realRead(...args); }) as typeof realRead;
  syncBuiltinESMExports();
  try {
    assert.throws(() => readInput(f), /too large/);
  } finally {
    cjsFs.readFileSync = realRead;
    syncBuiltinESMExports();
  }
  assert.equal(reads, 0);
});

test("deriveOutputPath swaps extension, basename-only dir of input", () => {
  assert.equal(deriveOutputPath(join("a", "b", "d.dot")), join("a", "b", "d.svg"));
});

test("readInput enforces size cap", () => {
  const dir = mkdtempSync(join(tmpdir(), "scieng-"));
  const f = join(dir, "big.txt");
  writeFileSync(f, "x".repeat(100));
  assert.throws(() => readInput(f, 10), /too large/);
  assert.equal(readInput(f, 1000).length, 100);
});

test("writeOutput is atomic (no .tmp left behind)", () => {
  const dir = mkdtempSync(join(tmpdir(), "scieng-"));
  const f = join(dir, "o.svg");
  writeOutput(f, "<svg/>");
  assert.equal(readFileSync(f, "utf-8"), "<svg/>");
  assert.throws(() => readFileSync(f + ".tmp", "utf-8"));
});

test("writeOutput writes bytes exactly", () => {
  const dir = mkdtempSync(join(tmpdir(), "scieng-"));
  const f = join(dir, "o.png");
  const bytes = new Uint8Array([137, 80, 78, 71, 0, 1, 2]);
  writeOutput(f, bytes);
  assert.deepEqual([...readFileSync(f)], [...bytes]);
});

test("httpText returns body on 200", async () => {
  const fake: typeof fetch = async () => new Response("<svg>ok</svg>", { status: 200 });
  assert.equal(await httpText("https://x", { fetchImpl: fake }), "<svg>ok</svg>");
});

test("httpText fails fast on 4xx (no retry)", async () => {
  let calls = 0;
  const fake: typeof fetch = async () => { calls++; return new Response("bad", { status: 400 }); };
  await assert.rejects(() => httpText("https://x", { fetchImpl: fake, retries: 3 }), /HTTP 400 from x: bad/);
  assert.equal(calls, 1);
});

test("httpText error message names the service (host)", async () => {
  const fake: typeof fetch = async () => new Response("nope", { status: 404 });
  await assert.rejects(
    () => httpText("https://codecogs.example.com/render", { fetchImpl: fake, retries: 0 }),
    /HTTP 404 from codecogs\.example\.com: nope/,
  );
});

test("httpText retries transient 503 then succeeds", async () => {
  let calls = 0;
  const fake: typeof fetch = async () => {
    calls++;
    return calls < 2 ? new Response("busy", { status: 503, headers: { "retry-after": "0" } })
                     : new Response("<svg>ok</svg>", { status: 200 });
  };
  assert.equal(await httpText("https://x", { fetchImpl: fake, retries: 3 }), "<svg>ok</svg>");
  assert.equal(calls, 2);
});

test("httpText backs off (not 0ms) when Retry-After header is absent", async () => {
  let calls = 0;
  const callTimes: number[] = [];
  const fake: typeof fetch = async () => {
    callTimes.push(Date.now());
    calls++;
    // 503 with NO retry-after header at all (not even "0") — this is the
    // path that used to compute Number(null) === 0 and retry instantly.
    return calls < 2 ? new Response("busy", { status: 503 })
                     : new Response("<svg>ok</svg>", { status: 200 });
  };
  const result = await httpText("https://x", { fetchImpl: fake, retries: 3 });
  assert.equal(result, "<svg>ok</svg>");
  assert.equal(calls, 2);
  // Exponential backoff for the first retry (attempt 0) is 2**0 * 500 = 500ms.
  // Allow generous slack for scheduler jitter but assert it's clearly not ~0ms.
  const gap = callTimes[1] - callTimes[0];
  assert.ok(gap >= 400, `expected backoff delay >= 400ms, got ${gap}ms`);
});

test("mapLimit preserves order and caps concurrency", async () => {
  let active = 0, maxActive = 0;
  const fn = async (n: number) => {
    active++; maxActive = Math.max(maxActive, active);
    await new Promise(r => setTimeout(r, 5));
    active--; return n * 2;
  };
  const out = await mapLimit([1, 2, 3, 4, 5], 2, fn);
  assert.deepEqual(out, [2, 4, 6, 8, 10]);
  assert.ok(maxActive <= 2);
});

test("httpText retries a body-read failure like a network error (F6)", async () => {
  let calls = 0;
  const fake: typeof fetch = async () => {
    calls++;
    const res = new Response("<svg>ok</svg>", { status: 200 });
    if (calls === 1) res.text = async () => { throw new Error("socket reset"); };
    return res;
  };
  assert.equal(await httpText("https://x", { fetchImpl: fake, retries: 3 }), "<svg>ok</svg>");
  assert.equal(calls, 2);
});

test("httpText exposes a default Retry-After cap of 30 s (N6)", async () => {
  const lib = (await import("../src/render-lib.ts")) as Record<string, unknown>;
  assert.equal(lib.RETRY_AFTER_CAP_MS, 30000);
});

test("httpText caps a date-form Retry-After and honours maxRetryAfterMs (N6)", async () => {
  let calls = 0;
  const callTimes: number[] = [];
  const future = new Date(Date.now() + 3600_000).toUTCString();
  const fake: typeof fetch = async () => {
    callTimes.push(Date.now());
    calls++;
    return calls < 2 ? new Response("busy", { status: 503, headers: { "retry-after": future } })
                     : new Response("<svg>ok</svg>", { status: 200 });
  };
  await httpText("https://x", { fetchImpl: fake, retries: 3, maxRetryAfterMs: 200 });
  const gap = callTimes[1] - callTimes[0];
  assert.ok(gap >= 150 && gap < 400, `expected capped wait near 200ms, got ${gap}ms`);
});

test("mapLimit runs every item and reports each failure (F31)", async () => {
  const ran: number[] = [];
  const fn = async (n: number) => {
    ran.push(n);
    if (n === 1 || n === 3) throw new Error(`bad ${n}`);
    return n;
  };
  await assert.rejects(
    () => mapLimit([1, 2, 3, 4], 1, fn),
    (err: unknown) => {
      assert.ok(err instanceof AggregateError, "expected an AggregateError");
      assert.deepEqual(ran.sort(), [1, 2, 3, 4]);
      assert.equal((err as AggregateError).errors.length, 2);
      return true;
    },
  );
});
