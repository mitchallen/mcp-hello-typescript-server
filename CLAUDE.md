# mcp-hello-typescript-server — notes for Claude

A minimal MCP server built with **TypeScript** and the official
[`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
— a good starting point for a new server or a demo. It exposes two tools:
`server_info` (a health/status check) and `greet` (a friendly greeting in one of
a handful of languages, defaulting to English). Built with **npm**, **tsc**, and
**make**; a multi-stage Docker build compiles the TypeScript and runs it on a
distroless Chainguard/Wolfi `node` base (`cgr.dev/chainguard/node`). It is the
TypeScript port of the sibling Python [`mcp-hello-server`](../mcp-hello-server),
following the official MCP
[Build a server (TypeScript)](https://modelcontextprotocol.io/docs/develop/build-server#typescript)
reference (alongside the Go [`mcp-hello-go-server`](../mcp-hello-go-server) and
Rust [`mcp-hello-rust-server`](../mcp-hello-rust-server) ports).

## Layout

- `src/greetings.ts` — greeting data (`GREETINGS`), language resolution (names,
  aliases, ISO codes), and the `greet()` builder. Unit-tested in
  `tests/greetings.test.ts`.
- `src/server.ts` — `createServer()` builds the `McpServer`, defines the tool
  input/output schemas (zod) and handlers, and registers them with
  `server.registerTool`. Tools return `structuredContent` for the structured
  result.
- `src/version.ts` — reads the `version` from `package.json` at runtime (the
  single source of truth) so the MCP handshake and `server_info` stay in sync.
- `src/index.ts` — the entry point; picks the transport from `MCP_TRANSPORT` and
  wires up stdio (`StdioServerTransport`) or streamable HTTP
  (`StreamableHTTPServerTransport` on a `node:http` server, stateless, mounted
  at `/mcp`).
- `tests/server.test.ts` — integration tests connecting a client and server over
  `InMemoryTransport.createLinkedPair()` (the analog of the Python suite's
  in-memory FastMCP client). No network, no subprocess.

## Conventions

- **Build / deps:** npm. `package.json` / `package-lock.json` are committed and
  the Dockerfile installs `npm ci` from the lockfile. `make build` = `tsc` →
  `build/`. Run `npm install` after changing dependencies to refresh the lock.
- **Version:** the source of truth is `"version"` in `package.json`; `make
release` bumps it with `npm version`. `src/version.ts` reads it at runtime.
- **Running:** `make run` (stdio, the default MCP transport, from source via
  `tsx`), `make run-http` (streamable HTTP on `PORT`, default 8000). The
  transport is chosen by `MCP_TRANSPORT` (`stdio` | `http`); the HTTP endpoint is
  `/mcp`.
- **Tests / gate:** `make test` (`node --test`), `make check` (prettier check +
  `tsc --noEmit` + tests) — the CI gate.
- **Adding a language:** add a row to `GREETINGS` in `greetings.ts` (and,
  optionally, an alias / ISO code to `ALIASES`). `server_info` reports the set
  automatically.
- **Docker:** the image defaults to HTTP transport (`MCP_TRANSPORT=http`,
  `HOST=0.0.0.0`, `PORT=8000`). TypeScript is compiled in a builder stage on
  `cgr.dev/chainguard/node:latest-dev`; the pruned production `node_modules`,
  the compiled `build/`, and `package.json` are copied onto
  `cgr.dev/chainguard/node:latest`, which has no shell / package manager and
  runs as the non-root `node` user (uid 65532). Its entrypoint is `node`, so the
  Dockerfile uses `CMD ["build/index.js"]`. `make scan` should report 0
  CRITICAL/HIGH.
- **Releasing:** `make release` (`BUMP=patch|minor|major`, default patch) bumps
  the `version` in `package.json` (+ `package-lock.json`), commits, tags
  `vX.Y.Z`, pushes, and creates the matching GitHub Release from the
  `CHANGELOG.md` section. The tag triggers the GHCR + Docker Hub publish
  workflows. It refuses to run unless the tree is clean, you're on `main`, and
  `CHANGELOG.md` already has the new version's section.

## Tools

| Tool                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `server_info()`           | Health/status: app name, version, uptime, languages.     |
| `greet(language?, name?)` | Greeting in a language (default English); optional name. |

Supported languages: `english`, `spanish`, `french`, `german`, `italian`,
`portuguese`, `japanese`, `hawaiian`. Lookups accept aliases / ISO codes
(`fr`, `Français`, …) case-insensitively.

## Security scanning

Two complementary gates, both in CI and reproducible locally:

- **`image-scan`** (`make scan`) — Trivy scans the built image and fails on
  fixable CRITICAL/HIGH. Covers the OS layer of the runtime image and the
  JavaScript packages in `node_modules`.
- **`npm-audit`** — `npm audit --omit=dev --audit-level=high` scans the
  production dependency tree against the npm advisory database. Also runs daily.
- **`scan-scheduled`** re-scans the published `:latest` daily so CVEs disclosed
  after build time still surface in the Security tab.

### `@hono/node-server` override

`package.json` pins a transitive `overrides` entry forcing
`@modelcontextprotocol/sdk`'s `@hono/node-server` to `^2.0.11`. The SDK pins
`^1.19.9`, but [GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9)
(moderate, `serve-static` path traversal) affects **all** `<2.0.5` with no 1.x
backport, so the range can only be cleared by moving to 2.x. It's unreachable
here (the SDK imports only `getRequestListener`, never the vulnerable
`serveStatic`; the flaw is Windows-only and we run Linux), but it surfaces in
`npm audit` and every Dependabot scan. The 2.x line drops Node 18, which is fine
— we already require `node >=20`. Remove this override once the SDK widens its
range (tracked upstream in
[modelcontextprotocol/typescript-sdk#2531](https://github.com/modelcontextprotocol/typescript-sdk/issues/2531))
or once we move to SDK v2, which splits transports into optional packages.

## Gotchas

- **`structuredContent` needs an index-signature type.** The greet result is a
  `type Greeting = {…}` (not an `interface`) — interfaces are not assignable to
  the SDK's `{ [x: string]: unknown }` structured-content type. Tools with an
  `outputSchema` must return `structuredContent` on the success path.
- **Unknown language → tool-level error.** `greet` returns
  `{ content: [...], isError: true }` (a tool error the model can see and
  self-correct), not a thrown/protocol error.
- **Logs go to stderr** (`console.error`): the stdio transport owns stdout for
  the JSON-RPC stream, so a stray `console.log` would corrupt the protocol.
- **stdio + closed stdin:** the stdio transport shuts down on stdin EOF, so a
  one-shot `printf … | server` test can exit before replying — hold stdin open
  (e.g. `{ printf …; sleep 1; } | server`) or use the in-memory client.
- **ESM import paths carry `.js`.** `moduleResolution: Node16` requires relative
  imports to use the compiled extension (`./greetings.js`) even from `.ts`
  source; tests import `../src/greetings.js` and are run through `tsx`.
- **The Node image is ~275 MB**, not the ~10–17 MB of the Go/Rust static-binary
  siblings — it carries the Node runtime and `node_modules`. It's still
  distroless and non-root; the size difference is inherent to shipping a runtime.
