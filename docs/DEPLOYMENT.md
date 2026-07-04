# DADAN Dijital — Single-Server Deployment Guide

This guide walks through deploying the entire DADAN platform (API + web app + database + Redis + reverse proxy) on **one Linux server** using Docker Compose. Every command is meant to be copy-pasteable from a root or `deploy` user shell.

**What runs on the server after this guide:**

| Container  | Image / build                    | Purpose                                          | Port (internal) |
| ---------- | -------------------------------- | ------------------------------------------------ | --------------- |
| `nginx`    | nginx:1.27-alpine                | Public entry point, reverse proxy, rate limiting | 80 (published)  |
| `web`      | built from `apps/web/Dockerfile` | Next.js app (client + `/admin`)                  | 3000            |
| `api`      | built from `apps/api/Dockerfile` | NestJS API, runs DB migrations on start          | 4000            |
| `postgres` | postgres:16-alpine               | Database                                         | 5432            |
| `redis`    | redis:7-alpine                   | Rate limits, JWT deny-list                       | 6379            |

Only nginx is exposed to the internet. Routing: `/` and `/admin` go to the web app; `/api/*` is proxied to the API (with the `/api` prefix stripped).

**External dependency (not on the server):** a Cloudflare R2 bucket for images and certificate PDFs. This is mandatory — the API will not start without valid `S3_*` credentials.

---

## 1. Server preparation

### 1.1 Minimum requirements

- **2 vCPU, 4 GB RAM, 40 GB SSD**
- **Ubuntu 22.04 or 24.04 LTS**
- Root or sudo access
- A non-root user with SSH key access (recommended name: `deploy`)

### 1.2 Create a deploy user (if you only have root)

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Log out and back in as `deploy`.

### 1.3 Install Docker Engine + Compose plugin

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Log out and back in, then verify:

```bash
docker --version
docker compose version
```

### 1.4 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp        # only if terminating TLS on the server (section 5B)
sudo ufw enable
sudo ufw status
```

Do **not** open 3000, 4000, 5432, or 6379 — those stay internal to the Docker network.

### 1.5 Basic hardening

```bash
# Automatic security updates
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Disable SSH password login (make sure your key works first!)
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Reduce swappiness for Docker
sudo sysctl -w vm.swappiness=10
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
```

---

## 2. Cloudflare R2 bucket (required)

1. In the Cloudflare dashboard go to **R2 Object Storage → Create bucket**. Name it e.g. `dadan-assets-prod`. Leave it **private** (the API serves files via short-lived presigned URLs).
2. Go to **R2 → Manage R2 API Tokens → Create API Token**:
   - Permission: **Object Read & Write**
   - Scope: only the `dadan-assets-prod` bucket
3. Note down:
   - **Access Key ID** → `S3_ACCESS_KEY`
   - **Secret Access Key** → `S3_SECRET_KEY`
   - **Endpoint** (shown on the bucket page, looks like `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`) → `S3_ENDPOINT`

---

## 3. Clone the repository

```bash
cd ~
git clone <YOUR_REPO_URL> danan
cd danan
```

For later updates you will use `./deploy.sh` from this directory (section 7).

---

## 4. Environment variables

The production compose file (`docker-compose.prod.yml`) reads variables from a `.env` file in the repo root.

### 4.1 Generate secrets

```bash
cd ~/danan
openssl rand -hex 24        # -> POSTGRES_PASSWORD
openssl rand -base64 48     # -> JWT_SECRET
openssl rand -base64 32     # -> CERT_SIGNING_SECRET
```

### 4.2 Create `.env`

```bash
touch .env
chmod 600 .env    # only your user can read it
nano .env
```

Paste the following template, replacing each `<...>` with the generated values and your real configuration:

```bash
# ---------- Database ----------
POSTGRES_PASSWORD=<output of openssl rand -hex 24>

