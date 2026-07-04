# DADAN Dijital — Production Deployment Guide

This guide walks through deploying the DADAN platform on a **single Ubuntu 24.04 LTS VPS** using Docker Compose. Every command is copy-pasteable from a `deploy` user shell.

The instructions assume you have never deployed this project before. Read each section sequentially — steps build on earlier ones.

---

## Architecture

```
Internet
    │
    ▼
┌───────────────────────────────────────────────────┐
│  Host (single VPS)                                 │
│                                                     │
│  ┌──────────┐   :80 (→ :443 after TLS setup)       │
│  │  nginx   │◄──────────────── Internet            │
│  └────┬─────┘                                       │
│       │                                             │
│   ┌───┴───┐                                        │
│   │       │                                        │
│   ▼       ▼                                        │
│ ┌────┐ ┌────┐                                      │
│ │web │ │api │  Docker bridge network                │
│ │:3000│ │:4000│                                     │
│ └────┘ └─┬──┘                                      │
│           │                                         │
│     ┌─────┼─────┐                                   │
│     │     │     │                                   │
│     ▼     ▼     ▼                                   │
│  ┌────┐ ┌────┐ ┌──────────────────┐                │
│  │ pg │ │redis│ │ S3-compatible   │                │
│  │:5432│ │:6379│ │ object storage  │                │
│  └────┘ └────┘ └──────────────────┘                │
│                                                     │
│  Bind mounts on host:                               │
│    /opt/dadan/data/postgres                         │
│    /opt/dadan/data/redis                            │
│    /opt/dadan/data/uploads                          │
└───────────────────────────────────────────────────┘
```

| Container  | Source                           | Purpose                                        | Port |
| ---------- | -------------------------------- | ---------------------------------------------- | ---- |
| `nginx`    | `nginx:1.27-alpine`              | Reverse proxy, rate limiting, security headers | 80   |
| `web`      | Built from `apps/web/Dockerfile` | Next.js app (client + admin dashboard)         | 3000 |
| `api`      | Built from `apps/api/Dockerfile` | NestJS API + Prisma migrations on startup      | 4000 |
| `postgres` | `postgres:16-alpine`             | Primary database                               | 5432 |
| `redis`    | `redis:7-alpine`                 | Rate limiting, JWT deny-list, session cache    | 6379 |

Only nginx is exposed to the host network. All other services are reachable only within the Docker bridge network.

Persistent data is stored on the host filesystem at:

| Path                       | Contents              |
| -------------------------- | --------------------- |
| `/opt/dadan/data/postgres` | PostgreSQL data files |
| `/opt/dadan/data/redis`    | Redis AOF persistence |
| `/opt/dadan/data/uploads`  | User-uploaded media   |

---

## 1. Requirements

### Server

| Resource | Minimum          | Recommended      |
| -------- | ---------------- | ---------------- |
| vCPU     | 2                | 4                |
| RAM      | 4 GB             | 8 GB             |
| Disk     | 40 GB SSD        | 80 GB SSD        |
| OS       | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

### Software (installed during setup)

- Docker Engine (CE)
- Docker Compose plugin (v2)
- Git
- OpenSSH server

### Networking

- Static public IP address for the VPS
- Domain name (for TLS — see §11)
- DNS management access (Network Solutions or equivalent)

### Accounts

- SSH key pair (Ed25519 recommended)
- GitHub account with access to the private repository
- S3-compatible object storage account (Cloudflare R2, AWS S3, or any S3 endpoint)
- Stripe account (for payment processing — optional during setup)

### Firewall ports to open

| Port | Protocol | Purpose     |
| ---- | -------- | ----------- |
| 22   | TCP      | SSH         |
| 80   | TCP      | HTTP        |
| 443  | TCP      | HTTPS (§11) |

---

## 2. Initial Server Setup

### 2.1 Connect as root

Provision your VPS from the provider dashboard (Hostinger, DigitalOcean, etc.). You will receive a root password or SSH key.

```bash
ssh root@<VPS_IP_ADDRESS>
```

### 2.2 Update the system

```bash
apt update && apt upgrade -y
```

### 2.3 Create the deploy user

Running services as root is dangerous. Create a dedicated deploy user with sudo privileges.

```bash
adduser deploy
usermod -aG sudo deploy
```

### 2.4 Configure SSH key access

From your **local machine**, add your public key to the deploy user:

```bash
# On your local machine:
ssh-copy-id deploy@<VPS_IP_ADDRESS>

# If you don't have ssh-copy-id, manually:
cat ~/.ssh/id_ed25519.pub | ssh deploy@<VPS_IP_ADDRESS> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

Generate an Ed25519 key pair on your local machine if you don't have one:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

### 2.5 Disable password login and root SSH

After confirming your key works in a separate terminal session:

```bash
# Lock down SSH
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart ssh
```

Test by opening a **new terminal** and connecting as `deploy`. Do not close your current session until you confirm the new one works.

### 2.6 Configure firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp    # Only if enabling HTTPS (§11)
sudo ufw --force enable
sudo ufw status verbose
```

> **Warning:** Never open ports 3000, 4000, 5432, or 6379. These services are accessed only through the Docker bridge network.

### 2.7 Install Docker Engine

Use the official convenience script:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect:

```bash
exit
ssh deploy@<VPS_IP_ADDRESS>
```

### 2.8 Verify Docker and Compose

```bash
docker --version
docker compose version
docker run hello-world
```

### 2.9 Configure automatic security updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2.10 Optimize kernel parameters for Docker

```bash
# Reduce swappiness — Docker containers benefit from lower swap usage
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w vm.swappiness=10

# Increase max file watchers (useful for Node.js)
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w fs.inotify.max_user_watches=524288
```

