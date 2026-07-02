# DADAN Dijital — Single-Server Deployment Guide

This guide walks through deploying the entire DADAN platform (API + web app + database + Redis + reverse proxy) on **one Linux server** using Docker Compose. Every command is meant to be copy-pasteable.

**What runs on the server after this guide:**

| Container  | Image / build                    | Purpose                                          | Port (internal) |
| ---------- | -------------------------------- | ------------------------------------------------ | --------------- |
| `nginx`    | nginx:1.27-alpine                | Public entry point, reverse proxy, rate limiting | 80 (published)  |
| `web`      | built from `apps/web/Dockerfile` | Next.js app (client + `/admin`)                  | 3000            |
| `api`      | built from `apps/api/Dockerfile` | NestJS API (runs DB migrations on start)         | 4000            |
| `postgres` | postgres:16-alpine               | Database                                         | 5432            |
| `redis`    | redis:7-alpine                   | Rate limits, JWT deny-list                       | 6379            |

Only nginx is exposed to the internet. Routing: `/` and `/admin` go to the web app; `/api/*` is proxied to the API (with the `/api` prefix stripped).

**External dependency (not on the server):** a Cloudflare R2 bucket for images and certificate PDFs. This is mandatory — the API will not start without valid `S3_*` credentials.

---

## 1. Server prerequisites

Minimum recommended: **2 vCPU, 4 GB RAM, 40 GB SSD**, Ubuntu 22.04/24.04 LTS.

### 1.1 Create a non-root user (if you only have root)

```bash
adduser deploy
usermod -aG sudo deploy
# Copy your SSH key so you can log in as deploy:
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Log out and back in as `deploy`.

### 1.2 Install Docker Engine + Compose plugin

```bash
# Official Docker install script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Let your user run docker without sudo (log out/in afterwards)
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

### 1.3 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp    # only needed if you terminate TLS on the server (section 6B)
sudo ufw enable
sudo ufw status
```

Do **not** open 3000, 4000, 5432, or 6379 — those stay internal to the Docker network.

### 1.4 Basic hardening (recommended)

```bash
# Automatic security updates
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Disable SSH password login (make sure your key works first!)
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
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

## 3. Get the code onto the server

```bash
cd ~
git clone <YOUR_REPO_URL> danan
cd danan
```

For later updates you will `git pull` in this directory and rebuild (section 8).

---

## 4. Create the production `.env`

The production compose file (`docker-compose.prod.yml`) reads variables from a `.env` file in the repo root. Create it:

```bash
cd ~/danan
touch .env
chmod 600 .env    # only your user can read it
nano .env
```

### 4.1 Generate the secrets first

Run these and paste the output into the file below:

```bash
openssl rand -hex 24        # -> POSTGRES_PASSWORD
openssl rand -base64 48     # -> JWT_SECRET
openssl rand -base64 32     # -> CERT_SIGNING_SECRET
```

### 4.2 Production `.env` template

```bash
# ---------- Database ----------
# Password for the Postgres container. DATABASE_URL is assembled automatically
# inside docker-compose.prod.yml - you only set the password here.
POSTGRES_PASSWORD=<output of openssl rand -hex 24>

# ---------- Secrets ----------
JWT_SECRET=<output of openssl rand -base64 48>
CERT_SIGNING_SECRET=<output of openssl rand -base64 32>
HOUSE_KEY_SALT=12
CLIENT_SESSION_DAYS=7

# ---------- Public URLs ----------
# Set BOTH to the exact public origin users will visit.
# With a domain + HTTPS:            https://dadan.example.com
# IP-only (section 6C):             http://203.0.113.10
BASE_URL=https://dadan.example.com
WEB_ORIGIN=https://dadan.example.com

# ---------- Cookies ----------
# true when the site is served over HTTPS (sections 6A/6B).
# MUST be false for IP-only plain HTTP (section 6C), otherwise login breaks.
COOKIE_SECURE=true

# ---------- Cloudflare R2 (from section 2) ----------
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET=dadan-assets-prod
S3_ACCESS_KEY=<r2 access key id>
S3_SECRET_KEY=<r2 secret access key>
S3_REGION=auto

# ---------- Payments ----------
# Production REQUIRES a valid Stripe secret key (sk_live_* or sk_test_*).
# The API refuses to start in production without one.
PAYMENT_PROVIDER_KEY=sk_test_...
PAYMENT_PROVIDER_SECRET=whsec_...
VAT_RATE=0.15
# Keep "mock" until Stripe Elements is integrated in the web checkout;
# any other value disables the online checkout button with a notice.
NEXT_PUBLIC_PAYMENT_MODE=mock

# ---------- Email (optional; leave empty to log emails instead of sending) ----------
ADMIN_EMAIL=admin@dadan.sa
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# ---------- Misc ----------
PDF_WATERMARK_TEXT=DADAN DIJITAL — AUTHENTICATED
# Host port nginx binds to (leave 80 unless something else uses it)
HTTP_PORT=80
```

