// Checks the CDN URLs in the scieng skill references against the exact pins of render_html.
// A library that the code pins must use the same version in every skill reference.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SKILL_DIR = join(ROOT, "plugin", "skills", "scieng");
const CDN_URL = /https:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.plot\.ly)\/[^\s"'<>)`]+/g;

/** The library and version that a CDN URL names. The version is null when the URL names none. */
function libOf(url: string): { lib: string; version: string | null } {
  const plotly = /\/plotly-([\d.]+)\.min\.js$/.exec(url);
  if (plotly) return { lib: "plotly", version: plotly[1]! };
  const cdnjs = /\/ajax\/libs\/([^/]+)\/([^/]+)\//.exec(url);
  if (cdnjs) return { lib: cdnjs[1]!, version: cdnjs[2]! };
  const npm = /\/npm\/((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?/.exec(url) ?? /unpkg\.com\/((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?/.exec(url);
  assert.ok(npm, `cannot read the library of ${url}`);
  return { lib: npm[1]!, version: npm[2] ?? null };
}

/** The exact pins of render_html: each library with the version of its CDN file. */
function codePins(): Map<string, string> {
  const pins = new Map<string, string>();
  const src = readFileSync(join(ROOT, "src", "render-html.ts"), "utf-8");
  for (const m of src.matchAll(CDN_URL)) {
    const { lib, version } = libOf(m[0]);
    if (version) pins.set(lib, version);
  }
  assert.ok(pins.size >= 5, `render-html.ts names ${pins.size} pinned libraries, expected at least 5`);
  return pins;
}

test("every CDN URL in the scieng skill references names the exact version that render_html pins", () => {
  const pins = codePins();
  const problems: string[] = [];
  for (const file of readdirSync(SKILL_DIR).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(SKILL_DIR, file), "utf-8");
    for (const m of text.matchAll(CDN_URL)) {
      const { lib, version } = libOf(m[0]);
      const pin = pins.get(lib);
      if (pin !== undefined && version !== pin) {
        problems.push(`${file}: ${m[0]} names ${version ?? "no version"}, render_html pins ${pin}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("every script src and link href to a CDN in the scieng skill references has an integrity hash", () => {
  const tag = /<(script|link)\b[^>]*>/g;
  const attr = /\b(?:src|href)="(https:\/\/[^"]+)"/;
  const problems: string[] = [];
  let count = 0;
  for (const file of readdirSync(SKILL_DIR).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(SKILL_DIR, file), "utf-8");
    for (const m of text.matchAll(tag)) {
      const url = attr.exec(m[0])?.[1];
      if (!url || !/^https:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.plot\.ly)\//.test(url)) continue;
      count++;
      if (!/\sintegrity="sha384-[A-Za-z0-9+/=]+"/.test(m[0]) || !/\scrossorigin="anonymous"/.test(m[0])) {
        problems.push(`${file}: ${url} has no integrity and crossorigin="anonymous"`);
      }
    }
  }
  assert.ok(count > 0, "no CDN script or link tag was found");
  assert.deepEqual(problems, []);
});

/** Every CDN URL in the scieng skill references, with the file that holds it. */
function skillUrls(): { file: string; url: string }[] {
  const out: { file: string; url: string }[] = [];
  for (const file of readdirSync(SKILL_DIR).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(SKILL_DIR, file), "utf-8");
    for (const m of text.matchAll(CDN_URL)) out.push({ file, url: m[0] });
  }
  return out;
}

test("each library in the scieng skill references uses one version only", () => {
  const urls = skillUrls();
  const versions = new Map<string, Set<string>>();
  for (const { url } of urls) {
    const { lib, version } = libOf(url);
    if (!version) continue;
    if (!versions.has(lib)) versions.set(lib, new Set());
    versions.get(lib)!.add(version);
  }
  const problems = [...versions].filter(([, v]) => v.size > 1).map(([lib, v]) => `${lib} has versions ${[...v].sort().join(", ")}`);
  assert.deepEqual(problems, []);
});

