import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  renderHtmlPage
} from "../chunk-QSNR6J2E.mjs";
import {
  blockedWarnings,
  browserPathOf,
  htmlSource,
  parsePdfOptions
} from "../chunk-UPVXRGH6.mjs";
import "../chunk-WYJQ7P44.mjs";
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