Notes:

- `NEXT_PUBLIC_API_URL` is **not** set here for production — `docker-compose.prod.yml` passes `/api` as a build argument automatically, matching the nginx route.
- `DATABASE_URL` and `REDIS_URL` are also **not** needed — the compose file wires the containers together internally.

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

### 5.3 Create the first SUPER_ADMIN (do NOT run the seed)

The dev seed (`pnpm db:seed`) creates demo clients with published keys and a well-known admin password — **never run it against production**. Instead, create your real admin directly:

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

Then log in at `https://your-domain/admin/login` and create clients, collections, designs, and pieces through the admin API. Clear the shell history afterwards if you typed the password inline: `history -c`.

---

## 6. Making it reachable: domain/TLS options

Pick **one** of the three options below.

### Option A — Domain behind Cloudflare (recommended, easiest TLS)

Since you already use Cloudflare for R2, this is the least work:

1. Add a DNS **A record** for your domain/subdomain pointing to the server IP, with the **orange cloud (proxied) enabled**.
2. In Cloudflare **SSL/TLS settings choose "Full"** (not "Flexible" — Flexible sends plain HTTP with `X-Forwarded-Proto: https` mismatches and can cause redirect loops). With "Full", install a Cloudflare **Origin Certificate** on the server (Cloudflare dashboard → SSL/TLS → Origin Server → Create Certificate) and follow Option B's nginx TLS setup using that certificate instead of Let's Encrypt — or use "Full (strict)" the same way.
   - Quick alternative: choose **"Flexible"** only if you cannot install a certificate; the repo's nginx already redirects `X-Forwarded-Proto: http` traffic to HTTPS. Be aware Flexible means Cloudflare→server traffic is unencrypted.
3. Set in `.env`: `BASE_URL`/`WEB_ORIGIN` to `https://your-domain`, `COOKIE_SECURE=true`.
4. Rebuild and restart (section 8) if you changed `.env`.

### Option B — Domain with Let's Encrypt on the server

Use this if the domain points **directly** at the server (grey cloud / no Cloudflare proxy).

1. Point your DNS A record at the server IP and wait for it to propagate (`dig +short your-domain`).

2. Get a certificate with certbot in standalone mode (nginx must be stopped for a minute):

```bash
sudo apt install -y certbot
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d your-domain --agree-tos -m you@yourcompany.com
```

Certificates land in `/etc/letsencrypt/live/your-domain/`.

3. Create a TLS-enabled nginx config `nginx/nginx-tls.conf` (copy of `nginx/nginx.conf` with a 443 server). Full file:

```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  sendfile on;
  keepalive_timeout 65;

  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
  limit_req_zone $binary_remote_addr zone=general_limit:10m rate=60r/s;

  upstream web_app {
    server web:3000;
  }

  upstream api_app {
    server api:4000;
  }

  # Redirect all HTTP to HTTPS
  server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl;
    http2 on;
    server_name your-domain;

    ssl_certificate     /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
      limit_req zone=api_limit burst=40 nodelay;
      proxy_pass http://api_app/;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
    }

    location / {
      limit_req zone=general_limit burst=100 nodelay;
      proxy_pass http://web_app;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
    }
  }
}
```

