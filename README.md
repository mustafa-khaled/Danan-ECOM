# DADAN Dijital

Closed, invitation-only luxury digital jewelry ownership platform.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Docker & Docker Compose (no external object storage required)

## Local setup

```bash
pnpm install
cp .env.example .env
# Storage defaults to local filesystem (/app/uploads) — no config needed
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Services

| Service              | URL                               |
| -------------------- | --------------------------------- |
| Web (client + admin) | http://localhost:3000             |
| Admin dashboard      | http://localhost:3000/admin/login |
| API                  | http://localhost:4000             |
| API health           | http://localhost:4000/health      |
| PostgreSQL           | localhost:5433                    |
| Redis                | localhost:6379                    |

Uploads are stored **locally** at `/app/uploads` (mounted from `./uploads` in dev, `/opt/dadan/data/uploads` in production). No external object storage is required. Set `STORAGE_PROVIDER=s3` + `S3_*` vars to switch to S3-compatible storage.

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
  storage/  Local / S3-compatible storage (Strategy Pattern)
  config/   ESLint, Prettier, TypeScript configs
```

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm dev`         | Start all apps in dev mode  |
| `pnpm build`       | Build all apps and packages |
| `pnpm lint`        | Lint all workspaces         |
| `pnpm typecheck`   | Type-check all workspaces   |
| `pnpm test`        | Run tests                   |
| `pnpm db:generate` | Generate Prisma client      |
| `pnpm db:migrate`  | Run Prisma migrations (dev) |

## Storage setup

Storage is provider-agnostic and configured via environment variables.

### Local (default)

No configuration needed. Files are stored at `/app/uploads` inside the API container.

```env
STORAGE_PROVIDER=local
```

### S3-compatible (Cloudflare R2, AWS S3, Hetzner)

```env
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET=dadan-assets-dev
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=auto
```
