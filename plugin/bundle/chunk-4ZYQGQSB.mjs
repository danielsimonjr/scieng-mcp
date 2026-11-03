import { createRequire as __createRequire } from 'node:module';import { fileURLToPath as __fileURLToPath } from 'node:url';import { dirname as __dirnameOf } from 'node:path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameOf(__filename);

// node_modules/@danielsimonjr/sciengjs/dist/errors.js
var RENDER_ERROR_CODES = [
  "E_INPUT",
  "E_UNSUPPORTED",
  "E_LIMIT",
  "E_TIMEOUT",
  "E_STAGE_MISSING",
  "E_CONFIG",
  "E_INTEGRITY",
  "E_INTERNAL"
];
var RenderError = class extends Error {
  code;
  line;
  column;
  constructor(code, message, position = {}) {
    super(message);
    this.name = "RenderError";
    this.code = code;
    this.line = position.line;
    this.column = position.column;
  }
};

export {
  RENDER_ERROR_CODES,
  RenderError
};
