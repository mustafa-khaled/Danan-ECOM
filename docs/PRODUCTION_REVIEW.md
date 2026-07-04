# Production Readiness Review — DADAN Dijital

**Date:** 4 July 2026  
**Scope:** Docker Compose stack, Dockerfiles, configuration, scripts, CI, monitoring, networking, security, startup order, environment variables, resource usage  
**Target:** Single-server Ubuntu VPS, Docker Compose v2, production traffic  

---

## Score: 8 / 10

The project is **production-ready for a single-server deployment** with a strong security posture, robust operational scripts, and well-structured Docker files. The 2-point gap reflects a handful of medium-severity gaps (documented below) that are worth addressing before or shortly after going live.

### Scoring breakdown

| Category                     | Score | Reasoning |
|------------------------------|-------|-----------|
| Security posture             | 9/10  | Excellent fundamentals. `read_only` + `cap_drop` + `no-new-privileges` on every service. CSP has unavoidable Next.js concessions. |
| Architecture & networking    | 9/10  | Clean bridge network, single public entry point, proper `depends_on` chains. |
| Operability (scripts)        | 9/10  | Comprehensive `backup.sh`, `restore.sh`, `deploy.sh` with validation, safety dumps, and auto-rollback. |
| Monitoring & observability   | 7/10  | Optional stack is thorough (Prometheus + Grafana + Loki + cAdvisor). Missing API `/metrics` endpoint. No alerting configured. |
| CI / build pipeline          | 7/10  | Good coverage but Docker images are never pushed; no env-aware build testing; no DB service in CI. |
| Dockerfiles                  | 8/10  | Well-structured multi-stage builds with BuildKit cache. Minor: unnecessary package.json copies across Dockerfiles. |
| Environment configuration    | 8/10  | Zod validation at runtime. Good defaults. One logic gap in production payment validation. |
| Backup & disaster recovery   | 9/10  | Scripts handle validation, retention, pre-restore snapshots. Off-site replication mentioned but not enforced. |
| Documentation                | 8/10  | `DEPLOYMENT.md` and `MONITORING.md` are thorough. Missing: runbook for common incidents, secrets rotation procedure. |

---

## Table of contents

