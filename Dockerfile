# --- Stage 1: Build ---
# Build on Chainguard/Wolfi's Node dev image (has npm + a shell). Wolfi is a
# minimal, hardened distro with a near-zero CVE footprint, so the final runtime
# image ships clean where a Debian base carries dozens of unfixable OS-package
# CVEs. Compile the TypeScript to build/ and prune to production deps.
FROM cgr.dev/chainguard/node:latest-dev AS builder
WORKDIR /app

# Install dependencies first (layer-cached) using only the manifest + lockfile.
# `npm ci` installs exactly what package-lock.json pins, including dev deps
# (typescript/tsx) needed to compile.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the sources and build, then drop dev dependencies so only the runtime
# deps (@modelcontextprotocol/sdk, zod) are carried into the final image.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm ci --omit=dev

# --- Stage 2: Production ---
# Distroless Chainguard/Wolfi Node runtime — no shell, no package manager, and
# it already runs as the non-root 'node' user (uid 65532). Its entrypoint is
# `node`, so CMD supplies the script path.
FROM cgr.dev/chainguard/node:latest AS prod
WORKDIR /app

# Serve over streamable HTTP by default so the container is reachable on a
# published port; MCP_TRANSPORT=stdio switches to stdio for client-launched use.
ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=8000

# Copy the pruned deps, the compiled output, and package.json (read at runtime
# for the version reported by server_info).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY package.json ./

EXPOSE 8000
CMD ["build/index.js"]