---

## 3. Clone Repository

### 3.1 Prepare directory structure

```bash
sudo mkdir -p /opt/dadan/data
sudo chown -R deploy:deploy /opt/dadan
```

### 3.2 Configure GitHub SSH access

Generate a deploy key or add your SSH key to GitHub.

```bash
# Generate a dedicated deploy key (or use your personal key)
ssh-keygen -t ed25519 -C "deploy@dadan-server" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

Add the public key to:

- **Repository deploy keys:** GitHub → Repo → Settings → Deploy keys → Add deploy key (read-only access is sufficient)

Or add to your **personal GitHub account:** GitHub → Settings → SSH and GPG keys → New SSH key (if this is your personal key).

Configure SSH to use the key:

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

Test the connection:

```bash
ssh -T git@github.com
# Should print: Hi <user/org>! You've successfully authenticated...
```

### 3.3 Clone

```bash
cd /opt/dadan
git clone git@github.com:<ORG>/<REPO>.git .
```

> **Note:** Replace `<ORG>` and `<REPO>` with the actual GitHub repository path.

The repository is cloned directly into `/opt/dadan` (not a subdirectory). The data directories live alongside it at `/opt/dadan/data/`.

---

## 4. Folder Structure

After cloning and creating data directories, the server layout should look like this:

```
/opt/dadan/
├── apps/
│   ├── api/                  # NestJS API source
│   └── web/                  # Next.js source
├── packages/                 # Shared packages (db, storage, ui, etc.)
├── nginx/
│   └── nginx.conf            # Production nginx configuration
├── docker-compose.prod.yml   # Production compose file
├── deploy.sh                 # Automated deployment script
├── backup.sh                 # Database backup script
├── restore.sh                # Database restore script
├── .env                      # Environment variables (DO NOT COMMIT)
├── .env.example              # Template (safe to commit)
└── data/                     # Persistent data (created at runtime)
    ├── postgres/
    ├── redis/
    └── uploads/
```

> **Important:** The `data/` directory is created automatically by Docker Compose bind mounts when containers start. You do not need to create it manually, but ensuring the parent `/opt/dadan/data` exists with correct ownership is recommended.

---

## 5. Environment Variables

The production compose file (`docker-compose.prod.yml`) reads variables from a `.env` file in the repository root.

### 5.1 Generate secrets

```bash
cd /opt/dadan
openssl rand -hex 24        # -> POSTGRES_PASSWORD
openssl rand -base64 48     # -> JWT_SECRET (min 32 chars)
openssl rand -base64 32     # -> CERT_SIGNING_SECRET (min 16 chars)
openssl rand -hex 16        # -> REDIS_PASSWORD (optional)
```

### 5.2 Create .env

```bash
touch .env
chmod 600 .env
nano .env
```

### 5.3 All environment variables

| Variable                   | Description                                          | Required | Default                         | Example                                         |
| -------------------------- | ---------------------------------------------------- | -------- | ------------------------------- | ----------------------------------------------- |
| `POSTGRES_PASSWORD`        | PostgreSQL database password                         | **Yes**  | —                               | `a1b2c3d4e5f6...` (hex 24)                      |
| `REDIS_PASSWORD`           | Redis password (leave empty to disable auth)         | No       | `(empty)`                       | `abc123...`                                     |
| `JWT_SECRET`               | HMAC secret for JWT tokens (min 32 chars)            | **Yes**  | —                               | `uH83j...` (base64 48)                          |
| `CERT_SIGNING_SECRET`      | HMAC secret for certificate QR tokens (min 16 chars) | **Yes**  | —                               | `kL9mN...` (base64 32)                          |
| `HOUSE_KEY_SALT`           | bcrypt salt rounds for House Key hashing             | No       | `12`                            | `12`                                            |
| `CLIENT_SESSION_DAYS`      | JWT expiry for client users                          | No       | `7`                             | `7`                                             |
| `COOKIE_SECURE`            | Set `true` when using HTTPS, `false` for HTTP        | **Yes**  | `false`                         | `true`                                          |
| `BASE_URL`                 | Public base URL (used in certificate links, CORS)    | **Yes**  | —                               | `https://dadan.example.com`                     |
| `WEB_ORIGIN`               | CORS origin (must match browser address bar)         | **Yes**  | —                               | `https://dadan.example.com`                     |
| `S3_ENDPOINT`              | S3-compatible storage endpoint URL                   | **Yes**  | —                               | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_BUCKET`                | S3 bucket name for uploads                           | No       | `dadan-assets`                  | `dadan-assets-prod`                             |
| `S3_ACCESS_KEY`            | S3 access key ID                                     | **Yes**  | —                               | `AKIAIOSFODNN7EXAMPLE`                          |
| `S3_SECRET_KEY`            | S3 secret access key                                 | **Yes**  | —                               | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`      |
| `S3_REGION`                | S3 region (use `auto` for R2)                        | No       | `auto`                          | `auto`                                          |
| `PAYMENT_PROVIDER_KEY`     | Stripe secret key (`sk_live_...` or `sk_test_...`)   | No       | `(empty)`                       | `sk_live_...`                                   |
| `PAYMENT_PROVIDER_SECRET`  | Stripe webhook signing secret                        | No       | `(empty)`                       | `whsec_...`                                     |
| `VAT_RATE`                 | VAT rate as decimal (0.15 = 15%)                     | No       | `0.15`                          | `0.15`                                          |
| `NEXT_PUBLIC_PAYMENT_MODE` | Checkout mode: `mock` or leave empty for Stripe      | No       | `mock`                          | `mock`                                          |
| `ADMIN_EMAIL`              | Admin email address (used in system notifications)   | No       | `(empty)`                       | `admin@dadan.sa`                                |
| `SMTP_HOST`                | SMTP server hostname                                 | No       | `(empty)`                       | `smtp.sendgrid.net`                             |
| `SMTP_PORT`                | SMTP server port                                     | No       | `(empty)`                       | `587`                                           |
| `SMTP_USER`                | SMTP username                                        | No       | `(empty)`                       | `apikey`                                        |
| `SMTP_PASS`                | SMTP password                                        | No       | `(empty)`                       | `SG.xxxxx...`                                   |
| `PDF_WATERMARK_TEXT`       | Watermark text on certificate PDFs                   | No       | `DADAN DIJITAL — AUTHENTICATED` | `DADAN DIJITAL — AUTHENTICATED`                 |
| `HTTP_PORT`                | Host port for nginx                                  | No       | `80`                            | `80`                                            |