1. [Critical issues](#1-critical-issues)
2. [Recommended improvements](#2-recommended-improvements)
3. [Optional improvements](#3-optional-improvements)
4. [Audit report by component](#4-audit-report-by-component)
   - [docker-compose.prod.yml](#41-docker-compose-prodyml)
   - [apps/api/Dockerfile](#42-appsapidockerfile)
   - [apps/web/Dockerfile](#43-appswebdockerfile)
   - [nginx/nginx.conf](#44-nginxnginxconf)
   - [.env.example / env.validation.ts](#45-envexample--envvalidationts)
   - [apps/api/src/main.ts](#46-appsapimaints)
   - [backup.sh / restore.sh / deploy.sh](#47-backupsh--restoresh--deploysh)
   - [docker-compose.monitoring.yml](#48-docker-composemonitoringyml)
   - [CI workflow](#49-ci-workflow)
   - [Monitoring configs](#410-monitoring-configs)
5. [Scoring detail](#5-scoring-detail)

---

## 1. Critical issues

### C-01 — Mock payment mode is disabled by env validation in production

**File:** `apps/api/src/config/env.validation.ts:36-51`

The Zod refinement requires `PAYMENT_PROVIDER_KEY` to start with `sk_live_*` or `sk_test_*` when `NODE_ENV=production`. This means the API **cannot start** in production without a real Stripe key — the mock provider is blocked.

**Impact:** If Stripe integration is not yet complete and `NEXT_PUBLIC_PAYMENT_MODE=mock` is intended for production too, the API will refuse to boot.

**Recommendation:** Relax the refinement in production to also allow an empty `PAYMENT_PROVIDER_KEY` (which selects the mock provider in `payments.service.ts:23`). Alternatively, deploy with a test `sk_test_*` key and ensure the Stripe webhook secret is also set. This is a deliberate choice — confirm which path is intended.

---

### C-02 — Redis can start without a password

**File:** `docker-compose.prod.yml:118-121`, `.env.example:79`

```yaml
command:
  - redis-server
  - --appendonly yes
  - --requirepass ${REDIS_PASSWORD}
```

When `REDIS_PASSWORD` is unset (default in `.env.example`), the command becomes `redis-server --appendonly yes --requirepass `, and Redis starts with **no password** (empty string). The API connects to `redis://redis:6379` without auth, so it works — but any container on the same Docker network can connect to Redis without authentication.

**Impact:** On a shared or multi-tenant Docker host (future horizontal scaling), Redis data (rate-limit state, JWT deny-list) could be read or written by a compromised adjacent container.

**Recommendation:** Generate a `REDIS_PASSWORD` in `.env` (same as `POSTGRES_PASSWORD`) and update the API's `REDIS_URL` to include the password: `redis://:${REDIS_PASSWORD}@redis:6379`.

---

### C-03 — Pre-deploy backup file pattern is not covered by retention pruning

**File:** `backup.sh:140`

```bash
find "$BACKUP_DIR" -maxdepth 1 -name 'dadan-*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -exec rm -v {} \;
```

The retention policy only prunes files matching `dadan-*.sql.gz`. Files created by `deploy.sh` (`pre-deploy-dadan-*.sql.gz`) and `restore.sh` (`pre-restore-dadan-*.sql.gz`) are **never cleaned up**. On a busy system with daily deploys, these accumulate indefinitely.

**Impact:** Slow disk bloat over months. A server with weekly deploys accumulates ~100 pre-deploy backups per year (~several GB).

**Recommendation:** Expand the find pattern to also match `pre-deploy-*.sql.gz` and `pre-restore-*.sql.gz`, or add a second prune pass. These safety snapshots are less critical than regular backups and can have a shorter retention (e.g. 7 days).

---

### C-04 — No zero-downtime deployment — brief outage on every deploy

**File:** `deploy.sh:347`

```bash
run docker compose "${COMPOSE_FLAGS[@]}" up -d
```

`docker compose up -d` stops old containers before starting new ones. For a single-replica setup, this creates a window (typically 5–30 seconds) where the web app returns 502/503 until nginx detects the new containers are healthy.

**Impact:** Every deploy causes brief downtime. Acceptable for early production, but plan for blue-green or rolling updates as traffic grows.

**Recommendation (medium-term):** Use Docker Compose's `--scale` with two API replicas and a health-gated nginx upstream, or introduce a simple blue-green pattern with an external load balancer.

---

## 2. Recommended improvements

### R-01 — Add REDIS_PASSWORD to the API connection string

**File:** `docker-compose.prod.yml:178`

```yaml
REDIS_URL: redis://redis:6379
```

Change to:

```yaml
REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

This is the companion fix to C-02. Without it, even if Redis has a password, the API connects without auth.

---

### R-02 — Generate REDIS_PASSWORD in .env.example and the deploy guide

**File:** `.env.example:79`, `docs/DEPLOYMENT.md`

Add a generated password line to `.env.example` (with a comment to regenerate it) and add it to the deployment guide's secrets section:

```bash
openssl rand -hex 24   # -> REDIS_PASSWORD
```

---

### R-03 — Document the mock/provider trade-off in production

**Files:** `apps/api/src/config/env.validation.ts`, `apps/api/src/payments/payments.service.ts`

The Zod refine (C-01) enforces a real Stripe key in production. If this is intentional (recommended), document it clearly in `DEPLOYMENT.md` so a future maintainer doesn't spend an hour debugging the API crash loop.

If the intent is to allow mock payments in production, fix the refine:

```ts
.refine(
  (data) => {
    if (data.NODE_ENV === "production" && data.PAYMENT_PROVIDER_KEY) {
      return (
        data.PAYMENT_PROVIDER_KEY.startsWith("sk_live_") ||
        data.PAYMENT_PROVIDER_KEY.startsWith("sk_test_")
      );
    }
    return true;
  },
```

---

### R-04 — Prune pre-deploy and pre-restore backup files

**File:** `backup.sh:140`

Add a second find pass after the regular backup pruning (modify both the deletion and the logging at lines 140–148):

```bash
# Prune safety snapshots after 7 days
find "$BACKUP_DIR" -maxdepth 1 \( -name 'pre-deploy-*.sql.gz' -o -name 'pre-restore-*.sql.gz' \) \
  -type f -mtime "+7" -exec rm -v {} \; >> "$LOG_FILE" 2>&1
```

---

### R-05 — Wait only for changed services during deploy

**File:** `deploy.sh:357-373`

`deploy.sh` waits for all 5 services (postgres, redis, api, web, nginx) to be healthy after each deployment. Postgres and Redis rarely change and typically pass health quickly. This adds ~10–20 seconds of unnecessary wait.

**Recommendation:** After `docker compose up -d`, check which containers were actually recreated and only wait for those. Compose sets an `io.compose.startup` label on recreated containers that can be inspected:

```bash
RECREATED=$(docker compose ps --format json | jq -r 'select(.State == "recreating") | .Name')
```

---

### R-06 — Add a `/metrics` endpoint to the API

**File:** `monitoring/prometheus/prometheus.yml:27-31` (commented out)

The monitoring stack ships with a commented-out Prometheus scrape target for the API. Enable real metrics by adding Prometheus client metrics (e.g. `@nestjs/terminus` Prometheus metrics middleware or `prom-client`) at `/metrics`.

This enables Grafana dashboards for:
- Request rate, error rate, and duration (RED metrics)
- Active database connections
- S3 operation latency

---

### R-07 — Add Postgres `max_connections` configuration

**File:** `docker-compose.prod.yml`

Postgres defaults to `max_connections = 100`. The API uses Prisma with a default connection pool of `num_cpu * 2 + 1` connections per instance. With 1 API replica on a 2 vCPU server, that's ~5 connections — well within limits. However, under high load or after adding PgBouncer, the default may be too low.

**Recommendation:** Either:
1. Accept the default and monitor (simpler), or
2. Set a custom `postgresql.conf` via a bind mount or the postgres image's config mechanism.

Document the decision in `DEPLOYMENT.md`.

---

### R-08 — The API Dockerfile copies unnecessary package.json stubs

**File:** `apps/api/Dockerfile:46`

```dockerfile
COPY apps/web/package.json apps/web/
```

The API Dockerfile does not need the web app's `package.json` to resolve dependencies during `pnpm install` — pnpm resolves the lockfile without it. Same applies in reverse for `apps/web/Dockerfile:45`.

**Recommendation:** Remove cross-package `package.json` copies from each Dockerfile. The lockfile (`pnpm-lock.yaml`) already encodes the full dependency graph — pnpm only needs the lockfile and the target package's manifest.

---

### R-09 — Compose healthcheck for API and web duplicates Dockerfile HEALTHCHECK

Both Dockerfiles and `docker-compose.prod.yml` define health checks for `api` and `web`. While the compose healthcheck **overrides** the Dockerfile one (so there's no runtime conflict), the Dockerfile HEALTHCHECK becomes dead code at runtime.

**Recommendation:** Remove the `HEALTHCHECK` instruction from both Dockerfiles (lines 104-105 in `apps/api/Dockerfile` and lines 106-107 in `apps/web/Dockerfile`). The compose file is the source of truth for the runtime healthcheck parameters. This avoids confusion when someone reads the Dockerfile and expects those intervals to apply.

---

### R-10 — `numfmt` may not be available on minimal systems

**File:** `restore.sh:177`

```bash
UNCOMPRESSED_SIZE=$(gunzip -c "$BACKUP_FILE" | wc -c | numfmt --to=iec 2>/dev/null || echo "unknown")
```

`numfmt` is part of GNU coreutils and is present on Ubuntu but may be absent on Alpine or other minimal systems. The fallback `|| echo "unknown"` handles this gracefully.

**Recommendation:** Accept the current fallback. No code change needed. Flag documented for awareness.

---

## 3. Optional improvements

### O-01 — Container health check alerting

The monitoring stack is optional and has no alerting rules configured. Consider adding:
- Prometheus `Alertmanager` with notification routing (email, webhook)
- Grafana alert rules for container restarts, disk usage, and error rate spikes

### O-02 — Docker image tagging

All images are `latest` — no version tags. Consider tagging images with the git SHA during CI builds (even without pushing to a registry) for traceability:

```yaml
api:
  build:
    context: .
    dockerfile: apps/api/Dockerfile
    tags:
      - danan-api:latest
      - danan-api:${GIT_SHA:-latest}
```

### O-03 — `depends_on` for nginx → postgres/redis

nginx's healthcheck ultimately depends on the API, which depends on postgres and redis. The dependency chain is transitive. Add an explicit (documentation-only) `depends_on` for clarity:

```yaml
nginx:
  depends_on:
    api:
      condition: service_healthy
    web:
      condition: service_healthy
```

Note: this doesn't change behaviour — nginx already waits for api + web via its healthcheck.

### O-04 — Security scanning of production Docker images

The CI workflow runs Trivy on the filesystem (`scan-type: fs`). Consider adding a Docker image scan step after the Docker build to detect OS-level vulnerabilities in the final image:

```yaml
- name: Scan API image
  uses: aquasecurity/trivy-action@0.29.0
  with:
    scan-type: image
    scan-ref: danan-api
    format: table
    severity: HIGH,CRITICAL
```

### O-05 — Content-Security-Policy hardening review

The CSP in `nginx/nginx.conf:183` includes `unsafe-inline` and `unsafe-eval` for Next.js compatibility. After the Next.js version is upgraded or if the app moves away from eval-based source maps, audit and remove these directives to harden XSS protection.

### O-06 — Rate limiting for unauthenticated endpoints

nginx rate limits are global (`20r/s` for API, `60r/s` for general). Consider finer-grained limits:
- Stricter rate on `/api/auth/*` (login attempts: 5r/s)
- Stricter rate on `/api/verify/*` (certificate verification: 10r/s)
- More lenient rates on `GET /api/collections/*` and `GET /api/pieces/*`

### O-07 — Graceful shutdown tuning for the API

The API has `stop_grace_period: 30s` and uses NestJS shutdown hooks. Under heavy load, in-flight requests may exceed 30s. Consider:
- Increasing `stop_grace_period` to 60s
- Adding a health endpoint that returns `503` during shutdown (Kubernetes-style readiness gate) — Docker Compose doesn't use this natively, but it's useful if you later add a load balancer.

### O-08 — `.dockerignore` can exclude more files

**File:** `.dockerignore`

The current `.dockerignore` is reasonable. Consider adding:
- `docs/` — not needed in production images
- `scripts/` (if any exist) — not needed in production images
- `*.test.*`, `*.spec.*`, `__tests__/` — test files are not needed at runtime

These are already mostly excluded by the Dockerfile's COPY patterns (the builder stage copies specific directories), but `.dockerignore` saves sending the build context to the Docker daemon in the first place.

---

## 4. Audit report by component

### 4.1 `docker-compose.prod.yml`

| Check | Status | Notes |
|-------|--------|-------|
| `read_only: true` on all services | ✅ | Present on all 5 services |
| `cap_drop: ALL` on all services | ✅ | Present on all 5 services |
| `security_opt: no-new-privileges` | ✅ | Present on all 5 services |
| `init: true` on all services | ✅ | Present on all 5 services |
| Health checks on all services | ✅ | All 5 have `healthcheck` blocks |
| `depends_on` with `condition: service_healthy` | ✅ | Full chain: api←postgres+redis, web←api, nginx←web+api |
| Log rotation | ✅ | All services: 10 MB, 3 files |
| Resource limits (mem_limit) | ✅ | All services |
| CPU limits (cpus) | ✅ | All services |
| `tmpfs` for writable dirs | ✅ | All services have `/tmp`; nginx also has `/var/run`, `/var/cache/nginx` |
| Explicit network (not `default`) | ✅ | `dadan` bridge network |
| Only one service exposes host ports | ✅ | Only nginx has `ports:` block |
| No privileged containers | ✅ | No `privileged: true` |
| Redis password may be empty | ❌ | C-02 |
| nginx stop_grace_period short (10s) | ⚠️ | Acceptable — nginx handles graceful shutdown fast |

### 4.2 `apps/api/Dockerfile`

| Check | Status | Notes |
|-------|--------|-------|
| Multi-stage build | ✅ | base → deps → builder → runner |
| Non-root user | ✅ | `nestjs` (uid 1001) |
| BuildKit cache mounts | ✅ | pnpm store + turbo cache |
| `--frozen-lockfile` | ✅ | Reproducible installs |
| No `--chown` in COPY | ✅ | Files owned by root:root |
| Only runtime deps in final image | ✅ | Only openssl kept |
| HEALTHCHECK in Dockerfile | ⚠️ | Overridden by compose — dead code (R-09) |
| Copies unnecessary package.json | ⚠️ | `apps/web/package.json` not needed (R-08) |
| `image_pull_policy` not set | N/A | Not a Kubernetes concept — Docker always uses local then pulls |

### 4.3 `apps/web/Dockerfile`

| Check | Status | Notes |
|-------|--------|-------|
| Multi-stage build | ✅ | base → deps → builder → runner |
| Non-root user | ✅ | `nextjs` (uid 1001) |
| BuildKit cache mounts | ✅ | pnpm store + turbo cache |
| `--frozen-lockfile` | ✅ | Reproducible installs |
| No `--chown` in COPY | ✅ | Files owned by root:root |
| Next.js standalone output | ✅ | Minimal runtime image |
| Zero extra Alpine packages | ✅ | Only busybox wget (bundled) |
| HEALTHCHECK in Dockerfile | ⚠️ | Overridden by compose — dead code (R-09) |
| Copies unnecessary package.json | ⚠️ | `apps/api/package.json` not needed (R-08) |

### 4.4 `nginx/nginx.conf`

| Check | Status | Notes |
|-------|--------|-------|
| `server_tokens off` | ✅ | Hides nginx version |
| HSTS header | ✅ | `max-age=31536000; includeSubDomains; preload` |
| X-Frame-Options | ✅ | `DENY` |
| X-Content-Type-Options | ✅ | `nosniff` |
| Content-Security-Policy | ⚠️ | `unsafe-inline` and `unsafe-eval` weaken it (Next.js requirement) |
| Permissions-Policy | ✅ | Restricts camera, mic, geolocation, FLoC |
| Referrer-Policy | ✅ | `strict-origin-when-cross-origin` |
| Rate limiting | ✅ | 20 r/s API, 60 r/s general |
| `client_max_body_size` | ✅ | 20 MB (matches storage service) |
| JSON access log | ✅ | Structured, ingestible by Loki |
| Gzip compression | ✅ | Text content only |
| HTTPS redirect via `if` | ⚠️ | Uses `if ($redirect_to_https)` — safe because it checks a map, not a regex |
| proxy buffering | ✅ | On, with reasonable buffer sizes |
| Real-IP trust | ✅ | Docker subnets + optional Cloudflare |
| HTTP/2 cleartext (h2c) | ⚠️ | `listen 80 http2` — browsers don't support h2c; harmless but misleading |

### 4.5 `.env.example` / `env.validation.ts`

| Check | Status | Notes |
|-------|--------|-------|
| Zod schema for env validation | ✅ | Comprehensive with defaults and constraints |
| Required vars validated at startup | ✅ | Missing required vars crash the API with a clear message |
| Sensible defaults for optional vars | ✅ | COOKIE_SECURE, S3_REGION, VAT_RATE, etc. |
| Production-specific refinements | ⚠️ | Payment key validation is strict (C-01) |
| REDIS_PASSWORD not generated | ❌ | C-02 |
| CLIENT_SESSION_DAYS validated | ✅ | 1–90 day range |
| JWT_SECRET length enforced | ✅ | Minimum 32 chars |
| CERT_SIGNING_SECRET length enforced | ✅ | Minimum 16 chars |

### 4.6 `apps/api/src/main.ts`

| Check | Status | Notes |
|-------|--------|-------|
| `trust proxy` set | ✅ | `app.set("trust proxy", 1)` — one hop (nginx) |
| Helmet middleware | ✅ | Standard security headers |
| CORS configured | ✅ | `WEB_ORIGIN` + `BASE_URL` allowlist |
| Cookie parser | ✅ | For cookie-based auth |
| Validation pipe | ✅ | `whitelist: true`, `forbidNonWhitelisted: true` |
| Request ID middleware | ✅ | Generates UUID, sets `x-request-id` response header |
| Request logger middleware | ✅ | JSON structured logging to stdout/stderr |
| Global exception filter | ✅ | Catches all exceptions, logs structured, returns JSON |
| Shutdown hooks | ✅ | `app.enableShutdownHooks()` for graceful shutdown |

### 4.7 `backup.sh` / `restore.sh` / `deploy.sh`

| Check | Status | Notes |
|-------|--------|-------|
| `set -euo pipefail` | ✅ | All three scripts |
| Pre-flight validation | ✅ | Docker, compose, file existence |
| Backup retention policy | ✅ | Configurable, default 14 days |
| Gzip validation before restore | ✅ | `gunzip -t` |
| Pre-restore safety snapshot | ✅ | Created before overwriting |
| Post-restore validation | ✅ | Queries table count |
| Pre-deploy backup | ✅ | In deploy.sh |
| Auto-rollback on health failure | ✅ | Git checkout + rebuild + restart |
| Colored output | ✅ | tput with ANSI fallback |
| Dry-run mode (deploy.sh) | ✅ | `./deploy.sh -d` |
| Pre-deploy and pre-restore backups not pruned | ❌ | C-03 |
| `BACKUP_DIR` default consistency | ✅ | `$HOME/backups` in all scripts |
| Graceful handling of missing `numfmt` | ✅ | R-10 |

### 4.8 `docker-compose.monitoring.yml`

| Check | Status | Notes |
|-------|--------|-------|
| Prometheus configured | ✅ | 30-day retention, 15s scrape interval |
| Grafana auto-provisioned | ✅ | Prometheus + Loki datasources, container metrics dashboard |
| Loki configured | ✅ | JSON log parsing, 30-day retention |
| Promtail configured | ✅ | Reads Docker JSON logs, parses structure |
| cAdvisor configured | ✅ | Container CPU/memory/network/disk metrics |
| No alerting | ⚠️ | O-01 |
| API `/metrics` not scraped | ⚠️ | R-06 |
| Loki `auth_enabled: false` | ⚠️ | Acceptable for internal-only network |

### 4.9 CI workflow

| Check | Status | Notes |
|-------|--------|-------|
| Lint + typecheck | ✅ | Separate job |
| Tests | ✅ | `pnpm test` |
| Build (pnpm) | ✅ | Separate job after code quality |
| Docker build verification | ✅ | Both images built (no push) |
| Security scanning | ✅ | `pnpm audit` + Trivy filesystem scan |
| Turbo cache | ✅ | Cache keyed by git SHA with fallback |
| Concurrency cancellation | ✅ | Cancel in-progress on new push |
| No deployment step | ✅ | Intentional — deploy via `deploy.sh` on server |
| No true DB service for tests | ⚠️ | `DATABASE_URL` is set but no Postgres container runs — tests must mock Prisma |

### 4.10 Monitoring configs

| Check | Status | Notes |
|-------|--------|-------|
| Prometheus scrape configs | ✅ | cAdvisor + self-metrics; API commented out |
| Grafana datasource provisioning | ✅ | Prometheus + Loki |
| Grafana dashboard provisioning | ✅ | Container metrics dashboard |
| Loki retention | ✅ | 30 days (720h) |
| Promtail log parsing | ✅ | JSON pipeline stages for structured logs |
| cAdvisor host mounts | ⚠️ | Mounts `/:/rootfs:ro`, `/sys`, `/var/lib/docker:ro` — expected, but wide access |

---

## 5. Scoring detail

| Area | Score | Why not higher |
|------|-------|---------------|
| **Security** | 9/10 | CSP has unavoidable Next.js concessions; Redis password is optional (C-02); cAdvisor needs broad host mounts. |
| **Architecture** | 9/10 | Single-server with clean dependency graph. No zero-downtime deploys (C-04). |
| **Operability** | 9/10 | Scripts are production-quality. Pre-deploy backup retention gap (C-03). |
| **Observability** | 7/10 | Optional stack is good but requires opt-in. No API `/metrics`. No alerting. |
| **CI/CD** | 7/10 | Good coverage. No Docker image push. No DB service for tests. |
| **Dockerfiles** | 8/10 | Well-structured. Minor dead code and unnecessary copies. |
| **Configuration** | 8/10 | Zod validation is excellent. Payment provider validation conflict (C-01). |
| **Documentation** | 8/10 | Comprehensive. No incident runbook or secrets rotation procedure. |

**Final score: 8/10**

---

## Appendix: Files reviewed

| File | Lines | Role |
|------|-------|------|
| `docker-compose.prod.yml` | 351 | Production service definitions |
| `docker-compose.monitoring.yml` | 234 | Monitoring stack override |
| `apps/api/Dockerfile` | 110 | API image build |
| `apps/web/Dockerfile` | 113 | Web image build |
| `nginx/nginx.conf` | 266 | Reverse proxy configuration |
| `.env.example` | 79 | Environment variable template |
| `apps/api/src/config/env.validation.ts` | 76 | Zod env schema |
| `apps/api/src/main.ts` | 48 | NestJS bootstrap |
| `apps/api/docker-entrypoint.sh` | 10 | API container entrypoint |
| `apps/api/src/health/health.controller.ts` | 40 | Health endpoints |
| `apps/api/src/health/prisma.health.ts` | 26 | Prisma health check |
| `apps/api/src/health/redis.health.ts` | 30 | Redis health check |
| `apps/api/src/common/logger/json-logger.service.ts` | 58 | JSON structured logger |
| `apps/api/src/common/middleware/request-id.middleware.ts` | 14 | Request ID generation |
| `apps/api/src/common/middleware/request-logger.middleware.ts` | 39 | Request logging |
| `apps/api/src/common/filters/http-exception.filter.ts` | 108 | Global exception handler |
| `apps/api/src/redis/redis.service.ts` | 57 | Redis client |
| `apps/api/src/payments/payments.service.ts` | 148 | Payment processing |
| `apps/api/src/prisma/prisma.service.ts` | 11 | Prisma client |
| `apps/api/src/app.module.ts` | 50 | Module wiring |
| `apps/web/next.config.ts` | 18 | Next.js configuration |
| `backup.sh` | 154 | Database backup script |
| `restore.sh` | 258 | Database restore script |
| `deploy.sh` | 407 | Deployment automation |
| `.dockerignore` | 13 | Build context filter |
| `.github/workflows/ci.yml` | 168 | CI pipeline |
| `turbo.json` | 23 | Turborepo configuration |
| `monitoring/prometheus/prometheus.yml` | 33 | Prometheus config |
| `monitoring/loki/loki-config.yml` | 47 | Loki config |
| `monitoring/promtail/promtail-config.yml` | 55 | Promtail config |
| `monitoring/grafana/datasources/datasources.yml` | 23 | Grafana datasources |
| `monitoring/grafana/dashboards/dashboards.yml` | 19 | Grafana dashboard provisioning |

**Total: 33 files, ~2,400 lines reviewed.**