# ---------- Secrets ----------
JWT_SECRET=<output of openssl rand -base64 48>
CERT_SIGNING_SECRET=<output of openssl rand -base64 32>
HOUSE_KEY_SALT=12
CLIENT_SESSION_DAYS=7

# ---------- Public URLs ----------
# Set BOTH to the exact public origin users will visit.
BASE_URL=https://dadan.example.com
WEB_ORIGIN=https://dadan.example.com

# ---------- Cookies ----------
COOKIE_SECURE=true

# ---------- Cloudflare R2 (from section 2) ----------
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET=dadan-assets-prod
S3_ACCESS_KEY=<r2 access key id>
S3_SECRET_KEY=<r2 secret access key>
S3_REGION=auto

# ---------- Payments ----------
PAYMENT_PROVIDER_KEY=sk_live_...
PAYMENT_PROVIDER_SECRET=whsec_...
VAT_RATE=0.15
NEXT_PUBLIC_PAYMENT_MODE=mock

# ---------- Email (optional; leave empty to log instead) ----------
ADMIN_EMAIL=admin@dadan.sa
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# ---------- Misc ----------
PDF_WATERMARK_TEXT=DADAN DIJITAL — AUTHENTICATED
HTTP_PORT=80
REDIS_PASSWORD=
```

**Important notes:**
- `NEXT_PUBLIC_API_URL` is **not** set here — `docker-compose.prod.yml` passes `/api` as a build argument automatically.
- `DATABASE_URL` and `REDIS_URL` are also **not** needed — the compose file wires internal container names.
- Store a copy of this `.env` in a password manager. Losing `CERT_SIGNING_SECRET` invalidates every certificate QR token.

---

## 5. First deployment

### 5.1 Build and start everything

```bash
cd ~/danan
docker compose -f docker-compose.prod.yml up -d --build
```

The first build takes several minutes (installs dependencies, compiles both apps). What happens on startup:

1. `postgres` and `redis` start and pass their health checks.
2. `api` starts; its entrypoint runs `prisma migrate deploy` (applies all DB migrations), then boots the NestJS server.
3. `web` starts once the API is healthy.
4. `nginx` starts once both apps are healthy and begins serving on port 80.

### 5.2 Verify

```bash
# All five containers should be "running (healthy)"
docker compose -f docker-compose.prod.yml ps

# API health through nginx (checks DB + Redis)
curl -s http://localhost/api/health | python3 -m json.tool

# Web app responds
curl -sI http://localhost | head -3
```

If something is unhealthy, check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f nginx
```

### 5.3 Create the first SUPER_ADMIN

**Never run `pnpm db:seed` against production** — it creates demo data with well-known passwords. Instead, create your real admin directly:

```bash
docker compose -f docker-compose.prod.yml exec \
  -e NEW_ADMIN_EMAIL='you@yourcompany.com' \
  -e NEW_ADMIN_NAME='Your Name' \
  -e NEW_ADMIN_PASSWORD='choose-a-strong-password' \
  api node -e '
const bcrypt = require("bcrypt");
const { prisma } = require("@dadan/db");
(async () => {
  const hash = await bcrypt.hash(process.env.NEW_ADMIN_PASSWORD, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: process.env.NEW_ADMIN_EMAIL },
    update: { passwordHash: hash, isActive: true },
    create: {
      email: process.env.NEW_ADMIN_EMAIL,
      passwordHash: hash,
      displayName: process.env.NEW_ADMIN_NAME,
      role: "SUPER_ADMIN",
    },
  });
  console.log("SUPER_ADMIN ready:", admin.email);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });'
```

Then log in at `https://your-domain/admin/login`. Clear shell history afterwards if you typed the password inline: `history -c`.

---

## 6. Making it reachable: domain / TLS options

Pick **one** of the three options below.

### 6A — Domain behind Cloudflare (recommended, easiest TLS)

Since you already use Cloudflare for R2, this is the least work:

1. Add a DNS **A record** for your domain/subdomain pointing to the server IP, with the **orange cloud (proxied)** enabled.
2. In Cloudflare **SSL/TLS** settings choose **"Full"** (strict). This requires an origin certificate:
   - Cloudflare dashboard → **SSL/TLS → Origin Server → Create Certificate**.
   - Save the certificate and private key to the server (e.g. `/etc/ssl/cloudflare/`).
   - Follow the TLS nginx setup in section 6B using these files instead of Let's Encrypt.
3. `.env` settings:
   ```
   BASE_URL=https://your-domain
   WEB_ORIGIN=https://your-domain
   COOKIE_SECURE=true
   ```
4. Rebuild and restart (section 7).

### 6B — Domain with Let's Encrypt on the server

Use this if the domain points **directly** at the server (grey cloud / no Cloudflare proxy).

1. Point your DNS at the server IP and wait for propagation: `dig +short your-domain`.
2. Get a certificate:

   ```bash
   sudo apt install -y certbot
   docker compose -f docker-compose.prod.yml stop nginx
   sudo certbot certonly --standalone -d your-domain --agree-tos -m you@yourcompany.com
   ```

   Certificates land in `/etc/letsencrypt/live/your-domain/`.

3. Create `nginx/nginx-tls.conf` — a copy of `nginx/nginx.conf` with a TLS server block on port 443. See the template in `docs/DEPLOYMENT_LE.md` or copy from the existing `nginx/nginx.conf` and add a `listen 443 ssl;` server block.

4. Create `docker-compose.tls.yml` in the repo root:

   ```yaml
   services:
     nginx:
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/nginx-tls.conf:/etc/nginx/nginx.conf:ro
         - /etc/letsencrypt:/etc/letsencrypt:ro
       healthcheck:
         test:
           - "CMD"
           - "wget"
           - "-q"
           - "--spider"
           - "--no-check-certificate"
           - "https://localhost/api/health/live"
   ```

5. Start with both files (use this pair for every compose command from now on):

   ```bash
   docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d
   ```

6. Auto-renewal hooks:

   ```bash
   sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null <<'EOF'
   #!/bin/sh
   cd /home/deploy/danan && docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml restart nginx
   EOF
   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

   sudo tee /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh > /dev/null <<'EOF'
   #!/bin/sh
   cd /home/deploy/danan && docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml stop nginx
   EOF
   sudo tee /etc/letsencrypt/renewal-hooks/post/start-nginx.sh > /dev/null <<'EOF'
   #!/bin/sh
   cd /home/deploy/danan && docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml start nginx
   EOF
   sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh /etc/letsencrypt/renewal-hooks/post/start-nginx.sh
   ```

7. Test renewal: `sudo certbot renew --dry-run`.

### 6C — IP only, plain HTTP (temporary / testing)

Works out of the box with the stock `docker-compose.prod.yml`. `.env` settings:

```
BASE_URL=http://<SERVER_IP>
WEB_ORIGIN=http://<SERVER_IP>
COOKIE_SECURE=false
```

**Risks:** Sessions, House Keys, and admin passwords travel unencrypted. Do not onboard real clients until TLS is on. Certificate QR links embed the IP-based URL and will need regeneration if you later move to a domain.

---

## 7. Updating / redeploying

Use `deploy.sh` for a single-command deploy with automatic rollback:

```bash
cd ~/danan

# Standard deploy (pulls, builds, restarts, verifies health)
./deploy.sh

# With TLS compose override
./deploy.sh -t

# Skip pre-deploy backup (faster for quick fixes)
./deploy.sh -s

# Dry-run (show what would happen)
./deploy.sh -d
```

**What `deploy.sh` does:**