### 5.4 Example .env (production)

```bash
POSTGRES_PASSWORD=a1b2c3d4e5f6a1b2c3d4e5f6
REDIS_PASSWORD=redis-secret-here
JWT_SECRET=uH83jK9mN...
CERT_SIGNING_SECRET=kL9mN...
HOUSE_KEY_SALT=12
CLIENT_SESSION_DAYS=7
COOKIE_SECURE=true
BASE_URL=https://dadan.example.com
WEB_ORIGIN=https://dadan.example.com
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET=dadan-assets-prod
S3_ACCESS_KEY=your-access-key-id
S3_SECRET_KEY=your-secret-access-key
S3_REGION=auto
PAYMENT_PROVIDER_KEY=sk_live_...
PAYMENT_PROVIDER_SECRET=whsec_...
VAT_RATE=0.15
NEXT_PUBLIC_PAYMENT_MODE=mock
ADMIN_EMAIL=admin@dadan.sa
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
PDF_WATERMARK_TEXT=DADAN DIJITAL — AUTHENTICATED
HTTP_PORT=80
```

### 5.5 Critical notes

- `NEXT_PUBLIC_API_URL` is **not** set in `.env` — docker-compose.prod.yml passes `/api` as a build arg automatically.
- `DATABASE_URL` and `REDIS_URL` are **not** needed — the compose file wires internal container hostnames.
- Store the `.env` file in a password manager. Losing `CERT_SIGNING_SECRET` invalidates every certificate QR token; losing `JWT_SECRET` logs out all users.
- `COOKIE_SECURE` must be `false` when testing over plain HTTP, and `true` when HTTPS is enabled.

---

## 6. Docker Build

### 6.1 Build images

```bash
cd /opt/dadan
docker compose -f docker-compose.prod.yml build
```

This compiles both the API and web applications inside Docker using multi-stage builds.

### 6.2 BuildKit cache mounts

The Dockerfiles use BuildKit cache mounts to speed up rebuilds:

- **PNPM store cache:** `--mount=type=cache,target=/root/.local/share/pnpm/store` — caches downloaded packages across builds. When the lockfile hasn't changed, pnpm installs from cache instead of downloading.
- **Turbo cache:** `--mount=type=cache,target=.turbo` — caches intermediate build artifacts. Only changed packages are recompiled.

These cache mounts persist automatically. To clear them:

```bash
docker builder prune --filter type=exec.cachemount
```

### 6.3 When to rebuild

| Scenario                                    | Command                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| Source code changed                         | `docker compose build`                                          |
| Dependencies changed (`pnpm-lock.yaml`)     | `docker compose build --no-cache` (or clear cache mounts first) |
| Environment variables in build args changed | `docker compose build web`                                      |
| Dockerfile changed                          | `docker compose build`                                          |
| Base image updated                          | `docker compose build --pull`                                   |

### 6.4 Building a single service

```bash
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml build web
```

---

## 7. Database

### 7.1 Migrations

Migrations run **automatically** when the API container starts. The entrypoint script executes `prisma migrate deploy` before booting the NestJS server.

To run migrations manually (e.g., during maintenance):

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 7.2 When migrations run

- **On every container start** — the API entrypoint always applies pending migrations before listening for requests.
- **After pulling new code** that contains migration files in `packages/db/prisma/migrations/`.
- `prisma migrate deploy` only applies migrations that haven't been applied yet. It is safe to run repeatedly.

### 7.3 Prisma client generation

The Prisma client is generated during the Docker build. You do not need to run `prisma generate` on the server.

### 7.4 Seed data

> **Warning:** Never run `pnpm db:seed` against production. The seed script creates demo data with well-known passwords.

Create the first SUPER_ADMIN directly using the production API container. See §8.5.

---

## 8. Starting Production

### 8.1 First-time start

```bash
cd /opt/dadan
docker compose -f docker-compose.prod.yml up -d
```

This creates the Docker bridge network, starts all containers in dependency order, and waits for health checks.

### 8.2 Build and start (if images haven't been built)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 8.3 What happens during startup

1. **postgres** starts. Health check runs `pg_isready`. Wait: ~10-20 seconds on first start (initialising data directory).
2. **redis** starts. Health check runs `redis-cli ping`. Wait: ~2 seconds.
3. **api** starts once postgres and redis are healthy. The entrypoint:
   - Runs `prisma migrate deploy` (applies pending migrations).
   - Boots the NestJS server on port 4000.
   - Health check: `GET /health`. Wait: ~30-40 seconds.
4. **web** starts once the API is healthy. Boots Next.js standalone server on port 3000. Wait: ~10 seconds.
5. **nginx** starts once both web and API are healthy. Begins serving on port 80. Wait: ~5 seconds.

Total first-time startup: 1-3 minutes. Subsequent starts are faster (no migration, cached data).

