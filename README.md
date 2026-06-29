# DADAN Dijital

Closed, invitation-only luxury digital jewelry ownership platform.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

## Local setup

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm dev
```

## Services

| Service        | URL                          |
| -------------- | ---------------------------- |
| Web (client)   | http://localhost:3000        |
| Admin          | http://localhost:3001        |
| API            | http://localhost:4000        |
| API health     | http://localhost:4000/health |
| MinIO console  | http://localhost:9001        |
| PostgreSQL     | localhost:5433               |
| Redis          | localhost:6379               |

## Monorepo structure

```
apps/
  web/      Next.js 15 — client-facing app
  admin/    Next.js 15 — staff dashboard
  api/      NestJS — REST API
packages/
  db/       Prisma client (shared)
  ui/       Shared React components
  types/    Shared TypeScript types
  utils/    Shared utilities
  config/   ESLint, Prettier, TypeScript configs
```

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `pnpm dev`        | Start all apps in dev mode     |
| `pnpm build`      | Build all apps and packages    |
| `pnpm lint`       | Lint all workspaces            |
| `pnpm typecheck`  | Type-check all workspaces      |
| `pnpm test`       | Run tests                      |
| `pnpm db:generate`| Generate Prisma client         |
| `pnpm db:migrate` | Run Prisma migrations (dev)    |
# Danan-ECOM