4. Create a compose override `docker-compose.tls.yml` in the repo root:

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
        [
          "CMD",
          "wget",
          "-q",
          "--spider",
          "--no-check-certificate",
          "https://localhost/api/health/live",
        ]
```

5. Start with both files (use this pair for every compose command from now on):

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d
```

6. Auto-renewal — certbot renews via a systemd timer, but nginx must reload to pick up new certs. Add a renewal hook:

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null <<'EOF'
#!/bin/sh
cd /home/deploy/danan && docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml restart nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Note: renewals in standalone mode need port 80 free; since our nginx serves port 80, switch renewals to webroot mode or briefly stop nginx via a pre-hook. Simplest pre/post hooks:

```bash
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

7. `.env`: `BASE_URL`/`WEB_ORIGIN` = `https://your-domain`, `COOKIE_SECURE=true`. Rebuild (section 8).

### Option C — IP only, plain HTTP (temporary / testing)

Works out of the box with the stock `docker-compose.prod.yml`, but with important caveats:

1. `.env` settings:

```bash
BASE_URL=http://<SERVER_IP>
WEB_ORIGIN=http://<SERVER_IP>
COOKIE_SECURE=false      # REQUIRED - Secure cookies are dropped over plain HTTP
```

2. Understand the risks while running this way:
   - Sessions, House Keys, and admin passwords travel **unencrypted**. Do not onboard real clients or use real House Keys until TLS is on.
   - Certificate QR verify links will embed the IP-based `BASE_URL`; certificates generated now will need regeneration after you move to a domain.
3. When you later get a domain: update `BASE_URL`, `WEB_ORIGIN`, `COOKIE_SECURE=true` in `.env`, then follow Option A or B and rebuild (section 8). Regenerate any issued certificates (SUPER_ADMIN: `POST /api/admin/certificates/regenerate/:pieceId`) so their QR links point at the new domain.

---

## 7. Backups

### 7.1 Database — nightly `pg_dump`

```bash
mkdir -p ~/backups
crontab -e
```

Add:

```cron
# Nightly Postgres dump at 03:15, keep 14 days
15 3 * * * docker compose -f /home/deploy/danan/docker-compose.prod.yml exec -T postgres pg_dump -U dadan dadan | gzip > /home/deploy/backups/dadan-$(date +\%F).sql.gz && find /home/deploy/backups -name 'dadan-*.sql.gz' -mtime +14 -delete
```

Copy backups **off the server** regularly (e.g. `rclone` to R2 or any object storage):

```bash
# Example with rclone configured for R2:
# rclone copy ~/backups r2:dadan-backups/db
```

### 7.2 Restore procedure

```bash
gunzip -c ~/backups/dadan-2026-07-02.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U dadan dadan
```

### 7.3 R2 assets

R2 already stores images and certificate PDFs redundantly. Certificate PDFs can also be regenerated from the DB at any time, so DB backups are the critical piece.

### 7.4 The `.env` file

Keep an encrypted copy of `.env` somewhere safe (password manager). Losing `CERT_SIGNING_SECRET` invalidates every issued certificate QR token; losing `JWT_SECRET` just logs everyone out.

---

## 8. Updating / redeploying

```bash
cd ~/danan
git pull

# Rebuild only what changed and restart. Migrations run automatically on API start.
docker compose -f docker-compose.prod.yml up -d --build

# (Add -f docker-compose.tls.yml if you use Option B)
```

Zero-ish downtime notes:

- `docker compose up -d --build` recreates only containers whose image changed.
- The API entrypoint runs `prisma migrate deploy` before serving; brief API unavailability (~seconds) during restart is expected.
- If you changed any `NEXT_PUBLIC_*` value or `VAT_RATE` in `.env`, the **web image must be rebuilt** (these are baked in at build time): `docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d web`.

### Rollback

