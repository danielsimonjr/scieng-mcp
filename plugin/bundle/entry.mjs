import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);
import {
  RENDER_ERROR_CODES,
  RenderError,
  isRenderError
} from "./chunk-JFFRTQ6A.mjs";
import "./chunk-Y7HUHYVH.mjs";

// node_modules/@danielsimonjr/sciengjs/dist/worker/entry.js
import { parentPort, workerData } from "node:worker_threads";
var __rewriteRelativeImportExtension = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) {
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  }
  return path;
};
async function run(job2) {
  try {
    const mod = await import(__rewriteRelativeImportExtension(job2.moduleUrl));
    if (typeof mod.render !== "function") {
      throw new RenderError("E_INTERNAL", `backend module ${job2.moduleUrl} exports no render function`);
    }
    const out = await mod.render(job2.request);
    return { ok: true, bytes: out.bytes, warnings: out.warnings ?? [], backend: out.backend };
  } catch (err) {
    if (isRenderError(err)) {
      return { ok: false, code: err.code, message: err.message, line: err.line, column: err.column };
    }
    const message2 = err instanceof Error ? err.message : String(err);
    return { ok: false, code: "E_INTERNAL", message: message2 };
  }
}
var job = workerData;
var message = await run(job);
if (!message.ok && !RENDER_ERROR_CODES.includes(message.code)) {
  message.code = "E_INTERNAL";
}
parentPort?.postMessage(message);