| Step | Description |
|------|-------------|
| Pre-flight | Checks git, docker, docker compose, clean working tree, valid compose files |
| State record | Saves current commit hash and container health snapshot |
| Pre-deploy backup | `pg_dump` → `pre-deploy-dadan-*.sql.gz` (skip with `-s`) |
| `git pull` | Fetches latest code. Idempotent — no-op if already at latest |
| Build | `docker compose build` (BuildKit cache reuse) |
| Restart | `docker compose up -d` (only recreates changed containers) |
| Health poll | Waits up to 120s per service: postgres → redis → api → web → nginx |
| On failure | Auto-rollback: `git checkout` previous commit → rebuild → restart → re-verify |
| Success | Prints coloured summary, prunes old Docker images |

### Manual rollback

```bash
git log --oneline -5
git checkout <good-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

**Database note:** Prisma migrations are forward-only. Rolling back code that depends on a newer schema usually still works (columns are additive), but check `packages/db/prisma/migrations/` before rolling back across a migration boundary. Worst case, restore the DB from a backup (section 8).

---

## 8. Backup

Two scripts at the repo root handle backup and restore. They require no external dependencies beyond bash/coreutils/gzip/docker and log every action.

### 8.1 Database — nightly `backup.sh`

```bash
mkdir -p ~/backups
crontab -e
```

Add:

```cron
# Nightly Postgres dump at 03:15, keep 14 days
15 3 * * * /home/deploy/danan/backup.sh -v >> /home/deploy/danan/cron.log 2>&1
```

**What `backup.sh` does:**
1. Validates Docker, docker compose, and the compose file exist.
2. Checks the `postgres` container is healthy before proceeding.
3. Runs `pg_dump --clean --if-exists` via `docker compose exec -T`, pipes through `gzip`, writes a timestamped file (`dadan-YYYY-MM-DD_HHMMSS.sql.gz`).
4. Validates the archive (`gunzip -t`).
5. Prunes backups older than the retention period (default 14 days; set with `-k`).
6. Logs everything to `~/backups/backup.log`.

Full usage:

```bash
./backup.sh                              # defaults: ~/backups, 14-day retention
./backup.sh -o /custom/path              # custom output directory
./backup.sh -f docker-compose.tls.yml    # alternate compose file
./backup.sh -k 30                        # keep 30 days
./backup.sh -v                           # verbose
```

### Off-site copies

Copy backups off the server regularly (e.g. `rclone` to R2):

```bash
# Example with rclone configured for R2:
# rclone copy ~/backups r2:dadan-backups/db
```

### 8.2 Restore

```bash
# List available backups (newest first)
./restore.sh

# Restore a specific backup
./restore.sh dadan-2026-07-04_031500.sql.gz
```

**Safety features:**
1. Validates the gzip archive with `gunzip -t` before touching the database.
2. Shows a summary (file size, creation date, target database) and requires typing `yes` to confirm.
3. **Automatically creates a pre-restore snapshot** (`pre-restore-dadan-*.sql.gz`) so you can roll back instantly.
4. After restore, queries `information_schema.tables` to verify the database has content.
5. If validation fails, prints the exact command to restore the pre-restore snapshot.

### 8.3 R2 assets

Cloudflare R2 already stores images and certificate PDFs redundantly. Certificate PDFs can be regenerated from the DB at any time, so DB backups are the critical piece.

### 8.4 `.env` file

Keep an encrypted copy of `.env` in a password manager. Losing `CERT_SIGNING_SECRET` invalidates every issued certificate QR token; losing `JWT_SECRET` logs everyone out until a new one is set.

---

## 9. Scaling

The current architecture is single-server Docker Compose. It is not designed for horizontal scaling out of the box, but you can optimise within these limits.

### 9.1 Vertical scaling (upgrading the server)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |

### 9.2 Tuning resource limits

Resource limits per service are set in `docker-compose.prod.yml`. If you hit memory limits (container restarts with code 137), increase `mem_limit` for the affected service:

```yaml
api:
  mem_limit: 1g      # default: 512m
  mem_reservation: 256m
  cpus: "2.0"        # default: "1.0"
