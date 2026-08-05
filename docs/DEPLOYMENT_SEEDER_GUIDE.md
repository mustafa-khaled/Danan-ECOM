# Production Seeder — Deployment & Verification Guide

This guide guarantees the single-source-of-truth seeder produces **exactly the same
result on the production server** as it does locally: 4 collections / 8 designs /
16 pieces, 27 AVIF assets uploaded, deterministic and idempotent.

The seeder is **destructive** (wipes the whole DB + uploads directory and rebuilds
the canonical dataset). Only run it when you intend a full reset (fresh launch,
restaging demo data). Never run it against a database holding real records.

---

## 0. Why "works the same" is not automatic

Three things make the production seeder behave differently from local if skipped:

1. **The seed images must be inside the API image.** `apps/api/Dockerfile` bakes
   `apps/web/public/seeder-assets → /app/seeder-assets`. The seeder refuses to
   run if a referenced file is missing (`validateSeedAssets()` throws).
2. **The uploads volume must be writable by uid 1001.** The API container runs as
   the `nestjs` user (uid 1001); `removeAll()` + uploads write to
   `/opt/dadan/data/uploads` (bind-mounted at `/app/uploads`). Wrong ownership →
   permission errors during the wipe.
3. **All seeder code must actually be on `main`.** Multiple files are currently
   uncommitted (see §1). `git pull` on the server only fetches what is pushed.

---

## 1. Pre-flight — local git hygiene (BLOCKER, do this first)

Check that everything the seeder needs is committed and pushed to `main`:

```bash
cd /path/to/Danan-main
git status --short
```

Must be **committed** (currently uncommitted as of this writing):

