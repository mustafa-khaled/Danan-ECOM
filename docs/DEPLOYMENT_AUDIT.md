# DADAN Dijital — Deployment Audit Report

**Date:** 2026-07-04  
**Scope:** Full repository deployment architecture, infrastructure, and operations readiness  
**Auditor:** Senior DevOps Engineer

---

## Severity Legend

| Level        | Meaning                                                                             |
| ------------ | ----------------------------------------------------------------------------------- |
| **Critical** | Immediate production risk — data loss, security breach, or total outage             |
| **High**     | Significant risk or operational gap — should be addressed before production go-live |
| **Medium**   | Notable gap — plan to address within first operational quarter                      |
| **Low**      | Minor improvement or automation opportunity                                         |

---

## 1. Current Deployment Architecture

### Summary

Single-server Docker Compose deployment. Five containers run on one Linux host: `nginx` (reverse proxy), `web` (Next.js), `api` (NestJS), `postgres` (PostgreSQL 16), `redis` (Redis 7). Uploads stored locally on the VPS at `/opt/dadan/data/uploads`; no external object storage required.

### Diagram (simplified)

```
Internet → [Firewall :80/:443] → nginx:80
                                    ├── / → web:3000 (Next.js)
                                    └── /api/ → api:4000 (NestJS)
                                                     ├── postgres:5432
                                                     ├── redis:6379
                                                     └── local storage (/opt/dadan/data/uploads)
```

### Key characteristics

| Aspect          | Detail                                                              |
| --------------- | ------------------------------------------------------------------- |
| Hosting model   | Self-hosted, single VM (2 vCPU, 4 GB RAM minimum)                   |
| Orchestration   | Docker Compose v2 (no Kubernetes, no Swarm)                         |
| TLS termination | Optional — nginx TLS config provided as separate compose override   |
| Port exposure   | Only port 80 (and optionally 443) exposed; all other ports internal |
| DNS             | Cloudflare proxied (recommended) or direct A record                 |

### Findings

| ID      | Severity   | Finding                                                                                                                                                                                                                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARCH-01 | **High**   | **Single point of failure.** Entire platform runs on one server. Host failure = total outage. No failover, no HA, no multi-region.                                                                                                                                           |
| ARCH-02 | **Medium** | **No horizontal scaling.** The Compose model limits all services to a single replica. The API and web cannot be scaled independently without migrating to an orchestrator (K8s, Nomad, or Docker Swarm).                                                                     |
| ARCH-03 | **Medium** | **TLS is optional.** The default `docker-compose.prod.yml` exposes plain HTTP on port 80. TLS requires manual setup of a separate config and override file. A misconfiguration can leave production serving plaintext.                                                       |
| ARCH-04 | **Low**    | **Next.js rewrite in dev uses `/backend`, production uses `/api`.** This dual-path means the same codebase behaves differently depending on environment. The `next.config.ts` rewrite lives in version control with a default of `http://localhost:4000`, which is dev-only. |

---

## 2. Docker Architecture

### Overview

Monorepo with two Docker images (`apps/api/Dockerfile`, `apps/web/Dockerfile`), both using multi-stage builds on `node:20-alpine`.

### API Dockerfile (`apps/api/Dockerfile`)

| Stage     | Base             | Purpose                                                                                      |
| --------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `base`    | `node:20-alpine` | Install system deps (openssl, libc6-compat), activate pnpm                                   |
| `deps`    | `base`           | Copy dependency manifests, install with `--frozen-lockfile`                                  |
| `builder` | `deps`           | Copy source, generate Prisma client, build all packages                                      |
| `runner`  | `node:20-alpine` | Minimal runtime — copies built artifacts, creates non-root user `nestjs`, sets `USER nestjs` |

### Web Dockerfile (`apps/web/Dockerfile`)

| Stage     | Base             | Purpose                                                                                                            |
| --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `base`    | `node:20-alpine` | Activate pnpm                                                                                                      |
| `deps`    | `base`           | Copy manifests, install dependencies                                                                               |
| `builder` | `deps`           | Copy source, build Next.js with `output: standalone`                                                               |
| `runner`  | `node:20-alpine` | Minimal runtime — copies `.next/standalone` and `.next/static`, creates non-root user `nextjs`, sets `USER nextjs` |

### Findings

