# mcp-hello-typescript-server

[![ci](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/ci.yml/badge.svg)](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/ci.yml) [![image-scan](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/image-scan.yml/badge.svg)](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/image-scan.yml) [![npm-audit](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/npm-audit.yml/badge.svg)](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/npm-audit.yml) [![publish](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/publish.yml/badge.svg)](https://github.com/mitchallen/mcp-hello-typescript-server/actions/workflows/publish.yml)

[![Docker Hub](https://img.shields.io/docker/v/mitchallen/mcp-hello-typescript-server?sort=semver&logo=docker&label=docker%20hub)](https://hub.docker.com/r/mitchallen/mcp-hello-typescript-server) [![image size](https://img.shields.io/docker/image-size/mitchallen/mcp-hello-typescript-server?sort=semver&logo=docker&label=image%20size)](https://hub.docker.com/r/mitchallen/mcp-hello-typescript-server/tags) [![Docker pulls](https://img.shields.io/docker/pulls/mitchallen/mcp-hello-typescript-server?logo=docker&label=pulls)](https://hub.docker.com/r/mitchallen/mcp-hello-typescript-server) [![GHCR](https://img.shields.io/badge/ghcr.io-mitchallen%2Fmcp--hello--typescript--server-2496ed?logo=github)](https://github.com/mitchallen/mcp-hello-typescript-server/pkgs/container/mcp-hello-typescript-server) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](#license)

A minimal [MCP](https://modelcontextprotocol.io) server built with **TypeScript**
and the official
[`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
— a good starting point for a new server or a demo. It exposes just two tools:

- **`server_info`** — a health/status check.
- **`greet`** — a friendly greeting in one of a handful of languages, defaulting
  to English. Ask it to "greet in French" and it replies `Bonjour!`.

Built with **TypeScript**, the **[TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)**,
and **make**. It is the TypeScript port of the sibling Python
[`mcp-hello-server`](../mcp-hello-server), following the official MCP
[Build a server (TypeScript)](https://modelcontextprotocol.io/docs/develop/build-server#typescript)
reference. The Docker image compiles the TypeScript and runs it on a distroless
Chainguard/Wolfi Node base — no shell, no package manager, non-root.

---

## Quick start — demo an MCP server in 2 minutes

New to MCP? This is a tiny, safe server for **seeing how an MCP client discovers
and calls tools**. Every tool is a harmless in-memory lookup, so it's a good
sandbox. All you need is **[Docker](https://docs.docker.com/get-docker/)** and an
MCP client — the steps below use **[Claude Code](https://claude.com/claude-code)**
and the published Docker image (nothing to build or install).

> **Already running one of the sibling hello servers?** The Python
> [`mcp-hello-server`](../mcp-hello-server) (alias `hello`), Go
> [`mcp-hello-go-server`](../mcp-hello-go-server) (alias `hello-go`), and Rust
> [`mcp-hello-rust-server`](../mcp-hello-rust-server) (alias `hello-rust`) expose
> the same `server_info` / `greet` tools, so it's easy to test the wrong one.
> Remove any you don't want registered so your client only talks to `hello-ts`:
>
> ```sh
> claude mcp list                # see what's registered
> claude mcp remove hello        # the Python server, if present
> claude mcp remove hello-go     # the Go server, if present
> claude mcp remove hello-rust   # the Rust server, if present
> ```

**1. Add the server.** Claude Code launches the container per session and talks
to it over stdio:

```sh
claude mcp add hello-ts -- docker run -i --rm -e MCP_TRANSPORT=stdio ghcr.io/mitchallen/mcp-hello-typescript-server:latest
```

**2. Confirm it connected:**

```sh
claude mcp list        # "hello-ts" should report ✔ Connected
```

**3. Ask in plain language** — Claude discovers the tools and picks one (the tool
it calls is in parentheses):

- "Is the hello server up? What version is it?" → (`server_info`)
- "Greet me in French." → (`greet` → **Bonjour!**)
- "Say hello in Japanese to Alice." → (`greet` → **こんにちは (Konnichiwa), Alice!**)
- "What languages can you greet in?" → (`server_info`, reads `languages`)

That round trip — the client listing tools, then calling one with arguments and
getting structured JSON back — _is_ MCP.

**4. Remove it when you're done:**

```sh
claude mcp remove hello-ts
```

> **Prefer HTTP?** Run it as a long-lived server instead:
>
> ```sh
> docker run --rm -p 8000:8000 ghcr.io/mitchallen/mcp-hello-typescript-server:latest
> claude mcp add --transport http hello-ts http://localhost:8000/mcp
> ```

---

## Tools

| Tool                      | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `server_info()`           | Health/status: app name, version, uptime, supported languages |
| `greet(language?, name?)` | Greeting in `language` (default English); optional `name`     |

### `greet`

`greet` takes two optional arguments:

- **`language`** — a language name, an alternate spelling, or an ISO code
  (case-insensitive). Omit it to default to English. Supported: `english`,
  `spanish`, `french`, `german`, `italian`, `portuguese`, `japanese`,
  `hawaiian` (e.g. `french`, `Français`, or `fr` all work).
- **`name`** — optional; personalizes the message (`Bonjour, Alice!`).

It returns `{ language, greeting, message }`:

```jsonc
// greet(language="french")
{ "language": "french", "greeting": "Bonjour", "message": "Bonjour!" }

// greet(language="spanish", name="Alice")
{ "language": "spanish", "greeting": "Hola", "message": "Hola, Alice!" }

// greet()  -> { "language": "english", "greeting": "Hello", "message": "Hello!" }
```

An unknown language returns a tool error listing the supported set.

### Add a language

Add a row to `GREETINGS` in `src/greetings.ts` (and, optionally, an alias / ISO
code to `ALIASES`). `server_info` reports the supported set automatically.

---

## Quick start (from source)

Requires [Node.js](https://nodejs.org/) 20+.

```sh
make install     # npm ci
make build       # tsc -> ./build
make test        # run the test suite
make run         # run the server over stdio
```

`make help` lists every target.

---

## Running the server

### stdio (default — for MCP clients that launch the server)

```sh
npm run dev      # runs src/index.ts via tsx
# or, after `make build`:
node build/index.js
# or
make run
```

### Streamable HTTP (for networked clients / containers)

```sh
make run-http            # PORT defaults to 8000
PORT=9000 make run-http
```

The MCP endpoint is served at `/mcp`.

---

## Configuration

All configuration is via environment variables:

| Variable        | Default                       | Purpose                        |
| --------------- | ----------------------------- | ------------------------------ |
| `APP_NAME`      | `mcp-hello-typescript-server` | Name reported by `server_info` |
| `MCP_TRANSPORT` | `stdio`                       | `stdio` or `http`              |
| `HOST`          | `127.0.0.1`                   | Bind address for `http`        |
| `PORT`          | `8000`                        | Bind port for `http`           |

---

## Using with an MCP client — local development (from source)

Point a stdio-based client (e.g. Claude Desktop, Claude Code) at the built
entry point. With Claude Code, from the project directory:

```sh
make build
claude mcp add hello-ts -- node "$PWD/build/index.js"
```

Confirm it's connected with `claude mcp list` (or `/mcp` inside a session).

### Example prompts (Claude Code)

Once the server is added, just ask in plain language — Claude picks the right
tool. The tool it invokes is shown in parentheses.

- "Is the hello server up? What version is it?" → (`server_info`)
- "Greet me." → (`greet`, defaults to English → "Hello!")
- "Greet in French." → (`greet` with `language="french"` → "Bonjour!")
- "Say hello in Japanese to Alice." → (`greet` with `language="japanese"`, `name="Alice"`)
- "What languages can you greet in?" → (`server_info`, then read `languages`)

---

## Using a published image

The image is published to two registries:

- **GitHub Container Registry:** `ghcr.io/mitchallen/mcp-hello-typescript-server`
- **Docker Hub:** `mitchallen/mcp-hello-typescript-server`

### Option A — Docker image, client launches it (stdio)

This is the simplest setup: **there's nothing to build or install** — just the
published image. Pull it up front once so the first session doesn't block on the
download (which can race an MCP client's connect/startup timeout):

```sh
docker pull ghcr.io/mitchallen/mcp-hello-typescript-server:latest
```

The client starts a fresh container per session and talks to it over stdio. Use
`-i` (keep stdin open) and force the stdio transport, since the image defaults to
HTTP:

```jsonc
{
  "mcpServers": {
    "hello-ts": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "MCP_TRANSPORT=stdio",
        "ghcr.io/mitchallen/mcp-hello-typescript-server:latest",
      ],
    },
  },
}
```

Claude Code equivalent:

```sh
claude mcp add hello-ts -- docker run -i --rm -e MCP_TRANSPORT=stdio ghcr.io/mitchallen/mcp-hello-typescript-server:latest
```

(Pin a version like `:0.1.0` in place of `:latest` for a reproducible setup.)

### Option B — Long-running container over HTTP

The image serves HTTP by default. Start it once, then point an HTTP-capable
client at it:

```sh
docker run -d --rm -p 8000:8000 --name mcp-hello-ts ghcr.io/mitchallen/mcp-hello-typescript-server:latest
claude mcp add --transport http hello-ts http://localhost:8000/mcp
```

For clients that only speak **stdio**, bridge to the HTTP endpoint with
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```jsonc
{
  "mcpServers": {
    "hello-ts": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:8000/mcp"],
    },
  },
}
```

Notes for remote use:

- Prefer **HTTPS** so traffic is encrypted in transit.
- This server ships **no authentication**. If you expose it beyond localhost, put
  it behind a reverse proxy, gateway, or network policy.
- The endpoint path is `/mcp`.

### Option C — npm package via `npx` (not implemented here)

Because the server already exposes a `bin` entry point over stdio, it could also
be distributed as an **npm package** and launched with `npx` — the usual pattern
for MCP servers in Claude Code:

```sh
claude mcp add hello-ts -- npx -y <package-name>
```

Publishing to either the **public npm registry** (npmjs.com — zero-config `npx`)
or **GitHub Packages** (scoped `@owner/…`, but consumers need a token in
`.npmrc`) would enable this. It's left out of this demo on purpose to keep the
focus on the Docker distribution path.

---

## Docker

Published multi-platform (`linux/amd64`, `linux/arm64`) images run the server
over **streamable HTTP** by default (`MCP_TRANSPORT=http`, `HOST=0.0.0.0`,
`PORT=8000`) so they're reachable on a published port.

A multi-stage build compiles the TypeScript on
`cgr.dev/chainguard/node:latest-dev`, prunes to production dependencies, and
copies `build/` + `node_modules` onto a distroless
**[Chainguard/Wolfi](https://images.chainguard.dev) `node` base** — no shell, no
package manager, runs as the non-root `node` user. Unlike the Go/Rust siblings
(which ship a single static binary at ~10–17 MB), this image carries the Node
runtime and `node_modules`, so it's larger (~275 MB) — that's inherent to
shipping a runtime rather than a compiled binary. Every build is gated by a Trivy
scan (fails on fixable CRITICAL/HIGH); the dependency tree is separately scanned
with `npm audit`, and the published `:latest` is re-scanned daily — see
[Security scanning](#security-scanning).

### Pull and run

```sh
docker pull ghcr.io/mitchallen/mcp-hello-typescript-server:latest
docker run --rm -p 8000:8000 --name mcp-hello-ts ghcr.io/mitchallen/mcp-hello-typescript-server:latest
```

Then connect an HTTP MCP client to `http://localhost:8000/mcp`.

### Test a published release with make

```sh
make docker-test               # up + smoke + down in one shot (exits non-zero on failure)

make docker-up                 # pull + run ghcr.io/mitchallen latest, detached
make docker-smoke              # MCP `initialize` handshake — passes if the server responds
make docker-down               # stop it

make docker-up TAG=0.1.0                         # pin a version
make docker-up REGISTRY=docker.io/mitchallen     # pull from Docker Hub instead
make docker-up HTTP_PORT=9000                    # publish on a different host port
```

### Build locally

```sh
make docker-build        # docker build -t mcp-hello-typescript-server .
make docker-run          # serves http on localhost:8000
make scan                # Trivy scan of the local image (fixable CRITICAL/HIGH fail)
```

---

## Security scanning

Two complementary gates catch vulnerabilities, both reproducible locally:

- **`image-scan`** (`make scan`) — Trivy scans the built container image and
  fails the build on **fixable** CRITICAL/HIGH vulnerabilities. It covers the OS
  layer of the runtime image and reads the JavaScript packages in
  `node_modules`.
- **`npm-audit`** (`npm audit --omit=dev --audit-level=high`) — scans the
  **production** dependency tree against the npm advisory database. Dev-only
  tooling advisories don't wedge the build.
- **`scan-scheduled`** re-scans the published `:latest` image daily and uploads
  results to the GitHub Security tab, catching CVEs disclosed after build time.
- **Dependabot** opens weekly PRs for npm packages, the Docker base image, and
  GitHub Actions; low-risk updates auto-merge once CI passes.

---

## CI / Publish

Workflows live in `.github/workflows/`:

- **`ci`** — on every push/PR to `main`: prettier format check, `tsc` type-check,
  and `node --test`.
- **`npm-audit`** / **`image-scan`** / **`scan-scheduled`** — vulnerability
  scanning (see above).
- **`publish`** / **`publish-dockerhub`** — triggered by pushing a `v*` tag.
  Build a multi-platform image, Trivy-scan it, push it to GHCR and Docker Hub,
  then run `make docker-test` against the just-published image. The Docker Hub
  job needs `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` repository secrets.

To cut a release, use the `release` target — it bumps the `version` in
`package.json`, commits, tags, pushes, and creates the GitHub Release from the
`CHANGELOG.md` section, which triggers both publish workflows:

```sh
make release              # patch bump (default)
make release BUMP=minor   # or minor / major
```

The target refuses to run unless the working tree is clean, you're on `main`, and
`CHANGELOG.md` already has a `## [X.Y.Z]` section for the new version.

### Docker Hub secrets (one-time setup)

Pushing to **GHCR** needs no setup — it uses the built-in `GITHUB_TOKEN`. The
**`publish-dockerhub`** job additionally needs two repository secrets and a
pre-created Docker Hub repo:

1. **Create a Docker Hub access token** (not your password) with **Read & Write**
   permissions, at hub.docker.com → Account Settings → Personal access tokens.
2. **Create the Docker Hub repository** `mitchallen/mcp-hello-typescript-server`
   (Public).
3. **Add the two GitHub secrets** — `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`:

   ```sh
   gh secret set DOCKERHUB_USERNAME --body "mitchallen"
   gh secret set DOCKERHUB_TOKEN          # prompts for the value — paste the token
   ```

Without these, the GHCR `publish` job still succeeds; only `publish-dockerhub`
fails at the login step.

---

## Development

- Source: `src/`
  - `greetings.ts` — greeting data + language resolution (`greet`), unit-tested
  - `server.ts` — `createServer()` + tools registered with `server.registerTool`
  - `version.ts` — reads the version from `package.json` at runtime
  - `index.ts` — the entry point; transport wiring (stdio / HTTP)
- Tests: `tests/server.test.ts` drives the tools through an **in-memory client**
  (`InMemoryTransport.createLinkedPair`, no network/subprocess);
  `tests/greetings.test.ts` unit-tests the resolver/builder. Run everything with
  `make test`, or the full CI gate with `make check` (prettier + type-check +
  test).
- **Dependencies:** `package.json` / `package-lock.json` are committed. Run
  `npm install` after changing dependencies to refresh the lockfile.

---

## License

MIT © Mitch Allen
