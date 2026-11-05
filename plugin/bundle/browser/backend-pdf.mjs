import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  blockedWarnings,
  browserPathOf,
  htmlSource,
  parsePdfOptions,
  renderHtmlPage
} from "../chunk-RPY43LZL.mjs";
import "../chunk-JFFRTQ6A.mjs";
import "../chunk-OP543J2H.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/browser/backend-pdf.js
async function render(request) {
  parsePdfOptions(request.options);
  const browser = browserPathOf(request.settings.browser);
  const out = await renderHtmlPage({
    html: htmlSource(request.source),
    format: "pdf",
    browser,
    timeoutMs: request.settings.timeoutMs
  });
  return { bytes: out.bytes, warnings: blockedWarnings(out.blocked) };
}
export {
  render
};
