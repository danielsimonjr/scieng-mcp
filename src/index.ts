#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOLS, makeHandlers, dispatchTool } from "./tools.ts";

declare const __PKG_VERSION__: string;
const VERSION = typeof __PKG_VERSION__ !== "undefined" ? __PKG_VERSION__ : "0.0.0-dev";

const server = new Server(
  { name: "scieng-mcp", version: VERSION },
  { capabilities: { tools: {} } },
);
const HANDLERS = makeHandlers();

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return dispatchTool(HANDLERS, name, args);
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  process.stderr.write("scieng-mcp: connected on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`scieng-mcp: fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
