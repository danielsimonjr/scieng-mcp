#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOLS, makeHandlers } from "./tools.ts";

const server = new Server(
  { name: "scieng-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);
const HANDLERS = makeHandlers();

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = HANDLERS[name];
  if (!handler) {
    return { content: [{ type: "text", text: `Error: unknown tool '${name}'` }], isError: true };
  }
  try {
    const text = await handler(args ?? {});
    return { content: [{ type: "text", text }] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`scieng-mcp: handler '${name}' threw: ${msg}\n`);
    return { content: [{ type: "text", text: JSON.stringify({ status: "error", error: msg }) }], isError: true };
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  process.stderr.write("scieng-mcp: connected on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`scieng-mcp: fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
