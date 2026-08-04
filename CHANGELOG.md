# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Bumped the transitive `fast-uri` (via `@modelcontextprotocol/sdk` → `ajv`)
  to `3.1.4`, clearing the high-severity
  [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)
  (host confusion via literal backslash) that was failing the `npm-audit` gate.
- Added a `@hono/node-server` `overrides` entry pinning it to `^2.0.11` to clear
  [GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9)
  (moderate `serve-static` path traversal). The SDK pins `^1.19.9` and the
  advisory has no patched 1.x line, so the range can only be cleared by moving
  to the 2.x adapter. Safe here — the SDK imports only `getRequestListener`
  (unchanged in 2.x, never the vulnerable `serveStatic`), and 2.x's Node ≥20
  requirement is already met by our `engines`. Temporary until the SDK widens
  its range ([typescript-sdk#2531](https://github.com/modelcontextprotocol/typescript-sdk/issues/2531))
  or we move to SDK v2. `npm audit --omit=dev` now reports 0 vulnerabilities.
- Bumped three more transitive dependencies (all lockfile-only, within their
  parents' existing ranges) to clear a failing `npm-audit` run:
  - `fast-uri` `3.1.4` → `3.1.5` (via `ajv`) for the high-severity
    [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)
    — a follow-on host-confusion bypass (backslash authority introducer) that
    re-flagged the version the previous bump landed on.
  - `ip-address` `10.2.0` → `10.4.0` (via `express-rate-limit`) for the
    high-severity SSRF / trust-boundary bypasses
    [GHSA-mwp4-54f8-5fhr](https://github.com/advisories/GHSA-mwp4-54f8-5fhr),
    [GHSA-4xrf-jv44-h6hh](https://github.com/advisories/GHSA-4xrf-jv44-h6hh),
    and [GHSA-22jq-vg5j-6vgg](https://github.com/advisories/GHSA-22jq-vg5j-6vgg).
  - `hono` `4.12.30` → `4.13.0` for the moderate
    [GHSA-8j4g-w8fx-2239](https://github.com/advisories/GHSA-8j4g-w8fx-2239)
    (ReDoS in the CORS middleware). Below the gate's `--audit-level=high`
    threshold, but it came free with the same lockfile refresh.

  `npm audit` (with and without `--omit=dev`) reports 0 vulnerabilities.

## [0.1.0] - 2026-07-14

### Added

- Initial release: a minimal MCP server built with **TypeScript** and the
  official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk),
  exposing two tools —
  - `server_info()` — a health/status check reporting the app name, version,
    uptime, supported greeting languages, and default language.
  - `greet(language?, name?)` — a friendly greeting in one of a handful of
    languages (english, spanish, french, german, italian, portuguese, japanese,
    hawaiian), defaulting to English. Accepts a language name, alternate
    spelling, or ISO code (case-insensitive), and an optional `name` to
    personalize the message.
- Serves over **stdio** (default) or **streamable HTTP** (`MCP_TRANSPORT=http`),
  selected at runtime; the MCP endpoint is `/mcp`.
- A test suite driven through an in-memory client
  (`InMemoryTransport.createLinkedPair`) in `tests/server.test.ts`, plus unit
  tests for the greeting resolver/builder in `tests/greetings.test.ts`, run with
  the built-in Node test runner.
- Multi-stage **Docker** build compiling the TypeScript and running it on a
  distroless Chainguard/Wolfi Node base (`cgr.dev/chainguard/node`) that runs as
  a non-root user with no shell or package manager.
- **CI**: a `ci` workflow (prettier check + `tsc` type-check + tests), an
  `npm-audit` workflow scanning the production dependency tree against the npm
  advisory database, an `image-scan` workflow that fails on fixable
  CRITICAL/HIGH image vulnerabilities, a daily `scan-scheduled` re-scan of the
  published `:latest` image, and GHCR + Docker Hub `publish` workflows gated
  behind a pre-push Trivy scan.
- A Dependabot config opening weekly update PRs for npm packages, the Docker
  base image, and GitHub Actions, with low-risk updates auto-merged once CI
  passes.

[unreleased]: https://github.com/mitchallen/mcp-hello-typescript-server/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mitchallen/mcp-hello-typescript-server/releases/tag/v0.1.0