| File                                                                               | Why it matters                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/web/public/seeder-assets/*.avif` (all 27, incl. untracked `product-23.avif`) | Missing → seeder validation fails; modified ones ship old images |
| `packages/db/prisma/seed-data.ts` (untracked)                                      | The canonical dataset                                            |
| `packages/db/prisma/seed.ts` / `seed-assets.ts`                                    | The seeder logic                                                 |
| `scripts/seed-production.sh` (untracked)                                           | Production entry point                                           |
| `packages/storage/src/**` (`removeAll`, AVIF mime)                                 | Wipe + upload behaviour                                          |
| `apps/api/src/storage/uploads.controller.ts`                                       | Cache-control fix (seed = revalidate)                            |
| `apps/api/Dockerfile`                                                              | `COPY seeder-assets` into the image                              |
| `packages/db/package.json`, `pnpm-lock.yaml`                                       | `sharp`, `tsx`, `prisma` in image                                |
| `.env.example`, `docs/*`, `README.md`                                              | Documentation (not functional)                                   |

Confirm the asset set on `main` is complete (run after pushing, on the server):

```bash
git ls-files apps/web/public/seeder-assets | wc -l          # expect: 27
git ls-files apps/web/public/seeder-assets/product-23.avif  # expect: non-empty
git status --short -- apps/web/public/seeder-assets         # expect: empty
```

Local sanity run before pushing (already verified, re-run if anything changed):

```bash
pnpm --filter @dadan/db db:seed:reset        # 27 uploaded, summary matches
pnpm --filter @dadan/db db:seed              # idempotent re-run, same counts
pnpm --filter @dadan/api test:e2e            # 28/28
pnpm --filter @dadan/api lint && pnpm --filter @dadan/api typecheck
```

---

## 2. Server pre-flight

```bash
cd /opt/dadan
git status                                # expect: clean
git pull origin main
git ls-files apps/web/public/seeder-assets | wc -l    # expect: 27
```

Check required env vars exist in `/opt/dadan/.env` (compose has `:?` guards, but
fail fast here):

```bash
grep -qE '^POSTGRES_PASSWORD=' .env && echo ok
grep -qE '^JWT_SECRET=' .env && echo ok
grep -qE '^CERT_SIGNING_SECRET=' .env && echo ok
grep -qE '^BASE_URL=' .env && echo ok
grep -qE '^WEB_ORIGIN=' .env && echo ok
```

Disk space (build + ~50 MB of AVIFs + LQIP blobs):

```bash
df -h /opt/dadan
docker compose version                    # Compose v2
```

---

## 3. Deploy sequence

```bash
# 1. Update code + images
cd /opt/dadan
git pull origin main

# 2. Make the uploads volume writable by the container user (uid 1001)
sudo chown -R 1001:1001 /opt/dadan/data/uploads/

# 3. Tear down running containers
docker compose -f docker-compose.prod.yml down

# 4. Rebuild images (bakes the new seeder-assets + seeder code) and start
docker compose -f docker-compose.prod.yml up -d --build
```

Wait until every service is healthy (the api entrypoint runs
`prisma migrate deploy` first, so tables exist before seeding):

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec api wget -q --spider http://localhost:4000/health && echo api-healthy
```

### 3.5 Seed the catalog — THE STEP MISSING FROM A NORMAL DEPLOY

The seeder does **not** run automatically. Run it once, explicitly:

```bash
cd /opt/dadan
scripts/seed-production.sh --force
```

Expected summary (must match exactly):

```
Assets: 27 uploaded
  Admins:       3 created
  Clients:      3 created
  Collections:  4 created
  Designs:      8 created
  Pieces:       16 created
  Certificates: 4 created
  Orders:       3 created
  Saved Pieces: 6 created
  Cart Items:   1 created
  Transfers:    1 created
```

---

## 4. Post-seed verification

### 4.1 Uploads (container side)

```bash
docker compose -f docker-compose.prod.yml exec -T api sh -c \
  'find /app/uploads -type f | wc -l'                    # expect: 27
docker compose -f docker-compose.prod.yml exec -T api sh -c \
  'find /app/uploads -type f -not -name "*.avif" | wc -l' # expect: 0
```

### 4.2 Database counts

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U dadan -d dadan -t -A -c "
SELECT 'collections', count(*) FROM \"Collection\"
UNION ALL SELECT 'designs', count(*) FROM \"Design\"
UNION ALL SELECT 'pieces', count(*) FROM \"Piece\"
UNION ALL SELECT 'clients', count(*) FROM \"Client\"
UNION ALL SELECT 'admins', count(*) FROM \"AdminUser\"
UNION ALL SELECT 'certificates', count(*) FROM \"Certificate\"
UNION ALL SELECT 'orders', count(*) FROM \"Order\"
UNION ALL SELECT 'saved', count(*) FROM \"SavedPiece\"
UNION ALL SELECT 'cart', count(*) FROM \"CartItem\"
UNION ALL SELECT 'transfers', count(*) FROM \"TransferRequest\"
UNION ALL SELECT 'lqip_collections', count(*) FROM \"Collection\"
  WHERE \"coverImageLqip\" LIKE 'data:image/webp;base64,%'
UNION ALL SELECT 'lqip_designs', count(*) FROM \"Design\"
  WHERE array_length(\"imageLqips\",1) >= 2;"
```

Expect: `collections 4, designs 8, pieces 16, clients 3, admins 3,
certificates 4, orders 3, saved 6, cart 1, transfers 1, lqip_collections 4,
lqip_designs 8`.

### 4.3 HTTP layer (through nginx, public)

```bash
curl -sI https://<your-domain>/api/uploads/designs/seed/product-5.avif
# expect: 200 OK, Content-Type: image/avif,
#         Cache-Control: public, max-age=0, must-revalidate
```

Seed assets are served with `max-age=0, must-revalidate` so a re-seed always
propagates immediately. Real user uploads keep `immutable` for 1 year.

### 4.4 Idempotency

Run the seeder a **second** time and confirm the same result:

```bash
cd /opt/dadan && scripts/seed-production.sh --force
```

Same 27 uploads, same counts, no errors → deterministic production behaviour.

### 4.5 UI

Hard-refresh the browser (Cmd/Ctrl+Shift+R) on the public site and admin.
Confirm: 4 collection covers, 8 designs (2–3 images each), `product-23.avif`
showing in Noir Cascade Necklace gallery, `product-5` / `product-22` new content.

---

## 5. Troubleshooting

| Symptom                                    | Cause                                          | Fix                                                          |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------ |
| `Refusing to seed: environment=production` | Guard active; `SEED_ALLOW_PRODUCTION` not set  | Use `scripts/seed-production.sh --force` (sets it)           |
| `Missing seed assets (expected in ...)`    | File not baked into image                      | Rebuild api image; make sure all 27 files committed + pulled |
| `/app/seeder-assets not found`             | Stale api image                                | `docker compose build api`, then `up -d`                     |
| `EACCES` / permission denied on uploads    | Volume not owned by 1001                       | `sudo chown -R 1001:1001 /opt/dadan/data/uploads/`           |
| api not healthy → seed script error        | Migrations not applied / depends_on            | Wait for healthchecks; `docker compose logs api`             |
| Image 404 after seed                       | `removeAll()` wiped prior uploads, key changed | Re-seed; keys are deterministic `<entity>/seed/<file>`       |
| Old image still shown                      | Browser/optimizer cache                        | Hard refresh; seed paths now `must-revalidate`               |

---

## 6. Notes

- `db:seed` and `db:seed:reset` are equivalent now (the `--reset` flag is gone);
  both always do a full reset. `db:seed:reset` is kept for compatibility.
- The seed signs certificate tokens with `CERT_SIGNING_SECRET` and builds
  `qrCodeData` from `BASE_URL` — both come from compose `.env`, so verification
  links work in production.
- The seeder uses `bcrypt` (house keys/admin passwords) and `sharp` (LQIPs)
  inside the container; both are installed in the runner image.
- `POSTGRES_PASSWORD` and `JWT_SECRET` are **not** part of the seeder but are
  required by compose; the seed only needs `SEED_ALLOW_PRODUCTION`,
  `SEED_ASSETS_DIR`, `DATABASE_URL`, `CERT_SIGNING_SECRET`, `BASE_URL`,
  `HOUSE_KEY_SALT` (default 12), and optional `SEED_ADMIN_PASSWORD`.