| ID        | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                      |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DOCKER-01 | **Medium** | **No `.dockerignore` for individual apps.** The root `.dockerignore` excludes `.env`, but the build context is the entire monorepo root. Turbo cache, git history, and other apps' `node_modules` are sent to the Docker daemon. While `.dockerignore` excludes `node_modules` and `.git`, the build context is still unnecessarily large (~hundreds of MB). |
| DOCKER-02 | **Medium** | **Prisma `postinstall` runs inside Docker unnecessarily.** `packages/db/package.json` has `"postinstall": "prisma generate"`. During the `deps` stage, this runs Prisma generation before the source is copied. The `builder` stage then runs it again via `prisma generate`. This duplicates work and adds build time.                                      |
| DOCKER-03 | **Low**    | **No explicit image tagging strategy.** `docker compose -f docker-compose.prod.yml build` produces untagged images (or default Compose project tags). There is no versioning, no CI registry push, no immutable image digests for rollback.                                                                                                                  |
| DOCKER-04 | **Low**    | **No health check in API Dockerfile.** The HEALTHCHECK is defined in compose, which is correct (Compose-level checks are more flexible), but the Dockerfile `EXPOSE 4000` is informational only.                                                                                                                                                             |
| DOCKER-05 | **Low**    | **Web Dockerfile does not copy `apps/web/public/` explicitly.** Next.js standalone output should include `public/` but it relies on the framework's behavior. A manual check is advisable after builds to confirm static assets are present.                                                                                                                 |

---

## 3. Docker Compose Architecture

### Dev (`docker-compose.yml`)

Minimal — only Postgres (port 5433) and Redis (port 6379). Apps run via `pnpm dev` (Turbo).

### Production (`docker-compose.prod.yml`)

Full stack — 5 services with health checks, resource limits, and dependency ordering.

| Service    | Image/Build                 | Resource Limits         | Health Check                  | Depends On                |
| ---------- | --------------------------- | ----------------------- | ----------------------------- | ------------------------- |
| `postgres` | `postgres:16-alpine`        | 1 CPU, 1 GB RAM         | `pg_isready` (5s)             | —                         |
| `redis`    | `redis:7-alpine`            | 0.5 CPU, 256 MB RAM     | `redis-cli ping` (5s)         | —                         |
| `api`      | Build `apps/api/Dockerfile` | 1 CPU, 512 MB RAM       | `wget /health` (10s)          | postgres, redis (healthy) |
| `web`      | Build `apps/web/Dockerfile` | 1 CPU, 512 MB RAM       | `wget /` (10s)                | api (healthy)             |
| `nginx`    | `nginx:1.27-alpine`         | 0.5 CPU, 128 MB RAM `1` | `wget /api/health/live` (30s) | web, api (healthy)        |

`1` — Nginx reservation is 32 MB, but unit test shows `1` — likely a typo or formatting issue. The actual value in compose is `32M`.

### Findings

| ID         | Severity     | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| COMPOSE-01 | **Critical** | **Secrets passed as plain environment variables in compose.** `docker-compose.prod.yml` passes `JWT_SECRET`, `CERT_SIGNING_SECRET`, `POSTGRES_PASSWORD`, `S3_SECRET_KEY`, `PAYMENT_PROVIDER_SECRET`, `SMTP_PASS`, and `REDIS_PASSWORD` as environment variables. These are visible in `docker inspect`, `docker compose config`, Compose logs, and any process listing. Docker Compose supports `secrets` (bind-mounted files) — sensitive values should use secrets or at minimum be referenced from a `.env` file at runtime (already partially done via `${VAR:?error}` interpolation). |
| COMPOSE-02 | **High**     | **`restart: unless-stopped` on all services without `stop_grace_period`.** The default Docker stop grace period is 10 seconds. For the API handling payments or long-running certificate generation, this may cause abrupt termination. A `stop_grace_period: 30s` or longer should be set.                                                                                                                                                                                                                                                                                                |
| COMPOSE-03 | **High**     | **No `depends_on` condition for nginx on non-healthy web/api.** While `depends_on` is set, it only waits for containers to start, not to become healthy. The nginx `healthcheck` will catch this, but nginx will serve 502/503 for a window during startup. Use `condition: service_healthy` on the nginx `depends_on` entries.                                                                                                                                                                                                                                                            |
| COMPOSE-04 | **Medium**   | **No CPU/Memory reservations on postgres and redis in dev compose.** The dev compose has no resource constraints. A runaway dev build can starve the database containers.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| COMPOSE-05 | **Medium**   | **`REDIS_PASSWORD` is required in prod but Redis URL does not use it.** `REDIS_URL=redis://redis:6379` in compose does not include `:${REDIS_PASSWORD}@`. The Redis command sets `--requirepass ${REDIS_PASSWORD}`, but the API connects without authentication. This appears to be a bug — either the password is unused (redundant) or the API cannot authenticate.                                                                                                                                                                                                                      |
| COMPOSE-06 | **Low**      | **No `networks` defined.** Services use the default Compose network. While functional, explicit network definitions with names improve clarity and enable network-level isolation policies.                                                                                                                                                                                                                                                                                                                                                                                                |

---

## 4. Security Issues

This section cross-references and extends the existing `docs/SECURITY_HARDENING.md`.