### 8.4 Service descriptions

| Service    | Role                                                                                                                                           | Connections to                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `postgres` | Primary relational database. Stores users, certificates, collections, payments.                                                                | —                              |
| `redis`    | In-memory cache. Rate limiting counters, JWT deny-list, session state.                                                                         | —                              |
| `api`      | NestJS REST API. Handles all business logic, authentication, file serving via presigned S3 URLs.                                               | postgres, redis, S3 (external) |
| `web`      | Next.js application. Server-side renders pages for client-facing site and admin dashboard.                                                     | api (internal HTTP)            |
| `nginx`    | Reverse proxy. Single public entry point. Routes `/api/*` → api:4000, `/*` → web:3000. Adds rate limiting, security headers, gzip compression. | web, api                       |

### 8.5 Create the first SUPER_ADMIN

The seed script creates demo data for development only. For production, create your admin user directly:

```bash
docker compose -f docker-compose.prod.yml exec \
  -e NEW_ADMIN_EMAIL='admin@yourcompany.com' \
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

> **Security:** Clear your shell history afterwards: `history -c`. Or write the password to a temp file and use `--env-file`.

Log in at `http://your-domain/admin/login` (or the HTTPS URL once configured).

---

## 9. Verifying Deployment

### 9.1 Container status

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:

```
NAME                STATUS
dadan-postgres-1    Up (healthy)
dadan-redis-1       Up (healthy)
dadan-api-1         Up (healthy)
dadan-web-1         Up (healthy)
dadan-nginx-1       Up (healthy)
```

If any service shows `(unhealthy)` or `Restarting`, check the logs (§14).

### 9.2 Resource usage

```bash
docker stats --no-stream
```

Shows live CPU, memory, and network I/O per container.

### 9.3 API health check

```bash
# Full health check (verifies DB + Redis connectivity)
curl -s http://localhost/api/health

# Lightweight liveness probe
curl -s http://localhost/api/health/live

# Readiness check
curl -s http://localhost/api/health/ready
```

Expected response from `/api/health`:

```json
{
  "status": "ok",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "uptime": 1234,
  "database": "connected",
  "redis": "connected"
}
```

### 9.4 Web app

```bash
# Check HTTP response headers
curl -sI http://localhost

# Response should include:
#   HTTP/1.1 200 OK
#   Strict-Transport-Security: max-age=31536000
#   X-Frame-Options: DENY
```

### 9.5 Browser verification

1. Visit `http://<VPS_IP>` or `http://your-domain`
2. The landing page should load
3. Visit `http://your-domain/admin/login` — the admin login form should appear
4. Log in with the SUPER_ADMIN credentials created in §8.5

### 9.6 End-to-end check

```bash
# Docker compose ps (all healthy)
docker compose -f docker-compose.prod.yml ps | grep -c "healthy"

# API responds through nginx
[ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost/api/health)" = "200" ] && echo "API OK"

# Web responds through nginx
[ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost)" = "200" ] && echo "WEB OK"
```

---

## 10. DNS Configuration

### 10.1 Point your domain to the VPS

Using your domain registrar (Network Solutions, Namecheap, etc.):

| Type | Name  | Value              | TTL          |
| ---- | ----- | ------------------ | ------------ |
| A    | `@`   | `<VPS_IP_ADDRESS>` | 600 (10 min) |
| A    | `www` | `<VPS_IP_ADDRESS>` | 600 (10 min) |

For Network Solutions specifically:

1. Log in to your Network Solutions account.
2. Go to **Domain Names → Manage → Edit DNS** (or Advanced DNS).
3. Add/Edit the **A Record** for `@` (the naked domain) pointing to your VPS IP.
4. Add/Edit the **A Record** for `www` pointing to the same IP.

### 10.2 Wait for propagation

DNS changes can take 5 minutes to 48 hours to propagate. Verify with:

```bash
dig +short your-domain.com
dig +short www.your-domain.com
```

Both should return your VPS IP address.

### 10.3 Update .env with domain

Once DNS is propagating:

```bash
BASE_URL=https://dadan.example.com
WEB_ORIGIN=https://dadan.example.com
COOKIE_SECURE=true
```

> **Note:** If you are configuring HTTPS first (§11), set `COOKIE_SECURE=false` until TLS is working.

---

## 11. HTTPS

This section uses **Certbot with Let's Encrypt** to obtain free TLS certificates. We do not use Cloudflare proxy for TLS.

### 11.1 Prerequisites

- DNS A record pointing to your server IP (§10)
- The domain resolves to the server before proceeding (confirm with `dig`)
- Port 80 is reachable from the internet

### 11.2 Install Certbot

```bash
sudo apt install -y certbot
```

### 11.3 Obtain the certificate

Stop nginx temporarily (it binds port 80, which Certbot needs for the HTTP-01 challenge):

```bash
docker compose -f docker-compose.prod.yml stop nginx

sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --agree-tos \
  -m admin@yourcompany.com
```

Certificates are stored at `/etc/letsencrypt/live/your-domain.com/`.

### 11.4 Configure nginx with TLS

Create `nginx/nginx-tls.conf` — a copy of the existing `nginx/nginx.conf` with the following modifications:

1. Add a `listen 443 ssl;` server block.
2. Add `ssl_certificate` and `ssl_certificate_key` paths.
3. Add the HTTP → HTTPS redirect.

Example TLS server block addition (merge with existing `server` block logic):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;

    # Same location blocks as the existing server block
    # ...
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 11.5 Create TLS compose override

Create `docker-compose.tls.yml` in the repo root:

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

### 11.6 Start with TLS

