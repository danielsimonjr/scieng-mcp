import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);

// node_modules/@danielsimonjr/sciengjs/dist/graph/text.js
function sourceText(source) {
  return typeof source === "string" ? source : new TextDecoder().decode(source);
}
function xmlSafe(text) {
  return text.replace(/[^\u{9}\u{A}\u{D}\u{20}-\u{D7FF}\u{E000}-\u{FFFD}\u{10000}-\u{10FFFF}]/gu, "\uFFFD");
}
function escapeDot(text) {
  return xmlSafe(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function escapeRecord(text) {
  return xmlSafe(text).replace(/\\/g, "\\\\").replace(/[{}|<>"]/g, "\\$&");
}

export {
  sourceText,
  xmlSafe,
  escapeDot,
  escapeRecord
};