| ID     | Severity     | Issue                                                                                                                                                                                               | Source                     |
| ------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| SEC-01 | **Critical** | **Secrets in compose environment variables** (see COMPOSE-01). Sensitive values exposed via `docker inspect`, logs, and `/proc`.                                                                    | `docker-compose.prod.yml`  |
| SEC-02 | **High**     | **Admin transfer responses include `houseKey` (bcrypt hash).** Leaked hashes enable offline brute-force.                                                                                            | `SECURITY_HARDENING.md` H1 |
| SEC-03 | **High**     | **VIEWER admin role can write.** The roles guard allows any active admin to mutate resources.                                                                                                       | `SECURITY_HARDENING.md` H2 |
| SEC-04 | **High**     | **No server-side session revocation on logout.** Stolen JWTs cannot be invalidated.                                                                                                                 | `SECURITY_HARDENING.md` M3 |
| SEC-05 | **Medium**   | **JWT returned in login response body.** Defeats httpOnly cookie protection if XSS is present.                                                                                                      | `SECURITY_HARDENING.md` M1 |
| SEC-06 | **Medium**   | **Unvalidated admin PATCH bodies (mass assignment).** `Record<string, unknown>` passed to Prisma allows writing any field.                                                                          | `SECURITY_HARDENING.md` M2 |
| SEC-07 | **Medium**   | **Upload memory DoS.** No multer `fileSize` limit — large uploads exhaust server RAM.                                                                                                               | `SECURITY_HARDENING.md` M5 |
| SEC-08 | **Medium**   | **Redis exposed without password in URL.** `REDIS_PASSWORD` is set via `--requirepass` but `REDIS_URL` does not include `:password@`.                                                               | `docker-compose.prod.yml`  |
| SEC-09 | **Low**      | **Verification token in GET query string.** HMAC tokens logged in browser history, proxy logs, Referer headers.                                                                                     | `SECURITY_HARDENING.md` L1 |
| SEC-10 | **Low**      | **Unverified JWT decode in verify controller.** Base64-decodes session cookie without verifying signature.                                                                                          | `SECURITY_HARDENING.md` L2 |
| SEC-11 | **Low**      | **No Content Security Policy (CSP) headers.** Nginx sets `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, and `Referrer-Policy` but no CSP.                                                     | `nginx/nginx.conf`         |
| SEC-12 | **Low**      | **`trust proxy` is set to 1** — This is already implemented (verified in `main.ts:14`), but the SECURITY_HARDENING.md lists M4 as unaddressed. Documentation is stale. The fix is already in place. | `apps/api/src/main.ts`     |

---

## 5. Performance Issues

| ID      | Severity   | Finding                                                                                                                                                                                                                                                                                                            |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PERF-01 | **High**   | **Prisma migrations run synchronously on every API container start.** `docker-entrypoint.sh` runs `prisma migrate deploy` before the server boots. During a migration, the API is unavailable. For zero-downtime deployments, migrations should run as a separate one-shot job before the new API instances start. |
| PERF-02 | **Medium** | **No connection pooling.** Prisma connects directly to PostgreSQL. At 1 CPU / 512 MB per API container, each instance opens multiple connections. Without PgBouncer or similar, PostgreSQL may exhaust `max_connections` under load.                                                                               |
| PERF-03 | **Medium** | **No CDN for static assets.** Next.js static files (`_next/static/*`) are served through nginx from the Node.js container. In production, these should be served from a CDN or at minimum from nginx with aggressive caching.                                                                                      |
| PERF-04 | **Medium** | **Nginx rate limits may be too strict for legitimate traffic.** API limit: 20 req/s with burst 40. A single user loading a collection page with many images could trigger this. Consider per-IP rate limiting only on auth endpoints and a higher general limit for the API.                                       |
| PERF-05 | **Low**    | **No gzip/brotli compression configured in nginx.** While nginx default may compress, there is no explicit `gzip on;` or brotli configuration. Adding explicit compression for API JSON responses reduces bandwidth.                                                                                               |
| PERF-06 | **Low**    | **API serves files through Node.js (signed URLs), but the redirect adds latency.** The current design returns presigned S3 URLs from the API, which is correct. However, the health check hits the Node.js process rather than a lightweight endpoint — acceptable at this scale.                                  |

---

## 6. Missing Production Best Practices

| ID      | Severity     | Best Practice                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Current State                   |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| PROD-01 | **Critical** | **No automated off-server backups.** The documented backup strategy uses a local cron job writing to `~/backups` on the same server. If the server dies, backups die with it.                                                                                                                                                                                                                                                                                                                   | `docs/DEPLOYMENT.md` §7         |
| PROD-02 | **High**     | **No monitoring or alerting.** No Prometheus/Grafana, Datadog, New Relic, Sentry, or any APM. Outages are detected only when users report them or someone manually runs `docker compose ps`.                                                                                                                                                                                                                                                                                                    | —                               |
| PROD-03 | **High**     | **No structured logging / log aggregation.** All services log to stdout (Docker logs). There is no centralized log system (Loki, ELK, CloudWatch, etc.). Debugging production issues requires `docker compose logs` across 5 containers.                                                                                                                                                                                                                                                        | —                               |
| PROD-04 | **High**     | **No CI/CD pipeline for deployment.** The CI pipeline (`ci.yml`) runs lint/typecheck/test/build but stops there. Deployments are manual (`git pull && docker compose up -d --build`). No staging environment, no automated rollback, no approval gates. _Partial fix:_ `deploy.sh` automates the deploy sequence with auto-rollback on health check failure, pre-deploy DB backup, and coloured logging. A full CI/CD pipeline (build in CI, push to registry, pull on server) is still absent. | `.github/workflows/ci.yml`      |
| PROD-05 | **High**     | **No zero-downtime deployment strategy.** `docker compose up -d --build` recreates containers with a brief service interruption. The API can be unavailable for 10-30 seconds during migration + startup. _Partial fix:_ `deploy.sh` waits for all 5 services to report healthy after restart, and rolls back automatically if they don't. True zero-downtime (blue-green, rolling updates) is not implemented.                                                                                 | `docs/DEPLOYMENT.md` §8         |
| PROD-06 | **Medium**   | **No health check on dev compose.** The dev `docker-compose.yml` has no health checks for Postgres or Redis. `pnpm dev` can fail confusingly if the database is not ready.                                                                                                                                                                                                                                                                                                                      | `docker-compose.yml`            |
| PROD-07 | **Medium**   | **No staging or preview environment.** No infrastructure for testing changes before production deployment. The CI pipeline runs tests but does not deploy to any environment.                                                                                                                                                                                                                                                                                                                   | —                               |
| PROD-08 | **Medium**   | **No database migration safety.** `prisma migrate deploy` runs automatically on API start. A bad migration (destructive change) cannot be prevented by a review gate. Migrations should be reviewed, tested in staging, and run as a separate step.                                                                                                                                                                                                                                             | `apps/api/docker-entrypoint.sh` |
| PROD-09 | **Medium**   | **No graceful shutdown handling.** While `enableShutdownHooks()` is called, there is no explicit handling for in-flight requests during SIGTERM. NestJS has built-in support, but no custom shutdown logic (e.g., finish active certificate generation, complete payment processing).                                                                                                                                                                                                           | `apps/api/src/main.ts`          |
| PROD-10 | **Low**      | **No Docker build cache optimization.** The deps stage copies `package.json` for every workspace, which is correct. However, the builder stage could benefit from copying source only after deps are cached. Current approach is reasonable for this scale.                                                                                                                                                                                                                                     | `apps/api/Dockerfile`           |
| PROD-11 | **Low**      | **No `docker system prune` automation.** Old images and build cache accumulate on the server. The deployment guide mentions manual `docker image prune -f` but does not automate it.                                                                                                                                                                                                                                                                                                            | `docs/DEPLOYMENT.md` §9         |

---

## 7. Resource Usage Estimation

### Per-container estimates (production load)

| Service   | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage                                          |
| --------- | ----------- | --------- | -------------- | ------------ | ------------------------------------------------ |
| postgres  | 256m        | 1         | 256M           | 1G           | Volume: variable (start ~100 MB, grow with data) |
| redis     | 64m         | 0.5       | 64M            | 256M         | Volume: minimal (AOF + RDB, < 1 GB typical)      |
| api       | 128m        | 1         | 128M           | 512M         | Ephemeral (no persistent storage)                |
| web       | 128m        | 1         | 128M           | 512M         | Ephemeral (no persistent storage)                |
| nginx     | 32m         | 0.5       | 32M            | 128M         | Ephemeral (no persistent storage)                |
| **Total** | **~608m**   | **4**     | **~608M**      | **2.4 GB**   |                                                  |

### Host-level requirements

| Resource | Minimum (dev/test) | Recommended (production) |
| -------- | ------------------ | ------------------------ |
| vCPU     | 2                  | 4                        |
| RAM      | 4 GB               | 8 GB                     |
| Disk     | 40 GB SSD          | 80 GB SSD                |
| Network  | 100 Mbps           | 1 Gbps                   |

### Scaling considerations

- **API is the bottleneck** under load (certificate PDF generation is CPU-intensive, S3 uploads are I/O-bound).
- **Postgres** will be the next bottleneck as data grows (single-server, no read replicas).
- **Redis** usage is light (rate limiting, JWT deny-list placeholder) — unlikely to be a bottleneck.

---

## 8. Network Topology

### Current

```
Internet
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Host (single server)                                 │
│                                                        │
│  ┌──────────┐   :80/:443                              │
│  │  nginx   │◄────────────────── Internet             │
│  │  1.27    │                                          │
│  └────┬─────┘                                          │
│       │                                                │
│   ┌───┴───┐                                           │
│   │       │                                           │
│   ▼       ▼                                           │
│ ┌────┐ ┌────┐  Docker network (bridge: default)       │
│ │web │ │api │                                          │
│ │:3000│ │:4000│                                        │
│ └────┘ └─┬──┘                                         │
│           │                                            │
│     ┌─────┼─────┐                                      │
│     │     │     │                                      │
│     ▼     ▼     ▼                                      │
 │  ┌────┐ ┌────┐                                       │
│  │ pg │ │redis│                                       │
│  │:5432│ │:6379│                                       │
│  └────┘ └────┘                                       │
│                                                        │
│  Volumes: postgres_data, redis_data                    │
└──────────────────────────────────────────────────────┘
```

### Findings

| ID     | Severity   | Finding                                                                                                                                                                                                                                                                                                                     |
| ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NET-01 | **Medium** | **No network isolation between services.** All containers are on the default bridge network. Postgres and Redis are reachable from the web container, which has no business connecting to them directly. A separate `backend` network for DB/cache/storage and a `frontend` network for web/nginx would limit blast radius. |
| NET-02 | **Low**    | **No `network_mode` or custom DNS configuration.** Docker Compose DNS resolution is adequate for single-host, but if migrating to Swarm or K8s, service discovery will need rework.                                                                                                                                         |

---

## 9. Volume Strategy

| Volume          | Service  | Mount                      | Purpose               | Backup Required                           |
| --------------- | -------- | -------------------------- | --------------------- | ----------------------------------------- |
| `postgres_data` | postgres | `/var/lib/postgresql/data` | Database files        | Yes — critical                            |
| `redis_data`    | redis    | `/data`                    | AOF + RDB persistence | Yes — rate limit state, session deny-list |

### Findings

| ID     | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VOL-01 | **High**   | **No volume backup automation in Docker.** The backup strategy (section 7 of DEPLOYMENT.md) relies on `pg_dump` via cron, not on volume snapshots. While `pg_dump` is the correct approach (consistent backups), there is no automated verification that backups are succeeding. A missed cron job (e.g., disk full) goes unnoticed until recovery is needed. |
| VOL-02 | **Medium** | **Redis volume has no backup strategy.** `redis_data` is persisted with AOF, but there is no documented procedure for backing up or restoring Redis data. Loss of Redis means rate limit counters reset (acceptable) but also the JWT deny-list (if implemented) is lost — users who logged out would have their JWTs become valid again.                     |
| VOL-03 | **Low**    | **No volume driver configuration.** Both volumes use the default `local` driver. For multi-host setups, a shared volume driver (e.g., `rclone`, `rexray`) would be needed. Acceptable for single-server.                                                                                                                                                      |

---

## 10. Logging Strategy

### Current approach

All services log to **stdout/stderr** — captured by Docker's logging driver. No structured logging, no log shipping, no central aggregation.

| Service  | Logger                                    | Format                    | Detail Level                                                                                                       |
| -------- | ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| api      | NestJS `Logger` + `GlobalExceptionFilter` | Unstructured text         | Info-level: request method, url, status, requestId, userAgent, ip. Error: full stack trace (dev) or message (prod) |
| web      | Next.js built-in                          | Unstructured text         | Standard request logging                                                                                           |
| nginx    | nginx `access_log` / `error_log`          | Combined format (default) | Standard access + error logs                                                                                       |
| postgres | PostgreSQL logging                        | Unstructured text         | Error-level only (default)                                                                                         |
| redis    | Redis logging                             | Unstructured text         | Notice-level (default)                                                                                             |

### Findings

| ID     | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOG-01 | **High**   | **No centralized log aggregation.** Production debugging requires SSH + `docker compose logs -f` across 5 containers. There is no search, no correlation, no alerting on error patterns. _Partial fix:_ `docker-compose.monitoring.yml` adds Loki + Promtail + Grafana. Enable with `-f docker-compose.monitoring.yml`.                                                                                     |
| LOG-02 | **Medium** | **No structured JSON logging.** NestJS and nginx logs are free-form text. Parsing with log aggregation tools (Loki, ELK, CloudWatch) requires regex-based parsing, which is fragile. Structured JSON logs would enable efficient querying. _Fix:_ API now uses `JsonLogger` (newline-delimited JSON); nginx uses `log_format json`. Both outputs are structured and parseable without regex.                |
| LOG-03 | **Medium** | **API logs do not include correlation IDs across requests.** While `requestId` is logged, there is no mechanism to trace a user action across API calls (e.g., checkout flow spans 3-4 API calls). _Fix:_ `requestIdMiddleware` generates/sets `x-request-id` on every request; `requestLoggerMiddleware` includes `requestId` in each log entry. The same ID flows through nginx → API → response headers. |
| LOG-04 | **Low**    | **No log retention policy.** Docker's default logging driver (`json-file`) can fill the disk if logs are not rotated. Docker supports `--log-opt max-size=10m max-file=3` but this is not configured in compose. _Already fixed:_ Every service in `docker-compose.prod.yml` has `logging.driver: json-file` with `max-size: 10m` and `max-file: 3`.                                                        |

---

## 11. Backup Strategy

### Current (documented in DEPLOYMENT.md §7)

| Asset            | Method                                  | Schedule         | Retention      | Off-site                                              |
| ---------------- | --------------------------------------- | ---------------- | -------------- | ----------------------------------------------------- |
| PostgreSQL       | `pg_dump` via cron                      | Nightly at 03:15 | 14 days        | Manually suggested (`rclone to R2`) but not automated |
| Redis            | None                                    | —                | —              | —                                                     |
| `.env`           | Manual                                  | On change        | Indefinite     | Password manager (documented)                         |
| Uploads          | Local disk (`/opt/dadan/data/uploads/`) | Manual `rsync`   | Per deployment | Included in VPS backup                                |
| Certificate PDFs | Regeneratable from DB                   | —                | —              | —                                                     |

### Findings

| ID        | Severity     | Finding                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BACKUP-01 | **Critical** | **No automated off-site backup.** The backup cron writes to `~/backups` on the same server. A server failure (disk corruption, ransomware, hardware failure) destroys both the database and its backups. The deployment guide suggests `rclone` but does not implement it. _Partial fix:_ `backup.sh` and `restore.sh` scripts now exist at the repo root; `rclone` upload remains a manual addition. |
| BACKUP-02 | **High**     | **No backup monitoring.** There is no alert if the nightly dump fails (disk full, cron not running, postgres down). A failed backup goes undetected until a restore is attempted. _Partial fix:_ `backup.sh` validates the backup (gunzip -t, non-empty check), logs to `backup.log`, and exits non-zero on failure — a cron wrapper or external monitor can alert on the exit code.                  |
| BACKUP-03 | **High**     | **No documented restore drill.** The restore command is provided (`gunzip -c ...                                                                                                                                                                                                                                                                                                                      | psql`) but there is no evidence it has been tested. Untested backups are not backups. *Fix:* `restore.sh` provides a guided restore with pre-snapshot, confirmation prompt, and post-restore validation. |
| BACKUP-04 | **Medium**   | **No Redis backup.** Redis data (rate limit counters, and future JWT deny-list) is not backed up. While rate limit data loss is acceptable, a JWT deny-list loss after a restart means all previously-logged-out sessions become valid again.                                                                                                                                                         |
| BACKUP-05 | **Low**      | **No point-in-time recovery (PITR).** `pg_dump` provides a snapshot, not continuous archiving. Data loss window is up to 24 hours (between nightly dumps). For a luxury platform with ownership records, WAL archiving for PITR should be considered.                                                                                                                                                 |

---

## 12. Secrets Management

### Current approach

| Secret                                             | Storage                                                | Access                                                               |
| -------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| `JWT_SECRET`                                       | `.env` file (chmod 600) + compose environment variable | Visible to any process on the server, any user with `docker inspect` |
| `POSTGRES_PASSWORD`                                | `.env` file + compose environment variable             | Same as above                                                        |
| `CERT_SIGNING_SECRET`                              | `.env` file + compose environment variable             | Same as above                                                        |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY`                  | `.env` file + compose environment variable             | Same as above                                                        |
| `PAYMENT_PROVIDER_KEY` / `PAYMENT_PROVIDER_SECRET` | `.env` file + compose environment variable             | Same as above                                                        |
| `REDIS_PASSWORD`                                   | `.env` file + compose environment variable             | Same as above                                                        |
| `SMTP_PASS`                                        | `.env` file + compose environment variable             | Same as above                                                        |

### Findings

| ID         | Severity     | Finding                                                                                                                                                                                                                                                                                     |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SECRETS-01 | **Critical** | **All secrets in compose environment variables** (see COMPOSE-01/SEC-01). This is the single most impactful security finding. Docker Compose supports file-based secrets via `secrets:` block (bind-mounted files at `/run/secrets/`). All sensitive values should use this mechanism.      |
| SECRETS-02 | **Medium**   | **`.env` file is shared between dev and prod.** The same `.env` file (or `.env.example`) contains both dev defaults and production secrets. There is risk of committing production secrets to git (`.env` is in `.gitignore`, but a stray copy or accidental `git add -f` could leak them). |
| SECRETS-03 | **Medium**   | **No secrets rotation policy.** There is no documented process for rotating secrets (JWT_SECRET, CERT_SIGNING_SECRET, etc.). The deployment guide generates them once during initial setup and never mentions rotation.                                                                     |
| SECRETS-04 | **Low**      | **Stripe webhook secret (`PAYMENT_PROVIDER_SECRET`) has no documented verification.** If Stripe Elements is integrated later, webhook signature verification will need the secret. The current `mock` mode does not validate signatures.                                                    |

---

## 13. CI/CD Readiness

### Current CI Pipeline (`.github/workflows/ci.yml`)

```yaml
Events: push/PR to main
Steps: 1. Checkout
  2. Setup pnpm
  3. Setup Node.js 20 (cached)
  4. pnpm install --frozen-lockfile
  5. pnpm lint
  6. pnpm typecheck
  7. pnpm test
  8. pnpm build
```

### Findings

| ID      | Severity   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CICD-01 | **High**   | **No deployment pipeline.** CI stops after build. Deployments are entirely manual (SSH + git pull + compose up). No staging environment, no canary, no rollback automation. _Partial fix:_ `deploy.sh` adds auto-rollback and health check verification.                                                                                                                                                                                                                                                                                                                       |
| CICD-02 | **Medium** | **No Docker image build/push in CI.** Images are built on the production server itself. This means: (a) build tools and dependencies are on the prod server (security risk), (b) builds consume prod server CPU/memory, (c) there is no immutable image registry for audit trail. Best practice: build images in CI, push to a registry (Docker Hub, GHCR, ECR), pull on the server. _Partial fix:_ CI now verifies both Dockerfiles compile (`docker-build` job using `docker/build-push-action` with GHA cache). Images are still built on the server for actual deployment. |
| CICD-03 | **Medium** | **No database migration step in CI.** Prisma migrations are not run or validated in CI. A migration that works locally could fail in production (e.g., different PostgreSQL version, existing data constraints). CI should run `prisma migrate deploy` against a test database.                                                                                                                                                                                                                                                                                                |
| CICD-04 | **Medium** | **No integration tests with real services.** Tests use mocked Prisma and Redis. There is no Docker Compose-based integration test suite that spins up real PostgreSQL + Redis and runs end-to-end tests.                                                                                                                                                                                                                                                                                                                                                                       |
| CICD-05 | **Low**    | **No dependency caching optimization.** While `pnpm/action-setup` caches the store, the action uses `cache: pnpm` which caches `~/.local/share/pnpm/store`. The `pnpm install --frozen-lockfile` step is already cached — this is adequate. _Partial improvement:_ turbo cache (`.turbo` directory) is now persisted via `actions/cache` to speed up repeated runs.                                                                                                                                                                                                            |
| CICD-06 | **Low**    | **No concurrency or cancellation configuration.** The workflow does not use `concurrency` to cancel in-progress runs when a new push happens. On rapid pushes to a PR, multiple CI runs pile up. _Fix:_ `concurrency` group + `cancel-in-progress: true` added.                                                                                                                                                                                                                                                                                                                |
| CICD-07 | **Low**    | **CI only runs on main branch.** Feature branches are not tested in CI unless they target main via PR. This is standard but means branches pushed without a PR (e.g., draft work) skip CI.                                                                                                                                                                                                                                                                                                                                                                                     |

---

## Summary of Critical and High Findings

### Critical (immediate action required)

| ID                               | Area         | Finding                                                                                                           |
| -------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| COMPOSE-01 / SEC-01 / SECRETS-01 | Secrets Mgmt | All secrets exposed as environment variables in Docker Compose — visible via `docker inspect`, logs, and `/proc`. |
| BACKUP-01                        | Backup       | No automated off-site backup — server failure destroys both data and backups.                                     |
| PROD-01                          | Operations   | No automated off-server backups (duplicate of BACKUP-01 — severity warrants double listing).                      |
| SEC-01                           | Security     | Secrets exposed in compose (duplicate, severity warrants emphasis).                                               |

### High (address before or immediately after go-live)

| ID         | Area           | Finding                                                                |
| ---------- | -------------- | ---------------------------------------------------------------------- |
| ARCH-01    | Architecture   | Single point of failure — no HA, no failover.                          |
| SEC-02     | Security       | Admin transfer responses leak bcrypt House Key hashes.                 |
| SEC-03     | Security       | VIEWER admin role has unrestricted write access.                       |
| SEC-04     | Security       | No server-side JWT revocation on logout.                               |
| COMPOSE-02 | Docker Compose | No `stop_grace_period` — risk of abrupt container termination.         |
| COMPOSE-03 | Docker Compose | nginx `depends_on` does not wait for health checks.                    |
| PERF-01    | Performance    | DB migrations run synchronously on every API start — blocks startup.   |
| PROD-02    | Monitoring     | No monitoring or alerting — outages are silent.                        |
| PROD-03    | Logging        | No centralized log aggregation — debugging requires per-container SSH. |
| PROD-04    | CI/CD          | No CD pipeline — manual deployments with no staging or rollback.       |
| PROD-05    | Deployments    | No zero-downtime deployment — brief outage on every deploy.            |
| VOL-01     | Volumes        | No automated backup verification — missed backups go undetected.       |
| LOG-01     | Logging        | No centralized logging (duplicate of PROD-03).                         |
| BACKUP-02  | Backup         | No backup monitoring/alerts.                                           |
| BACKUP-03  | Backup         | No documented restore drill.                                           |
| CICD-01    | CI/CD          | No deployment pipeline (duplicate of PROD-04).                         |
| CICD-02    | CI/CD          | Images built on prod server — build deps on prod, no image registry.   |
| PERF-02    | Performance    | No connection pooling — Prisma connects directly to PostgreSQL.        |

---

## Recommendations (Priority Order)

### Immediate (Week 1)

1. **Move secrets from environment variables to Docker secrets.** All sensitive values (`JWT_SECRET`, `POSTGRES_PASSWORD`, `S3_SECRET_KEY` (if using S3), `CERT_SIGNING_SECRET`, `PAYMENT_PROVIDER_SECRET`, `REDIS_PASSWORD`, `SMTP_PASS`) should be mounted as files at `/run/secrets/` and read by the application. This requires modifying the NestJS config to support file-based secrets.

2. **Implement off-site automated backups.** Add `rclone` to the nightly cron to copy `pg_dump` output to an external object store (S3-compatible or otherwise). Add a monitoring check that the backup file was created successfully.

3. **Fix the Redis password bug.** Ensure `REDIS_URL` includes the password (`redis://:${REDIS_PASSWORD}@redis:6379`) or remove the `--requirepass` if it is not needed.

### Short-term (Weeks 2-4)

4. **Set up centralized logging.** Deploy Loki + Promtail (or a lightweight alternative like Vector) to aggregate Docker logs. Switch API logging to structured JSON.

5. **Implement basic monitoring.** Deploy Prometheus + Grafana (or use a SaaS like Better Stack, Checkly, or Datadog). Monitor: container health, API latency, error rates, disk usage, backup status.

6. **Add CI/CD for deployments.** Build Docker images in CI, push to GHCR, and add a deploy workflow that SSHes into the server and pulls new images. Add a staging environment.

7. **Fix the documented security issues (SEC-02 through SEC-07).** Start with H1 (houseKey leak) and H2 (VIEWER write access), then M1-M5 from SECURITY_HARDENING.md.

8. **Add health check conditions to nginx `depends_on`.** Use `condition: service_healthy` for both web and api.

### Medium-term (Month 2-3)

9. **Add PgBouncer for connection pooling.** Deploy as a sidecar container or alongside postgres.

10. **Implement zero-downtime deployments.** Options: (a) blue-green with Docker Compose using service scaling and multiple networks, or (b) migrate to a proper orchestrator (Nomad, K8s).

11. **Set up a staging environment.** Either a second server or a dedicated Compose project on the same host with different ports/volumes.

12. **Add database migration safety.** Run `prisma migrate deploy` as a separate CI step against a staging DB before production. Consider `prisma migrate diff` to review changes.

### Long-term (Month 3+)

13. **Evaluate orchestrator migration.** Kubernetes (k3s for single-node, EKS/GKE for multi-node) or HashiCorp Nomad. This enables: horizontal scaling, rolling updates, secrets management (Vault), service mesh, and multi-region deployment.

14. **Add point-in-time recovery for PostgreSQL.** Enable WAL archiving to an external object store for continuous backup with sub-minute recovery point objective.

15. **Implement CDN for static assets.** Serve `_next/static/*` from a CDN (Cloudflare, which is already in use, can cache these via a Page Rule or Cache Rule).

---

## Appendix: File Inventory

| File                               | Purpose                                                     |
| ---------------------------------- | ----------------------------------------------------------- |
| `docker-compose.yml`               | Local dev — Postgres + Redis                                |
| `docker-compose.prod.yml`          | Production — full stack with resource limits, health checks |
| `apps/api/Dockerfile`              | Multi-stage NestJS build                                    |
| `apps/web/Dockerfile`              | Multi-stage Next.js build                                   |
| `nginx/nginx.conf`                 | Reverse proxy config                                        |
| `.env.example`                     | Environment variable template                               |
| `.github/workflows/ci.yml`         | CI pipeline (lint, typecheck, test, build)                  |
| `docs/DEPLOYMENT.md`               | Deployment guide                                            |
| `docs/SECURITY_HARDENING.md`       | Security audit                                              |
| `docs/ARCHITECTURE.md`             | Architecture overview                                       |
| `apps/api/src/main.ts`             | Application bootstrap                                       |
| `packages/db/prisma/schema.prisma` | Database schema                                             |
