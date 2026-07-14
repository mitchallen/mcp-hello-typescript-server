# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
