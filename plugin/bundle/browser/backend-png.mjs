import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  blockedWarnings,
  browserPathOf,
  htmlSource,
  parsePngOptions,
  renderHtmlPage
} from "../chunk-RPY43LZL.mjs";
import "../chunk-JFFRTQ6A.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/browser/backend-png.js
async function render(request) {
  const options = parsePngOptions(request.options);
  const browser = browserPathOf(request.settings.browser);
  const out = await renderHtmlPage({
    html: htmlSource(request.source),
    format: "png",
    width: options.width,
    height: options.height,
    scale: options.scale,
    browser,
    timeoutMs: request.settings.timeoutMs
  });
  return { bytes: out.bytes, warnings: blockedWarnings(out.blocked) };
}
export {
  render
};
