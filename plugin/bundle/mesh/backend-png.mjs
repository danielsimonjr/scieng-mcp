import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  viewerPageHtml
} from "../chunk-EYA6V7TC.mjs";
import {
  render
} from "../chunk-HXUDKQKS.mjs";
import {
  THREE_MODULES
} from "../chunk-UDEV2G2S.mjs";
import {
  renderHtmlPage
} from "../chunk-FOTRRLDZ.mjs";
import {
  blockedWarnings,
  browserPathOf,
  parsePngOptions
} from "../chunk-UPVXRGH6.mjs";
import {
  readAsset
} from "../chunk-SUGXCK3Q.mjs";
import {
  RenderError
} from "../chunk-WYJQ7P44.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/mesh/pinned-three.js
import { createHash } from "node:crypto";
function pinnedThree(assetsUrl) {
  const map = /* @__PURE__ */ new Map();
  for (const m of THREE_MODULES) {
    const bytes = readAsset(assetsUrl, m.file);
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hash !== m.sha256) {
      throw new RenderError("E_INTEGRITY", `${m.file} has the SHA-256 ${hash}, not the pinned ${m.sha256}`);
    }
    map.set(m.url, { bytes, mime: m.mime });
  }
  return map;
}

// node_modules/@danielsimonjr/sciengjs/dist/mesh/backend-png.js
var PNG_KEYS = ["width", "height", "scale"];
async function render2(request) {
  const pngOptions = {};
  const meshOptions = {};
  for (const [key, value] of Object.entries(request.options)) {
    (PNG_KEYS.includes(key) ? pngOptions : meshOptions)[key] = value;
  }
  const size = parsePngOptions(pngOptions);
  const browser = browserPathOf(request.settings.browser);
  const glb = await render({ ...request, options: meshOptions });
  const pinned = pinnedThree(request.settings.assetsUrl);
  const out = await renderHtmlPage({
    html: viewerPageHtml(glb.bytes, { title: `${request.type} model`, controls: false }),
    format: "png",
    width: size.width,
    height: size.height,
    scale: size.scale,
    browser,
    timeoutMs: request.settings.timeoutMs,
    pinned,
    awaitReady: true
  });
  return { bytes: out.bytes, warnings: [...glb.warnings ?? [], ...blockedWarnings(out.blocked)] };
}
export {
  render2 as render
};