```

### 9.3 Connection pooling

The API connects to PostgreSQL directly via Prisma. Under high load (50+ concurrent requests), Postgres may exhaust `max_connections`. To scale without changing the architecture:

- Increase `max_connections` in `postgres` configuration (via postgres image env or custom config).
- Add PgBouncer as a sidecar container — see `dokku/` or `pgbouncer` Docker image.

### 9.4 Redis

Redis usage is light (rate limiting, JWT deny-list). The default `256m` limit is sufficient for tens of thousands of rate-limit entries.

### 9.5 Monitoring for scaling decisions

Enable the monitoring stack (section 10) to track per-container CPU and memory usage over time. When any service consistently hits 80%+ of its `mem_limit` or `cpus`, increase its allocation.

### 9.6 When to consider multi-server

Signs that single-server is becoming a bottleneck:

- CPU or memory usage exceeds 80% consistently.
- Postgres query times degrade under load.
- Disk I/O latency increases (monitor with iostat).
- TLS termination + proxy + app + database on one machine causes resource contention.

At that point, consider: splitting Postgres/Redis to a separate server, adding a CDN for static assets, or migrating to a container orchestrator (Kubernetes, Nomad).

---

## 10. Observability

### 10.1 Always-on features (no setup required)

| Feature | Implementation |
|---------|---------------|
| Health endpoint | `GET /api/health` (Prisma + Redis) |
| Liveness probe | `GET /api/health/live` (lightweight) |
| Readiness probe | `GET /api/health/ready` (Prisma + Redis) |
| JSON access log (API) | `apps/api/src/common/logger/json-logger.service.ts` |
| Request ID tracing | `x-request-id` header on every response |
| JSON access log (nginx) | `log_format json` in `nginx/nginx.conf` |

### 10.2 Monitoring stack (optional)

Enable Prometheus + Grafana + Loki + cAdvisor + Promtail with a single flag:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
```

This adds:

| Service | Function | Port |
|---------|----------|------|
| cAdvisor | Container resource metrics | 8080 (internal) |
| Prometheus | Time-series database | 9090 (internal) |
| Loki | Log aggregation | 3100 (internal) |
| Promtail | Ships Docker logs to Loki | — |
| Grafana | Dashboards (metrics + logs) | 3001 (localhost only) |

Access Grafana via SSH tunnel: `ssh -L 3001:localhost:3001 deploy@your-server`. Default login: `admin` / `admin`.

Full details in [MONITORING.md](MONITORING.md).

---

## 11. Operations cheat sheet

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs (all / one service)
docker compose -f docker-compose.prod.yml logs -f --tail=100
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service
docker compose -f docker-compose.prod.yml restart api

# Shell into a container
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U dadan dadan
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Disk usage
docker system df
docker image prune -f

# Full rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## 12. Troubleshooting

### 12.1 Container states and what they mean

```
$ docker compose ps
NAME                STATUS
dadan-postgres-1    Up 3 days (healthy)
dadan-redis-1       Up 3 days (healthy)
dadan-api-1         Up 2 days (healthy)
dadan-web-1         Up 2 days (healthy)
dadan-nginx-1       Up 2 days (healthy)
```

| STATUS | Meaning |
|--------|---------|
| `Up (healthy)` | Running and passing health checks |
| `Up (unhealthy)` | Running but failing health checks (usually a dep is down) |
| `Restarting` | Docker restart policy triggered (crash loop) |
| `Exited (1)` | Container exited with error — check logs |