From now on, use both compose files together:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d
```

> **Tip:** Create an alias or use the `deploy.sh` script with `-t` flag: `./deploy.sh -t`

### 11.7 Configure auto-renewal

Let's Encrypt certificates are valid for 90 days. Set up automatic renewal:

```bash
# Pre-renewal hook: stop nginx before the HTTP-01 challenge
sudo tee /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh > /dev/null <<'EOF'
#!/bin/sh
cd /opt/dadan && docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml stop nginx
EOF

# Post-renewal hook: start nginx after certificate renewal
sudo tee /etc/letsencrypt/renewal-hooks/post/start-nginx.sh > /dev/null <<'EOF'
#!/bin/sh
cd /opt/dadan && docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml start nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/start-nginx.sh
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

Certbot renewal is triggered automatically by a systemd timer (`certbot.timer`). No cron job is needed.

### 11.8 Update .env for HTTPS

```bash
COOKIE_SECURE=true
BASE_URL=https://your-domain.com
WEB_ORIGIN=https://your-domain.com
```

Rebuild and restart:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d
```

---

## 12. Updating the Application

### 12.1 Automated deploy (recommended)

The `deploy.sh` script automates the full update cycle with automatic rollback on failure:

```bash
cd /opt/dadan

# Standard deploy
./deploy.sh

# With TLS compose override
./deploy.sh -t

# Skip pre-deploy backup (faster, but risky)
./deploy.sh -s

# Dry-run (show actions without executing)
./deploy.sh -d
```

**What `deploy.sh` does:**

| Step              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| Pre-flight        | Checks git, docker, docker compose, clean working tree, valid compose files |
| Pre-deploy backup | `pg_dump` → `~/backups/pre-deploy-dadan-*.sql.gz` (skip with `-s`)          |
| `git pull`        | Fetches latest code from the repository                                     |
| Build             | `docker compose build` (uses BuildKit cache for speed)                      |
| Restart           | `docker compose up -d` (only recreates containers with changes)             |
| Health poll       | Waits up to 120s per service: postgres → redis → api → web → nginx          |
| On failure        | Auto-rollback: checkout previous commit → rebuild → restart → re-verify     |
| Success           | Prints summary, prunes old Docker images                                    |

### 12.2 Manual deploy

```bash
cd /opt/dadan

# Pull latest code
git pull

# Rebuild images (only if source or deps changed)
docker compose -f docker-compose.prod.yml build

# Restart containers (only recreates changed ones)
docker compose -f docker-compose.prod.yml up -d

# Verify
docker compose -f docker-compose.prod.yml ps
```

### 12.3 Deploying with TLS

```bash
# Automated
./deploy.sh -t

# Manual
git pull
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml build
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d
```

### 12.4 Zero-downtime considerations

`docker compose up -d` replaces containers with brief (sub-second) service interruption. For true zero-downtime:

1. The API starts listening only after `prisma migrate deploy` completes (migrations run first).
2. During migration, old API instances are still serving requests.
3. Once the new API is healthy, nginx health checks pick it up.

**If you need no-downtime migrations:**

- Ensure migrations are additive (no column drops, no renames).
- Use the deploy script's health check polling to confirm the new version is healthy before old containers fully stop.

---

## 13. Rollback

### 13.1 Automated rollback (`deploy.sh`)

If `deploy.sh` detects an unhealthy service after deployment, it automatically rolls back:

1. Checks out the previous commit.
2. Rebuilds images.
3. Restarts containers.
4. Polls health checks again.

No manual intervention is required if using `deploy.sh`.

### 13.2 Manual rollback

```bash
cd /opt/dadan

# View recent commits
git log --oneline -10

# Checkout the previous (known-good) commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

### 13.3 Database rollback

Prisma migrations are forward-only. If a deployment applied a migration and you roll back the code:

- **Additive migrations** (new columns, new tables) — the old code ignores unknown columns. Usually safe.
- **Destructive migrations** (column drops, renames) — the old code will fail if it references removed columns.

If the rolled-back code is incompatible with the new schema:

1. Check API logs: `docker compose -f docker-compose.prod.yml logs api --tail=50`
2. If incompatible, restore the pre-deploy backup that `deploy.sh` created automatically:

```bash
# List pre-deploy backups
ls -la ~/backups/pre-deploy-*.sql.gz

# Restore
./restore.sh ~/backups/pre-deploy-dadan-2026-07-04_121500.sql.gz
```

3. Re-deploy after fixing the issue.

---

## 14. Logs

### 14.1 Docker compose logs

```bash
# All services (follow, last 100 lines)
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Single service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis

# With TLS override
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml logs -f nginx

# Search within logs
docker compose -f docker-compose.prod.yml logs api --tail=1000 | grep -i error
```

### 14.2 Docker logs (low-level)

```bash
# List containers
docker ps

# Raw Docker logs
docker logs dadan-api-1 --tail=50
docker logs dadan-api-1 -f
```

### 14.3 Nginx access logs

Nginx logs to stdout in JSON format. They are captured by Docker's logging driver and accessible via `docker compose logs nginx`.

```bash
docker compose -f docker-compose.prod.yml logs nginx --tail=100
```

The JSON log format includes:

```json
{
  "timestamp": "2026-07-04T12:00:00+00:00",
  "remote_addr": "203.0.113.1",
  "request": "GET /api/health HTTP/1.1",
  "status": 200,
  "body_bytes_sent": 1234,
  "request_time": 0.045,
  "http_referer": "-",
  "http_user_agent": "curl/7.68.0",
  "upstream_addr": "172.18.0.4:4000",
  "upstream_response_time": "0.040"
}
```

### 14.4 System logs

