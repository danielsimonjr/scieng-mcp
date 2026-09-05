#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { TOOLS, makeHandlers, dispatchTool } from "./tools.ts";

declare const __PKG_VERSION__: string;
const VERSION = typeof __PKG_VERSION__ !== "undefined" ? __PKG_VERSION__ : "0.0.0-dev";

const server = new Server(
  { name: "scieng-mcp", version: VERSION },
  { capabilities: { tools: {} } },
);
const HANDLERS = makeHandlers();

// MCP 2.0 registers by SPEC METHOD NAME, not by a schema object. The v1 form
// `setRequestHandler(CallToolRequestSchema, fn)` throws here: "is not a spec request
// method; pass schemas as the second argument to setRequestHandler()".
server.setRequestHandler("tools/list", async () => ({ tools: TOOLS }));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  return dispatchTool(HANDLERS, name, args);
});

// `serveStdio` replaces the v1 connect(new StdioServerTransport()) dance and owns the
// transport lifecycle, including legacy-era clients.
serveStdio(() => server, {
  legacy: "serve",
  onerror: (e) =>
    process.stderr.write(
      `scieng-mcp: ${e instanceof Error ? e.message : String(e)}` + String.fromCharCode(10),
    ),
});
process.stderr.write("scieng-mcp: connected on stdio" + String.fromCharCode(10));
