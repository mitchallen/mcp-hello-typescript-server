// Tests for the MCP tool layer, driven through an in-memory client.
//
// A server and a client are connected over an in-process pair of transports
// (InMemoryTransport.createLinkedPair) — the TypeScript analog of the Python
// suite's in-memory FastMCP client. No network, no subprocess.

import assert from "node:assert/strict";
import { test } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "../src/server.js";

// connect wires a fresh server to a client over in-memory transports and
// returns the connected client.
async function connect(): Promise<Client> {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverTransport);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(clientTransport);
  return client;
}

// callStruct calls a tool and returns its structured content.
async function callStruct(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await client.callTool({ name, arguments: args });
  assert.ok(
    !res.isError,
    `call ${name} returned isError: ${JSON.stringify(res.content)}`,
  );
  return res.structuredContent as Record<string, unknown>;
}

test("tools are registered", async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["greet", "server_info"]);
});

test("server_info reports status and metadata", async () => {
  const client = await connect();
  const info = await callStruct(client, "server_info", {});
  assert.equal(info.status, "OK");
  assert.equal(info.default_language, "english");
  assert.equal(
    info.source,
    "https://github.com/mitchallen/mcp-hello-typescript-server",
  );
  assert.ok((info.languages as string[]).includes("english"));
  assert.ok(typeof info.version === "string" && info.version.length > 0);
});

test("greet defaults to english", async () => {
  const client = await connect();
  const g = await callStruct(client, "greet", {});
  assert.equal(g.language, "english");
  assert.equal(g.message, "Hello!");
});

test("greet in french", async () => {
  const client = await connect();
  const g = await callStruct(client, "greet", { language: "French" });
  assert.equal(g.language, "french");
  assert.equal(g.message, "Bonjour!");
});

test("greet personalized", async () => {
  const client = await connect();
  const g = await callStruct(client, "greet", {
    language: "spanish",
    name: "Alice",
  });
  assert.equal(g.language, "spanish");
  assert.equal(g.message, "Hola, Alice!");
});

test("greet unknown language errors", async () => {
  const client = await connect();
  const res = await client.callTool({
    name: "greet",
    arguments: { language: "klingon" },
  });
  assert.ok(res.isError, "expected isError for an unknown language");
  const text = (res.content as Array<{ type: string; text?: string }>)
    .map((c) => c.text ?? "")
    .join("");
  assert.ok(
    text.includes("unknown language"),
    `error content ${JSON.stringify(text)} should mention 'unknown language'`,
  );
});