```bash
# Docker daemon logs
sudo journalctl -u docker --no-pager --tail=50

# System resource issues
sudo journalctl -xe --no-pager --tail=50 | grep -i "oom\|disk\|error"
```

### 14.5 Log rotation

All Docker services are configured with `json-file` logging driver:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m" # Max 10 MB per log file
    max-file: "3" # Keep 3 rotated files (30 MB total per service)
```

This prevents log files from filling the disk.

---

## 15. Backups

### 15.1 Database backups

Use the `backup.sh` script at the repo root:

```bash
cd /opt/dadan

# Create a backup (default: ~/backups/, 14-day retention)
./backup.sh

# Custom output directory
./backup.sh -o /opt/dadan/backups

# Custom retention (30 days)
./backup.sh -k 30

# Verbose output
./backup.sh -v
```

**What `backup.sh` does:**

1. Verifies Docker, compose file, and postgres container health.
2. Runs `pg_dump --clean --if-exists` via `docker compose exec -T postgres`.
3. Pipes through `gzip` to a timestamped file (`dadan-YYYY-MM-DD_HHMMSS.sql.gz`).
4. Validates the archive with `gunzip -t`.
5. Prunes backups older than the retention period (default 14 days).
6. Logs everything to `~/backups/backup.log`.

### 15.2 Schedule nightly backups

```bash
mkdir -p ~/backups
crontab -e
```

Add:

```cron
# Nightly Postgres dump at 03:15, keep 14 days
15 3 * * * /opt/dadan/backup.sh -v >> /opt/dadan/cron.log 2>&1
```

### 15.3 Off-site backup (recommended)

Backups on the same server are lost if the server fails. Copy backups off-site using `rclone`, `aws s3 cp`, or `scp`:

```bash
# Example: copy to S3-compatible storage
rclone copy ~/backups s3-backups:dadan-backups/db

# Example: copy to a second server
rsync -az ~/backups/ backup@backup-server:/backups/dadan/
```

### 15.4 Back up uploads

Uploaded media at `/opt/dadan/data/uploads/` should be backed up alongside the database:

```bash
# Rsync to backup location
rsync -az /opt/dadan/data/uploads/ ~/backups/uploads/

# Or tar and compress
tar czf ~/backups/uploads-$(date +%Y-%m-%d).tar.gz /opt/dadan/data/uploads/
```

### 15.5 Restore a backup

Use the `restore.sh` script:

```bash
cd /opt/dadan

# List available backups
./restore.sh

# Restore a specific backup
./restore.sh dadan-2026-07-04_031500.sql.gz
```

**Safety features:**

- Validates the gzip archive before touching the database.
- Shows a summary (size, date, target DB) and requires typing `yes` to confirm.
- **Automatically creates a pre-restore snapshot** so you can undo the restore.
- After restore, validates the database has tables.

### 15.6 Secrets backup

Keep an encrypted copy of `.env` in a password manager. Losing `POSTGRES_PASSWORD` with a database volume present will make the database inaccessible (the password is baked into the volume's `pg_hba.conf`). Recovery requires `docker compose down -v` (data loss) and restore from backup.

---

## 16. Monitoring

### 16.1 Built-in monitoring (no setup required)

```bash
# Container health
docker compose -f docker-compose.prod.yml ps

# Live resource usage
docker stats --no-stream

# Disk usage
df -h

# Memory usage
free -h

# CPU info
lscpu | grep "CPU(s)"
```

### 16.2 Disk usage monitoring

```bash
# Docker disk usage
docker system df

