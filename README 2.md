# DADAN Dijital

Closed, invitation-only luxury digital jewelry ownership platform.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose

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

| Command                   | Description                 |
| ------------------------- | --------------------------- |
| `pnpm dev`                | Start all apps in dev mode  |
| `pnpm build`              | Build all apps and packages |
| `pnpm lint`               | Lint all workspaces         |
| `pnpm typecheck`          | Type-check all workspaces   |
| `pnpm test`               | Run tests                   |
| `pnpm db:generate`        | Generate Prisma client      |
| `pnpm db:migrate`         | Run Prisma migrations (dev) |
| `pnpm db:seed`            | Seed the database           |
| `pnpm db:seed:reset`      | Reset and re-seed           |
| `pnpm seed:catalog`       | Seed catalog data           |
| `pnpm seed:catalog:reset` | Reset and re-seed catalog   |

## Database Seeding

### Development

```bash
pnpm db:seed          # Seed (idempotent, safe to re-run)
pnpm db:seed:reset    # Clear all data and re-seed from scratch
```

### Server / Staging

```bash
scripts/seed-catalog.sh                          # Default (development)
scripts/seed-catalog.sh --environment=staging     # Staging
scripts/seed-catalog.sh --reset                   # Reset seed data
scripts/seed-catalog.sh --migrate                 # Run migrations first
```

### Production

Seeding in production is blocked by default. To override:

```bash
scripts/seed-catalog.sh --environment=production --force
```

### How images are resolved

Seed images are sourced from `apps/web/public/products/` (W7-W18) and `apps/web/public/collections/` (W24-W29). During seeding, they are uploaded to the configured storage provider (local by default at `/app/uploads`). The database stores storage keys (e.g., `designs/seed/W7.png`), and the API resolves them to public URLs at response time via `/api/uploads/{key}`.

### Troubleshooting

- **"Refusing to seed: environment=production"** — Set `SEED_ALLOW_PRODUCTION=true` or use `--force`
- **Missing source images** — Ensure `apps/web/public/products/` and `apps/web/public/collections/` contain the W-prefixed PNGs
- **Database connection errors** — Verify `DATABASE_URL` in `.env` and that PostgreSQL is running
- **Storage errors** — Verify `STORAGE_PROVIDER` and `STORAGE_LOCAL_PATH` in `.env`

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
