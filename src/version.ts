// Single source of truth for the server version: the "version" field in
// package.json. `make release` bumps it there (via `npm version`), and it is
// read back at runtime so the MCP handshake and server_info stay in sync.
//
// package.json sits one level above both the compiled entry point
// (build/version.js -> ../package.json) and the TypeScript source when run via
// tsx (src/version.ts -> ../package.json), and it is copied into the Docker
// image, so this relative lookup resolves in every environment.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export const VERSION: string = (() => {
  try {
    const pkg = JSON.parse(
      readFileSync(join(here, "..", "package.json"), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
})();