# Data directory size
du -sh /opt/dadan/data/*

# Backup directory size
du -sh ~/backups
```

### 16.3 Container health checks

Each container has a built-in health check defined in `docker-compose.prod.yml`:

| Service  | Check command                       | Interval | Timeout | Start period |
| -------- | ----------------------------------- | -------- | ------- | ------------ |
| postgres | `pg_isready -U dadan`               | 10s      | 5s      | 30s          |
| redis    | `redis-cli ping`                    | 10s      | 3s      | 10s          |
| api      | `wget -q --spider /health`          | 10s      | 5s      | 40s          |
| web      | `wget -q --spider localhost:3000`   | 10s      | 5s      | 30s          |
| nginx    | `wget -q --spider /api/health/live` | 30s      | 10s     | 10s          |

View health status:

```bash
# Detailed health status
docker inspect --format='{{json .State.Health}}' dadan-api-1 | jq

# Exit code of last health check (0 = healthy)
docker inspect --format='{{.State.Health.Status}}' dadan-api-1
```

### 16.4 Optional: monitoring stack

A monitoring stack (Prometheus + Grafana + Loki + cAdvisor) is available in `docker-compose.monitoring.yml`. It is **optional** and not required for production:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
```

For full details, see [MONITORING.md](MONITORING.md).

---

## 17. Troubleshooting

### 17.1 Container states

```
$ docker compose ps
NAME                STATUS
dadan-postgres-1    Up 3 days (healthy)
dadan-redis-1       Up 3 days (healthy)
dadan-api-1         Up 2 days (healthy)
dadan-web-1         Up 2 days (healthy)
dadan-nginx-1       Up 2 days (healthy)
```

| STATUS           | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `Up (healthy)`   | Running and passing health checks                                     |
| `Up (unhealthy)` | Running but failing health checks. Usually a dependency is down.      |
| `Restarting`     | Docker restart policy triggered (crash loop). Check logs immediately. |
| `Exited (1)`     | Container exited with error — check logs.                             |

### 17.2 Common issues

| Symptom                                    | Likely cause                                              | Fix                                                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Docker won't start**                     | Docker daemon not running                                 | `sudo systemctl start docker && sudo systemctl enable docker`                                                                                                                    |
| **Port 80 already in use**                 | Another process (Apache, nginx) is bound to port 80       | `sudo lsof -i :80` then stop the conflicting service                                                                                                                             |
| **Database unavailable**                   | Postgres not healthy or wrong `POSTGRES_PASSWORD`         | `docker compose logs postgres`. If password changed after initial volume creation, you need to wipe the volume (`docker compose down -v` — **data loss**) or restore from backup |
| **Redis unavailable**                      | Redis not healthy or wrong `REDIS_PASSWORD`               | `docker compose logs redis`. Verify `REDIS_PASSWORD` in `.env`                                                                                                                   |
| **Migration failure**                      | Prisma migration conflicts with existing data             | `docker compose logs api \| grep -i "prisma\|migrate"`. May require manual migration intervention                                                                                |
| **Nginx 502 Bad Gateway**                  | API or web is not healthy                                 | Check upstream services: `docker compose ps api web`. Fix the underlying service; nginx recovers automatically                                                                   |
| **Permission denied**                      | Bind mount directory doesn't exist or has wrong ownership | `sudo mkdir -p /opt/dadan/data/{postgres,redis,uploads} && sudo chown -R deploy:deploy /opt/dadan/data`                                                                          |
| **Disk full**                              | Logs, old Docker images, or backups filling the disk      | `docker image prune -af && docker system prune -f`. Check backup retention settings. Check `du -sh /var/lib/docker/`                                                             |
| **Out of memory (exit code 137)**          | Container exceeded `mem_limit`                            | Increase `mem_limit` in `docker-compose.prod.yml` for the affected service. Check `docker stats` for baseline usage                                                              |
| **Prisma P1001 (can't reach DB)**          | API cannot connect to postgres                            | Verify `DATABASE_URL` in docker-compose.prod.yml (should be `postgresql://dadan:${POSTGRES_PASSWORD}@postgres:5432/dadan`). Check if postgres is healthy                         |
| **Prisma P1000 (auth failed)**             | Wrong `POSTGRES_PASSWORD`                                 | The password must match what was set when the postgres volume was first created. If changed, you need a new volume or restore from backup                                        |
| **CORS errors in browser**                 | `WEB_ORIGIN` doesn't match the URL in the address bar     | Correct `WEB_ORIGIN` in `.env`. Restart the API: `docker compose restart api`                                                                                                    |
| **All API requests 404**                   | Web built with wrong `NEXT_PUBLIC_API_URL`                | In production, this must be `/api`. The compose file passes it as a build arg. Rebuild web: `docker compose build web && docker compose up -d web`                               |
| **429 Too Many Requests**                  | nginx rate limits (20 r/s API, 60 r/s general)            | Adjust `limit_req` zones in `nginx/nginx.conf` if legitimate traffic hits limits                                                                                                 |
| **Emails not sending**                     | SMTP variables empty or incorrect                         | Fill `SMTP_*` in `.env`. Restart API: `docker compose restart api`. Check logs for SMTP errors                                                                                   |
| **Login works but logged out immediately** | `COOKIE_SECURE=true` over plain HTTP                      | Set `COOKIE_SECURE=false` when testing over HTTP, or enable HTTPS                                                                                                                |
| **certbot command not found**              | Certbot not installed                                     | `sudo apt install -y certbot`                                                                                                                                                    |
| **certbot: 80 already in use**             | nginx or another process on port 80                       | `docker compose stop nginx` before running certbot standalone, or use certbot's nginx plugin                                                                                     |

### 17.3 Emergency commands

```bash
# Restart everything
docker compose -f docker-compose.prod.yml restart

# Stop everything (preserves volumes and data)
docker compose -f docker-compose.prod.yml down

# Stop everything and delete volumes (DATA LOSS — only for fresh start)
docker compose -f docker-compose.prod.yml down -v

# Reset a single service (rebuild from scratch)
docker compose -f docker-compose.prod.yml rm -fs api
docker compose -f docker-compose.prod.yml up -d --build api

# Check environment variables in a running container
docker compose -f docker-compose.prod.yml exec api env | grep -E 'JWT|S3|POSTGRES'

# Full rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache --pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 18. Security Checklist

### Server hardening

- [ ] Non-root `deploy` user created (no direct root login)
- [ ] SSH key authentication only (password login disabled)
- [ ] Root SSH login disabled (`PermitRootLogin no`)
- [ ] UFW firewall enabled: only ports 22, 80, 443 open
- [ ] Automatic security updates configured (`unattended-upgrades`)
- [ ] `vm.swappiness=10` set (reduces swap usage)

### Docker

- [ ] Docker images kept updated (rebuild with `--pull` periodically)
- [ ] `deploy` user added to `docker` group (avoids `sudo` for compose)
- [ ] All containers use `read_only: true` filesystem (immutable at runtime)
- [ ] All containers use `cap_drop: ALL` with minimal `cap_add`
- [ ] All containers use `security_opt: no-new-privileges:true`
- [ ] `init: true` on every container (zombie reaper, PID 1 handling)

### Secrets and configuration

- [ ] `.env` file has `chmod 600` (only readable by owner)
- [ ] `.env` backed up in a password manager
- [ ] Secrets are never committed to git (`.env` in `.gitignore`)
- [ ] `JWT_SECRET`, `POSTGRES_PASSWORD`, `CERT_SIGNING_SECRET` are unique and strong
- [ ] `COOKIE_SECURE=true` when HTTPS is enabled
- [ ] `BASE_URL` and `WEB_ORIGIN` match the public URL exactly

### Network

- [ ] PostgreSQL not exposed to public internet (no `ports:` mapping)
- [ ] Redis not exposed to public internet (no `ports:` mapping)
- [ ] Only nginx publishes host ports (80, 443)
- [ ] All services communicate over the internal `dadan` bridge network

### Data

- [ ] Database backups tested at least once (restore drill)
- [ ] Off-site backup configured (server failure doesn't destroy backups)
- [ ] Upload directory permissions verified (`/opt/dadan/data/uploads/`)
- [ ] Backup retention policy set and verified

### Application

- [ ] HTTPS enabled (Let's Encrypt or Cloudflare)
- [ ] Dev seed data **not** run against production
- [ ] Real SUPER_ADMIN created (not the default seed admin)
- [ ] Stripe key is a real `sk_live_*` key (if payment processing is enabled)
- [ ] Staff accounts created with least privilege

---

## 19. Maintenance

### 19.1 Weekly checklist

```bash
# Check container health
docker compose -f docker-compose.prod.yml ps

# Check disk usage
df -h
docker system df

# Review logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50 --since=7d api | grep -i error

# Verify backup cron is running
ls -la ~/backups/ | tail -5
```

### 19.2 Monthly checklist

- [ ] `sudo apt update && sudo apt upgrade -y` — apply OS security patches
- [ ] `docker compose build --pull` — rebuild images with updated base images, then `docker compose up -d`
- [ ] `docker image prune -af` — remove unused images
- [ ] Review log retention — check `~backups/backup.log` for any backup failures
- [ ] Test a backup restore on a non-production environment
- [ ] Verify off-site backup copies exist
- [ ] Review nginx access logs for unusual traffic patterns
- [ ] `certbot renew --dry-run` — verify TLS renewal still works (if using Let's Encrypt)

### 19.3 Quarterly checklist

- [ ] Rotate secrets: `JWT_SECRET`, `CERT_SIGNING_SECRET`, `POSTGRES_PASSWORD`
- [ ] Full restore drill: rebuild a fresh VPS from documentation and verify the app works
- [ ] Review resource usage trends (CPU, memory, disk) and adjust `mem_limit`/`cpus` if needed
- [ ] Update Docker and Docker Compose to latest stable versions
- [ ] Review security advisories for all base images
- [ ] Audit user accounts and remove inactive ones
- [ ] Review and update this deployment guide with any process changes

---

## 20. Future Improvements

The following improvements are **optional**. They enhance operability, observability, and scalability but are not required for a working production deployment.

### Storage

- **Cloudflare R2 for media offload** — Migrate uploaded files from local disk to R2 for infinite storage, built-in CDN, and automatic backup. The application's storage layer already supports S3-compatible endpoints.
- **CDN for static assets** — Serve `_next/static/*` from a CDN (Cloudflare, Fastly) to reduce server load and improve global load times.

### CI/CD

- **GitHub Actions CD** — Build Docker images in CI, push to a registry (GHCR, Docker Hub), and pull on the server. This removes build tooling from the production VPS and enables image versioning.
- **Staging environment** — A second VPS or Compose project for testing changes before production deployment.

### Monitoring and observability

- **Prometheus + Grafana** — Time-series metrics for CPU, memory, request latency, error rates, and custom application metrics.
- **Loki + Promtail** — Centralized log aggregation with search, filtering, and alerting capabilities.
- **Sentry** — Application error tracking with stack traces, context, and release tracking.

### Automated operations

- **Watchtower** — Automatically update running containers when new images are pushed to the registry.
- **PgBouncer** — Connection pooling for PostgreSQL to handle higher concurrent API load.
- **Point-in-time recovery** — PostgreSQL WAL archiving to S3 for sub-minute recovery granularity.

### Architecture evolution

- **Docker Swarm or Kubernetes** — Multi-node orchestration for high availability, horizontal scaling, and rolling updates.
- **Separate database server** — Move PostgreSQL and Redis to a dedicated VM for resource isolation.
- **Read replicas** — Offload read queries to PostgreSQL replicas when the dataset grows.

> Note: These are enhancements, not prerequisites. The single-server Docker Compose architecture is production-ready for the expected scale. Monitor resource usage (§16) before investing in any of these improvements.

---

## Operations Cheat Sheet

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f --tail=100
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service
docker compose -f docker-compose.prod.yml restart api

# Shell into a container
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U dadan dadan
docker compose -f docker-compose.prod.yml exec redis redis-cli

# Database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U dadan dadan > dump.sql
docker compose -f docker-compose.prod.yml exec -T postgres psql -U dadan dadan < dump.sql

# Rebuild a single service
docker compose -f docker-compose.prod.yml up -d --build api

# Full redeploy
./deploy.sh

# With TLS
./deploy.sh -t

# Disk cleanup
docker image prune -af
docker system prune -f

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop everything and destroy data (irreversible)
docker compose -f docker-compose.prod.yml down -v
```

---

## Appendix: File Reference

| File                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `docker-compose.prod.yml` | Production service definitions, health checks, resource limits |
| `docker-compose.tls.yml`  | TLS override (HTTPS config) — created during §11               |
| `nginx/nginx.conf`        | Reverse proxy configuration                                    |
| `apps/api/Dockerfile`     | Multi-stage NestJS Dockerfile                                  |
| `apps/web/Dockerfile`     | Multi-stage Next.js Dockerfile                                 |
| `deploy.sh`               | Automated deployment with rollback                             |
| `backup.sh`               | Database backup script                                         |
| `restore.sh`              | Database restore script                                        |
| `.env`                    | Environment variables (secrets) — created during §5            |
| `.env.example`            | Environment variable template (safe to commit)                 |
| `docs/DEPLOYMENT.md`      | This document                                                  |
| `docs/MONITORING.md`      | Optional monitoring stack documentation                        |
