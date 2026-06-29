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

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client to `generated/client` |
| `pnpm db:migrate` | Run migrations (dev) |
| `pnpm --filter @dadan/db db:seed` | Seed dev data |

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
