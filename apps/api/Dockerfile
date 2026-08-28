# =============================================================================
# DADAN API — Production Dockerfile
#
# Architecture: multi-stage (base → deps → builder → runner)
#
# Key design decisions:
#   - BuildKit cache mounts for pnpm store and turbo cache → faster rebuilds
#   - --frozen-lockfile ensures reproducible installs
#   - Non-root runtime user (nestjs, uid 1001)
#   - Only runtime-essential packages (openssl for Prisma) in final image
#   - All files in the runner stage are owned by root:root (no --chown).
#     The nestjs user can read them (world-readable) but cannot modify
#     them — enforced at runtime by read_only: true in docker-compose.
#   - Layer ordering maximizes Docker build cache reuse
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: base — shared toolchain
# ---------------------------------------------------------------------------
#   - libc6-compat: required by Prisma engine for native bindings
#   - openssl:      required by Prisma for TLS database connections
#   - corepack:     pins pnpm to the exact version used in development
# ---------------------------------------------------------------------------
FROM node:25-alpine AS base
RUN apk add --no-cache libc6-compat openssl && \
    apk upgrade --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: deps — install ALL dependencies (prod + dev)
# ---------------------------------------------------------------------------
#   Only dependency manifests are copied first so Docker can cache the
#   expensive `pnpm install` layer independently of source changes.
#
#   The Prisma schema is also copied here because @dadan/db's postinstall
#   script runs `prisma generate` automatically during install.
#
#   --mount=type=cache,target=/root/.local/share/pnpm/store
#     Persists the pnpm store across builds. When the lockfile hasn't
#     changed, pnpm skips downloading and links from the cache instead.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/storage/package.json packages/storage/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/
COPY packages/db/prisma packages/db/prisma
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: builder — compile TypeScript, generate Prisma client
# ---------------------------------------------------------------------------
#   The turbo cache mount (.turbo) persists intermediate build artifacts.
#   On subsequent builds only changed packages need recompilation.
#
#   Build commands are ordered by the dependency graph:
#   types → utils → storage → db → api
# ---------------------------------------------------------------------------
FROM deps AS builder
COPY apps/api apps/api
COPY packages packages
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=.turbo \
    cd packages/db && pnpm exec prisma generate && \
    cd /app && \
    pnpm --filter @dadan/types build && \
    pnpm --filter @dadan/utils build && \
    pnpm --filter @dadan/storage build && \
    pnpm --filter @dadan/db build && \
    pnpm --filter @dadan/api build

# ---------------------------------------------------------------------------
# Stage 4: runner — minimal production image
# ---------------------------------------------------------------------------
#   Only openssl is retained (Prisma TLS requirement). Dev dependencies,
#   build tools, and source files are discarded.
#
#   npm and corepack are deleted: the entrypoint calls the Prisma binary
#   directly and the server runs on plain `node`, so the only thing npm
#   contributes at runtime is its own bundled dependency tree — which is what
#   image scanners flag. Removing it takes those findings off the surface.
#
#   HEALTHCHECK uses busybox wget (bundled with Alpine) — no extra packages.
# ---------------------------------------------------------------------------
FROM node:25-alpine AS runner
RUN apk add --no-cache openssl && \
    apk upgrade --no-cache openssl && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
# Seed catalog assets (referenced by packages/db/prisma/seed-assets.ts via
# SEED_ASSETS_DIR=/app/seeder-assets when seeding the production DB).
COPY apps/web/public/seeder-assets /app/seeder-assets
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget -q --spider http://localhost:4000/health || exit 1

USER nestjs
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["/app/docker-entrypoint.sh"]
