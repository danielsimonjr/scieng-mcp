import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { httpText, readInput, writeOutput, deriveOutputPath, mapLimit } from "../src/render-lib.ts";

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

test("httpText returns body on 200", async () => {
  const fake: typeof fetch = async () => new Response("<svg>ok</svg>", { status: 200 });
  assert.equal(await httpText("https://x", { fetchImpl: fake }), "<svg>ok</svg>");
});

test("httpText fails fast on 4xx (no retry)", async () => {
  let calls = 0;
  const fake: typeof fetch = async () => { calls++; return new Response("bad", { status: 400 }); };
  await assert.rejects(() => httpText("https://x", { fetchImpl: fake, retries: 3 }), /HTTP 400/);
  assert.equal(calls, 1);
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
