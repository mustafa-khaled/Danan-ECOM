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

The seeder is the single source of truth for the DADAN catalog. It wipes the
database and uploads directory, then rebuilds a deterministic dataset
(4 collections, 8 designs, 16 pieces, demo clients/admins). Both commands below
produce the exact same result, so re-running is always safe.

### Development

```bash
pnpm db:seed          # Full reset + re-seed (idempotent)
pnpm db:seed:reset    # Same as above (kept for compatibility)
```

### Server / Staging

```bash
scripts/seed-catalog.sh                          # Default (development)
scripts/seed-catalog.sh --environment=staging     # Staging
scripts/seed-catalog.sh --migrate                 # Run migrations first
```

### Production

Seeding wipes the database and uploads, and is blocked in production unless
explicitly allowed. To seed the production catalog from the `api` container:

```bash
scripts/seed-production.sh --force
```

### How images are resolved

Seed images come exclusively from `apps/web/public/seeder-assets/`
(`collection-1..4.avif` covers + `product-1..22.avif` design images, 26 files
total). The seeder validates that every referenced file exists, wipes the
storage root, and uploads exactly those files under deterministic
`collections/seed/` and `designs/seed/` keys. It also generates base64 webp
LQIPs for blur-up loading. The database stores storage keys (e.g.,
`designs/seed/product-1.avif`), and the API resolves them to public URLs at
response time via `/api/uploads/{key}`.

### Troubleshooting

- **"Refusing to seed: environment=production"** — Set `SEED_ALLOW_PRODUCTION=true` or use `--force` (`scripts/seed-production.sh`)
- **"Missing seed assets"** — Ensure `apps/web/public/seeder-assets/` contains all 26 files; override the directory with `SEED_ASSETS_DIR`
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
