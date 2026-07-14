// The MCP server: a health check and a demo greeting tool.
//
// A deliberately small MCP server — a good starting point for a new project or
// a demo. It exposes two tools:
//
//   - server_info — health/status of the server.
//   - greet       — a friendly greeting in one of a handful of languages,
//     defaulting to English (e.g. "greet in French" -> "Bonjour!").

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { DEFAULT_LANGUAGE, greet, languages } from "./greetings.js";
import { VERSION } from "./version.js";

// startTime is captured at process start for the uptime readout.
const startTime = Date.now();

// appName is the display name reported by server_info (override with APP_NAME).
export function appName(): string {
  return process.env.APP_NAME || "mcp-hello-typescript-server";
}

// uptimeHHMMSS returns the server uptime as HH:MM:SS.
function uptimeHHMMSS(): string {
  const total = Math.floor((Date.now() - startTime) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

const INSTRUCTIONS =
  "A minimal demo MCP server. Use server_info for a health/status check, and " +
  "greet to get a friendly greeting in a given language (english, spanish, french, " +
  "german, italian, portuguese, japanese, or hawaiian; defaults to english). For " +
  "example, 'greet in French' returns 'Bonjour!'.";

// createServer builds the MCP server and registers the tools. A fresh instance
// is created per stdio process and per streamable-HTTP session.
export function createServer(): McpServer {
  const server = new McpServer(
    { name: appName(), version: VERSION },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    "server_info",
    {
      description:
        "Health/status of the server: app name, version, uptime, and supported greeting languages.",
      inputSchema: {},
      outputSchema: {
        status: z.string(),
        app: z.string(),
        version: z.string(),
        uptime: z.string(),
        languages: z.array(z.string()),
        default_language: z.string(),
        source: z.string(),
        author: z.string(),
      },
    },
    async () => {
      const info = {
        status: "OK",
        app: appName(),
        version: VERSION,
        uptime: uptimeHHMMSS(),
        languages: languages(),
        default_language: DEFAULT_LANGUAGE,
        source: "https://github.com/mitchallen/mcp-hello-typescript-server",
        author: "Mitch Allen (https://mitchallen.com)",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(info) }],
        structuredContent: info,
      };
    },
  );

  server.registerTool(
    "greet",
    {
      description:
        "Return a friendly greeting in the requested language (default English). " +
        "language accepts a language name, alternate spelling, or ISO code (english, spanish, " +
        "french, german, italian, portuguese, japanese, hawaiian). Optional name personalizes " +
        "the message. Returns {language, greeting, message}.",
      inputSchema: {
        language: z
          .string()
          .optional()
          .describe(
            "A language name, alternate spelling, or ISO code (case-insensitive); omit to " +
              "default to English. Supported: english, spanish, french, german, italian, " +
              "portuguese, japanese, hawaiian.",
          ),
        name: z
          .string()
          .optional()
          .describe(
            "Optional name to personalize the message (e.g. Bonjour, Alice!).",
          ),
      },
      outputSchema: {
        language: z.string(),
        greeting: z.string(),
        message: z.string(),
      },
    },
    async ({ language, name }) => {
      try {
        const g = greet(language, name);
        return {
          content: [{ type: "text", text: g.message }],
          structuredContent: g,
        };
      } catch (err) {
        // Unknown language -> a tool-level error (isError), so the model can see
        // the message and self-correct rather than getting a protocol error.
        return {
          content: [{ type: "text", text: (err as Error).message }],
          isError: true,
        };
      }
    },
  );

  return server;
}
