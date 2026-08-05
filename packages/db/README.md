# @dadan/db

Shared Prisma client and database schema for DADAN Dijital.

## Setup

From repo root:

```bash
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm --filter @dadan/db db:seed
```

## Scripts

| Command                           | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `pnpm db:generate`                | Generate Prisma client to `generated/client` |
| `pnpm db:migrate`                 | Run migrations (dev)                         |
| `pnpm --filter @dadan/db db:seed` | Full reset + seed canonical dataset          |

## Seeder

The seeder (`prisma/seed.ts`) is the single source of truth for all catalog
data. It wipes every table and the storage root, then deterministically
re-creates:

- 4 collections / 8 designs / 16 pieces (+ certificates, orders, transfers)
- Seed clients and admin accounts (credentials below)

Catalog images come exclusively from `apps/web/public/seeder-assets/`
(`collection-1..4.avif`, `product-1..22.avif`). The directory can be
overridden with `SEED_ASSETS_DIR`. Seeding is blocked in production unless
`SEED_ALLOW_PRODUCTION=true` (see `scripts/seed-production.sh`).

## Seed credentials (development only)

**House Keys:**

- `dadan-vip-key-001` — Amira Al-Rashid (vip)
- `dadan-key-002` — Khalid Al-Farsi
- `dadan-key-003` — Layla Al-Mutairi

**Admin:** `admin@dadan.sa` / `AdminPass123!`

## Schema notes

See [MODELS.md](MODELS.md) for the full entity relationship diagram and foreign-key reference.

- `Certificate.pdfUrl` stores S3 object keys, not public URLs.
- `OwnershipRecord` is append-only by convention.
- `TransferRequest` status moves forward only (enforced in API services).
