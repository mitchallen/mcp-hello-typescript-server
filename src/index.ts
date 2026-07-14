#!/usr/bin/env node
// Console entry point for the hello MCP server.
//
// The transport is chosen by MCP_TRANSPORT:
//
//   - stdio (default) — for MCP clients that launch the server as a subprocess.
//   - http            — streamable HTTP on HOST:PORT (the container default),
//     serving the MCP endpoint at /mcp.
//
// Environment variables:
//
//   APP_NAME       display name reported by server_info (default: mcp-hello-typescript-server)
//   MCP_TRANSPORT  "stdio" (default) or "http"
//   HOST, PORT     bind address for the http transport (default: 127.0.0.1:8000)

import http from "node:http";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { appName, createServer } from "./server.js";

async function main(): Promise<void> {
  const transport = process.env.MCP_TRANSPORT || "stdio";
  switch (transport) {
    case "http":
      await runHTTP();
      break;
    case "stdio":
      await runStdio();
      break;
    default:
      throw new Error(
        `unsupported MCP_TRANSPORT '${transport}'; expected 'stdio' or 'http'`,
      );
  }
}

// runStdio serves over stdio: requests on stdin, responses on stdout. Logs must
// go to stderr — the stdio transport owns stdout for the JSON-RPC stream, so a
// stray stdout write would corrupt the protocol.
async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`starting ${appName()} over stdio`);
}

// runHTTP serves over streamable HTTP, exposing the MCP endpoint at /mcp. Each
// request is handled statelessly with a fresh server + transport, so there is no
// cross-request session state to manage.
async function runHTTP(): Promise<void> {
  const host = process.env.HOST || "127.0.0.1";
  const port = parseInt(process.env.PORT || "8000", 10);

  const httpServer = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error("request error:", err);
      if (!res.headersSent) {
        res.writeHead(500).end();
      }
    });
  });

  httpServer.listen(port, host, () => {
    console.error(
      `starting ${appName()} over streamable HTTP at http://${host}:${port}/mcp`,
    );
  });
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const path = (req.url || "").split("?")[0];
  if (path !== "/mcp") {
    res.writeHead(404).end();
    return;
  }
  if (req.method !== "POST") {
    // Stateless streamable HTTP only needs POST (no long-lived SSE stream).
    res.writeHead(405, { Allow: "POST" }).end();
    return;
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, await readJsonBody(req));
}

// readJsonBody buffers the request body and parses it as JSON (or undefined if
// the body is empty / not valid JSON).
function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", reject);
  });
}

main().catch((err) => {
  console.error("Fatal error in main():", err);
  process.exit(1);
});