### 12.2 Symptom → cause → fix

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `api` restarting, logs show `Environment validation failed` | Missing/invalid `.env` var | Fix `.env`, then `docker compose up -d api` |
| `api` unhealthy, logs show Prisma `P1001` | Postgres not ready or wrong `POSTGRES_PASSWORD` after volume re-create | Keep the original password or reset the volume (`docker compose down -v` — **destroys data**) |
| Login works but you're logged out immediately | `COOKIE_SECURE=true` over plain HTTP | Set `COOKIE_SECURE=false` (HTTP) or enable TLS |
| Browser API calls fail with CORS errors | `WEB_ORIGIN`/`BASE_URL` don't match the URL in the address bar | Correct them in `.env`, restart `api` |
| All API requests 404 through nginx | Web built with wrong `NEXT_PUBLIC_API_URL` | Must be `/api` in production (compose passes it automatically); rebuild `web` |
| Images/certificates fail to load | Bad R2 credentials or bucket name | Check `S3_*` vars; `docker compose logs api \| grep -i s3` |
| `nginx` unhealthy | API not healthy (healthcheck goes through `/api/health/live`) | Fix the API first; nginx recovers automatically |
| `429 Too Many Requests` | nginx rate limits (20 r/s API, 60 r/s general) | Adjust `nginx/nginx.conf` zones if legitimate traffic is hitting limits |
| Emails not arriving | SMTP vars empty | Fill `SMTP_*` in `.env`, restart `api` |
| Container exits with code 137 | Out of memory (OOM killed) | Increase `mem_limit` for that service in compose |
| Disk filling up | Old Docker build layers or backups | `docker image prune -f`; check backup retention (`-k` flag) |
| `api` slow after running for days | Memory leak or Postgres query degradation | Restart the API: `docker compose restart api`; if recurring, profile with Grafana (section 10) |

### 12.3 Emergency commands

```bash
# Restart everything
docker compose -f docker-compose.prod.yml restart

# Stop everything (preserves volumes)
docker compose -f docker-compose.prod.yml down

# Stop everything and delete volumes (DATA LOSS — only for fresh start)
docker compose -f docker-compose.prod.yml down -v

# Reset a single service (rebuild from scratch)
docker compose -f docker-compose.prod.yml rm -fs api
docker compose -f docker-compose.prod.yml up -d --build api

# Inspect environment variables in a running container
docker compose -f docker-compose.prod.yml exec api env | grep -E 'JWT|S3|POSTGRES'
```

---

## 13. Disaster recovery

### 13.1 Recovery tiers

| Tier | RPO (data loss) | RTO (downtime) | How |
|------|-----------------|----------------|-----|
| Nightly backup | Up to 24 hours | ~30 minutes | `./restore.sh` from `~/backups` |
| Pre-deploy backup | ~5 minutes | ~30 minutes | `./restore.sh` from `pre-deploy-*.sql.gz` |
| Full server rebuild | Up to 24 hours | ~2 hours | Re-provision server + restore from off-site copy |

### 13.2 Full server failure

If the server is completely lost (disk failure, ransomware, provider termination):

1. Provision a new Ubuntu server (section 1).
2. Install Docker (section 1.3).
3. Clone the repository (section 3), checkout the same commit.
4. Create `.env` with the same secrets (from your password manager backup).
5. Restore the latest database dump:

   ```bash
   # If off-site copy exists (e.g. R2):
   rclone copy r2:dadan-backups/db/dadan-2026-07-04_031500.sql.gz ~/backups/

   # Restore
   cd ~/danan
   docker compose -f docker-compose.prod.yml up -d postgres redis
   ./restore.sh ~/backups/dadan-2026-07-04_031500.sql.gz
   ```

6. Start everything:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### 13.3 Database corruption

1. Stop all services that depend on the database:

   ```bash
   docker compose -f docker-compose.prod.yml stop api web nginx
   ```

2. Restore from the most recent known-good backup:

   ```bash
   ./restore.sh dadan-2026-07-04_031500.sql.gz
   ```

3. Start everything again:

   ```bash
   docker compose -f docker-compose.prod.yml start
   ```

### 13.4 Accidental `.env` deletion

Your `.env` should be backed up in a password manager. If lost and no backup exists:

