# =============================================================================
# DADAN Web — Production Dockerfile
#
# Architecture: multi-stage (base → deps → builder → runner)
#
# Key design decisions:
#   - BuildKit cache mounts for pnpm store and turbo cache → faster rebuilds
#   - --frozen-lockfile ensures reproducible installs
#   - NEXT_PUBLIC_* values baked at build time (passed as ARGs from compose)
#   - Next.js standalone output includes all required runtime dependencies
#   - Non-root runtime user (nextjs, uid 1001)
#   - All files in the runner stage are owned by root:root (no --chown).
#     The nextjs user can read them (world-readable) but cannot modify
#     them — enforced at runtime by read_only: true in docker-compose.
#   - Zero extra Alpine packages in final image (busybox wget is bundled)
#   - Layer ordering maximizes Docker build cache reuse
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: base — shared toolchain
# ---------------------------------------------------------------------------
#   corepack pins pnpm to the exact version used in development.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: deps — install ALL dependencies (prod + dev)
# ---------------------------------------------------------------------------
#   Only dependency manifests are copied first so Docker can cache the
#   expensive `pnpm install` layer independently of source changes.
#
#   The Prisma schema is copied because @dadan/db's postinstall script
#   runs `prisma generate` automatically during install, even though the
#   web package itself never uses Prisma directly.
#
#   --mount=type=cache,target=/root/.local/share/pnpm/store
#     Persists the pnpm store across builds. When the lockfile hasn't
#     changed, pnpm skips downloading and links from the cache instead.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/storage/package.json packages/storage/
COPY packages/utils/package.json packages/utils/
COPY packages/db/prisma packages/db/prisma
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: builder — compile Next.js with standalone output
# ---------------------------------------------------------------------------
#   NEXT_PUBLIC_* values cannot be changed at runtime — they are baked into
#   the JavaScript bundle at build time. docker-compose.prod.yml passes them
#   as build args automatically.
#
#   The turbo cache mount (.turbo) persists intermediate build artifacts.
#   On subsequent builds only changed pages need recompilation.
# ---------------------------------------------------------------------------
FROM deps AS builder
COPY packages/config packages/config
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
ARG API_URL=http://api:4000
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_PAYMENT_MODE=mock
ARG NEXT_PUBLIC_VAT_RATE=0.15
ENV API_URL=$API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYMENT_MODE=$NEXT_PUBLIC_PAYMENT_MODE
ENV NEXT_PUBLIC_VAT_RATE=$NEXT_PUBLIC_VAT_RATE
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    --mount=type=cache,target=.turbo \
    pnpm --filter @dadan/web build

# ---------------------------------------------------------------------------
# Stage 4: runner — minimal production image
# ---------------------------------------------------------------------------
#   Next.js standalone output (apps/web/.next/standalone) includes the
#   server, all JS bundles, and node_modules — nothing else is required.
#
#   Files are COPYed without --chown so they remain owned by root:root.
#   The nextjs user can read them (world-readable), but cannot modify
#   them even if compromised — the runtime filesystem is read-only at
#   the container level (read_only: true in compose).
#
#   npm and corepack are deleted: the standalone server runs on plain `node`,
#   so the only thing npm contributes at runtime is its own bundled dependency
#   tree — which is what image scanners flag. Removing it takes those findings
#   off the surface.
#
#   HEALTHCHECK uses busybox wget (bundled with Alpine) — no extra packages.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:3000 || exit 1

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
