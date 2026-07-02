FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/storage/package.json packages/storage/
COPY packages/utils/package.json packages/utils/
# @dadan/db's postinstall runs `prisma generate`, which needs the schema.
COPY packages/db/prisma packages/db/prisma
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY apps/web apps/web
COPY packages packages
ENV NEXT_TELEMETRY_DISABLED=1
ARG API_URL=http://api:4000
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_PAYMENT_MODE=mock
ARG NEXT_PUBLIC_VAT_RATE=0.15
ENV API_URL=$API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYMENT_MODE=$NEXT_PUBLIC_PAYMENT_MODE
ENV NEXT_PUBLIC_VAT_RATE=$NEXT_PUBLIC_VAT_RATE
RUN pnpm --filter @dadan/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