```bash
git log --oneline -5          # find the last good commit
git checkout <good-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

Database note: Prisma migrations are forward-only. Rolling back code that depends on a newer schema usually still works (columns are additive so far), but check `packages/db/prisma/migrations/` before rolling back across a migration boundary. Worst case, restore the DB from the nightly dump (7.2).

---

## 9. Operations cheat sheet

```bash
# Status of everything
docker compose -f docker-compose.prod.yml ps

# Tail logs (all / one service)
docker compose -f docker-compose.prod.yml logs -f --tail=100
docker compose -f docker-compose.prod.yml logs -f api

# Restart one service
docker compose -f docker-compose.prod.yml restart api

# Shell into the API container
docker compose -f docker-compose.prod.yml exec api sh

# psql console
docker compose -f docker-compose.prod.yml exec postgres psql -U dadan dadan

# Redis console
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Disk usage of images/volumes; prune old build layers
docker system df
docker image prune -f
```

---

## 10. Troubleshooting

| Symptom                                                               | Likely cause                                                                                              | Fix                                                                                                                                            |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `api` container restarting, logs show `Environment validation failed` | Missing/invalid var in `.env` (e.g. `JWT_SECRET` < 32 chars, missing `S3_*`, no Stripe key in production) | Fix `.env`, then `docker compose -f docker-compose.prod.yml up -d api`                                                                         |
| `api` unhealthy, logs show Prisma `P1001`                             | Postgres not ready or wrong `POSTGRES_PASSWORD` after a volume already exists                             | Password is set on first volume creation; either keep the original password or reset the volume (`docker compose down -v` — **destroys data**) |
| Login works but you're logged out immediately / cookie never set      | `COOKIE_SECURE=true` while serving plain HTTP                                                             | Set `COOKIE_SECURE=false` (HTTP) or enable TLS                                                                                                 |
| Browser API calls fail with CORS errors                               | `WEB_ORIGIN`/`BASE_URL` don't match the URL in the address bar exactly (scheme, host, port)               | Correct them in `.env`, restart `api`                                                                                                          |
| All API requests 404 through the proxy                                | Web was built with the wrong `NEXT_PUBLIC_API_URL`                                                        | Must be `/api` in production (the compose file passes it automatically); rebuild `web`                                                         |
| Images/certificates fail to load                                      | Bad R2 credentials or bucket name                                                                         | Check `S3_*` vars; `docker compose ... logs api                                                                                                | grep -i s3` |
| `nginx` unhealthy                                                     | API not healthy (healthcheck goes through `/api/health/live`)                                             | Fix the API first; nginx recovers automatically                                                                                                |
| 429 Too Many Requests                                                 | nginx rate limits (20 r/s API, 60 r/s general) or app-level limits (5 login attempts / 15 min)            | Expected under abuse; adjust `nginx/nginx.conf` zones if legitimate traffic is hit                                                             |
| Emails not arriving                                                   | SMTP vars empty (emails are only logged)                                                                  | Fill `SMTP_*` in `.env`, restart `api`                                                                                                         |
| Disk filling up                                                       | Old Docker build layers                                                                                   | `docker image prune -f`; check backup retention                                                                                                |

---

## 11. Production go-live checklist

- [ ] `.env` uses freshly generated secrets (never the dev/example values), `chmod 600`
- [ ] `COOKIE_SECURE=true` and site served over HTTPS (Option A or B)
- [ ] `BASE_URL` and `WEB_ORIGIN` match the public URL exactly
- [ ] Real Stripe key set (`sk_live_*`) — note the web checkout still uses the mock flow until Stripe Elements is integrated (see `docs/REVIEW_FINDINGS.md`)
- [ ] Dev seed **not** run; real SUPER_ADMIN created via section 5.3
- [ ] Firewall: only 22/80/443 open
- [ ] Nightly DB backup cron installed and a restore has been tested once
- [ ] `docker compose ps` shows all services healthy
- [ ] `/api/health` returns `"status":"ok"` from outside the server
- [ ] Admin login works, viewer/staff accounts created with least privilege
- [ ] TLS auto-renewal hook tested (`sudo certbot renew --dry-run`) if using Option B
