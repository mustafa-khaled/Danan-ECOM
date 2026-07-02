# DADAN Dijital

Closed, invitation-only luxury digital jewelry ownership platform.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Cloudflare account with R2 bucket (free tier)

## Local setup

```bash
pnpm install
cp .env.example .env
# Fill in Cloudflare R2 credentials in .env (see S3_* vars)
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Services

| Service        | URL                                      |
| -------------- | ---------------------------------------- |
| Web (client + admin) | http://localhost:3000              |
| Admin dashboard    | http://localhost:3000/admin/login  |
| API            | http://localhost:4000                    |
| API health     | http://localhost:4000/health             |
| PostgreSQL     | localhost:5433                           |
| Redis          | localhost:6379                           |

Object storage uses **Cloudflare R2** (S3-compatible). Create a dev bucket (`dadan-assets-dev`) and API token in the Cloudflare dashboard, then set `S3_*` variables in `.env`.

## Monorepo structure

```
apps/
  web/      Next.js 15 — client app + admin dashboard (/admin/*)
  api/      NestJS — REST API
packages/
  db/       Prisma client (shared)
  ui/       Shared React components
  types/    Shared TypeScript types
  utils/    Shared utilities
  storage/  Cloudflare R2 / S3-compatible storage
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

## Cloudflare R2 setup

1. Cloudflare Dashboard → **R2 Object Storage** → create bucket (`dadan-assets-dev` for local dev)
2. **Manage R2 API Tokens** → create token with Object Read & Write
3. Set in `.env`:
   - `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `S3_BUCKET=dadan-assets-dev`
   - `S3_ACCESS_KEY` / `S3_SECRET_KEY` from the token
   - `S3_REGION=auto`

Production uses bucket `dadan-assets` with the same env var pattern.