1. Generate new secrets (section 4.1).
2. Update `.env` with the new secrets.
3. If `POSTGRES_PASSWORD` changed, the postgres volume will reject the new password. Either:
   - Reset the volume: `docker compose down -v && docker compose up -d --build` (**destroys all data**), then restore from backup (section 13.3).
   - Or recover the old password from the running container: `docker compose exec postgres env | grep POSTGRES_PASSWORD`.

### 13.5 Failed deployment (migration incompatibility)

Prisma migrations are forward-only. If a deployment applies a migration and the new code fails health checks, `deploy.sh` rolls back the code automatically. However, the database schema remains on the newer version.

**If the rollback code is incompatible with the new schema:**

1. Verify the API logs: `docker compose logs api --tail=50`.
2. If the API fails due to schema mismatch, restore the pre-deploy backup that `deploy.sh` created automatically:

   ```bash
   ./restore.sh pre-deploy-dadan-2026-07-04_121500.sql.gz
   ```

3. Re-deploy after fixing the issue.

### 13.6 Monitoring for early warning

Enable the monitoring stack (section 10) to detect anomalies before they become disasters:

- Grafana alerts for disk usage >80%.
- Container restart counters in cAdvisor.
- API error rate spikes in Loki (query: `{container_name=~".*api.*"} |= "error"`).

---

## 14. Production go-live checklist

### Environment & secrets

- [ ] `.env` uses freshly generated secrets (never the dev/example values), `chmod 600`
- [ ] `POSTGRES_PASSWORD`, `JWT_SECRET`, `CERT_SIGNING_SECRET` are strong and unique
- [ ] `.env` is backed up in a password manager
- [ ] `COOKIE_SECURE=true` and site served over HTTPS (section 6A or 6B)
- [ ] `BASE_URL` and `WEB_ORIGIN` match the public URL exactly (scheme, host, port)

### Infrastructure

- [ ] Firewall: only 22/80/443 open (section 1.4)
- [ ] SSH password login disabled (section 1.5)
- [ ] Automatic security updates configured (section 1.5)
- [ ] Docker installed and `deploy` user can run `docker compose` without sudo

### Application

- [ ] Dev seed **not** run against production
- [ ] REAL SUPER_ADMIN created via section 5.3 (not the seed admin)
- [ ] Stripe key is a real `sk_live_*` key (not test key) — note the web checkout still uses the mock flow until Stripe Elements is integrated
- [ ] Staff / viewer accounts created with least privilege

### TLS (pick one)

- [ ] **Option A** (Cloudflare): DNS proxied, origin certificate installed, SSL/TLS set to Full
- [ ] **Option B** (Let's Encrypt): Certificate obtained, auto-renewal hooks installed, `certbot renew --dry-run` passes
- [ ] **Option C** (IP only): Understood that this is temporary and insecure

### Backup & recovery

- [ ] Nightly DB backup cron installed (section 8.1)
- [ ] Backup retention policy confirmed (default 14 days)
- [ ] Off-site copy configured (e.g. `rclone` to R2)
- [ ] A restore has been **tested once** (run `./restore.sh` with a recent backup on a staging server or locally)
- [ ] Team knows how to do a full server rebuild (section 13.2)

### Verification

- [ ] `docker compose ps` shows all 5 services healthy
- [ ] `curl http://localhost/api/health` returns `{"status":"ok",...}` from the server
- [ ] `curl -sI http://localhost` returns `HTTP/1.1 200` or `302`
- [ ] Admin login works at `https://your-domain/admin/login`
- [ ] Client-facing pages load without errors
- [ ] Certificate verification flow works (scan QR code)

### Ongoing operations

- [ ] `./deploy.sh` tested from the project directory
- [ ] Monitoring stack evaluated for production use (section 10.2)
- [ ] Resource limits reviewed (section 9.2)
- [ ] Team has access to server logs (`docker compose logs`) and knows common troubleshooting steps (section 12)
