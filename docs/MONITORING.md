# DADAN Dijital — Monitoring & Observability

This document describes the project's observability features and how to enable the optional Prometheus/Grafana/Loki monitoring stack.

---

## Quick reference

| Capability | Status | How to access |
|-----------|--------|---------------|
| API health (combined) | ✅ Always on | `GET /health` — checks Prisma + Redis |
| API liveness | ✅ Always on | `GET /health/live` — returns `{ "status": "ok" }` |
| API readiness | ✅ Always on | `GET /health/ready` — checks Prisma + Redis |
| API JSON logging | ✅ Always on | stdout via `JsonLogger` |
| Request ID tracing | ✅ Always on | `x-request-id` header (auto-generated if absent) |
| Nginx JSON access log | ✅ Always on | stdout via `log_format json` |
| Container metrics | 📦 Optional | Enable `docker-compose.monitoring.yml` |
| Log aggregation (Loki) | 📦 Optional | Enable `docker-compose.monitoring.yml` |
| Grafana dashboards | 📦 Optional | Enable `docker-compose.monitoring.yml` |

---

## 1. Logging improvements (always on, no setup required)

### 1.1 API — structured JSON logging

All NestJS log output (API server, request logging, exception filter) is written as newline-delimited JSON to stdout/stderr. Each log line is a flat JSON object:

```json
{"timestamp":"2026-07-04T12:00:00.000Z","level":"info","message":"HTTP GET /api/health - 200 - 5ms"}
```

This is produced by `apps/api/src/common/logger/json-logger.service.ts`, a custom `ConsoleLogger` that replaces the default NestJS text logger. It is injected at `NestFactory.create()` in `main.ts:17`.

### 1.2 Request ID middleware

Every HTTP request receives a unique `x-request-id` header. If the caller already sends one, it is preserved; otherwise, `crypto.randomUUID()` generates one. The ID is:

- Returned in the response as the `x-request-id` header
- Included in request log entries as `requestId`
- Available in the exception filter error response as `requestId` (when present)

This enables correlating a single request across nginx access logs, API logs, and API error responses.

Implementation: `apps/api/src/common/middleware/request-id.middleware.ts`

### 1.3 Request logging middleware

Every HTTP request is logged after the response completes with: method, URL, status code, duration (ms), request ID, user agent, and client IP. Log level is based on status code:

| Status range | Log level |
|-------------|-----------|
| 200–399 | `info` |
| 400–499 | `warn` |
| 500+ | `error` |

Implementation: `apps/api/src/common/middleware/request-logger.middleware.ts`

### 1.4 Nginx — JSON access log

The nginx access log uses a JSON format with these fields:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp |
| `remote_addr` | Client IP (after real-IP resolution) |
| `request` | Full HTTP request line |
| `status` | HTTP status code |
| `body_bytes_sent` | Response body size |
| `request_time` | Request processing time (seconds) |
| `http_referer` | Referer header |
| `http_user_agent` | User-Agent header |
| `x_request_id` | `x-request-id` from the API response |
| `upstream_addr` | Upstream container address |
| `upstream_response_time` | Upstream response time |

Configured in `nginx/nginx.conf:43-59`.

---

## 2. Health endpoints (always on)

Three health check endpoints are available at the API (unauthenticated):

| Endpoint | Type | What it checks | Use case |
|----------|------|----------------|----------|
| `GET /health/live` | Liveness | Returns `{ "status": "ok" }` immediately | Docker HEALTHCHECK, load balancer pings |
| `GET /health/ready` | Readiness | Prisma (SELECT 1) + Redis (PING) | Kubernetes readiness probe, dependency-aware checks |
| `GET /health` | Combined | Prisma + Redis (same as /ready) | General-purpose health check |

Implementation: `apps/api/src/health/` (HealthController, PrismaHealthIndicator, RedisHealthIndicator).

### Docker HEALTHCHECK configuration

Current healthcheck intervals in `docker-compose.prod.yml`:

| Service | Check | Interval | Timeout | Retries | Start period |
|---------|-------|----------|---------|---------|-------------|
| postgres | `pg_isready` | 10s | 5s | 10 | 30s |
| redis | `redis-cli ping` | 10s | 3s | 10 | 10s |
| api | `wget /health` | 10s | 5s | 5 | 40s |
| web | `wget /` | 10s | 5s | 5 | 30s |
| nginx | `wget /api/health/live` | 30s | 10s | 3 | 10s |

The API healthcheck hits `/health` (dependency-aware — checks Prisma + Redis). This means Docker will report the API as unhealthy if either dependency is unreachable, triggering a restart.

---

## 3. Resource monitoring (optional — add the monitoring stack)

The monitoring stack adds five containers for full observability:

| Service | Image | Purpose |
|---------|-------|---------|
| **cAdvisor** | `gcr.io/cadvisor/cadvisor:v0.51.0` | Exposes CPU, memory, network, and disk metrics per container at `:8080/metrics` |
| **Prometheus** | `prom/prometheus:v2.55.0` | Scrapes cAdvisor and stores 30 days of metrics |
| **Loki** | `grafana/loki:3.2.0` | Log aggregation — stores compressed log chunks with 30-day retention |
| **Promtail** | `grafana/promtail:3.2.0` | Ships Docker container logs from `/var/lib/docker/containers` to Loki |
| **Grafana** | `grafana/grafana:11.4.0` | Dashboards for metrics (Prometheus) and logs (Loki). Pre-provisioned with datasources and a container metrics dashboard |

### 3.1 Enable the monitoring stack

```bash
# Standard deployment + monitoring
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

# With TLS + monitoring
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml \
  -f docker-compose.monitoring.yml up -d
```

### 3.2 Access Grafana

Grafana listens on port **3001** (bound to `127.0.0.1` only — not accessible from outside the server without an SSH tunnel or nginx proxy):

```bash
# From the server itself:
curl http://localhost:3001

# From your machine via SSH tunnel:
ssh -L 3001:localhost:3001 deploy@your-server
# Then open http://localhost:3001 in your browser
```

Default login: `admin` / `admin` (change on first login). Set a custom password via `GRAFANA_PASSWORD` in your `.env` file.

### 3.3 Provisioned dashboards

A **Container Metrics** dashboard is provisioned automatically with panels for:

- **CPU** — per-container CPU usage (%)
- **Memory** — RSS and % of limit
- **Network** — RX/TX throughput (bytes/sec)
- **Disk I/O** — read/write throughput (bytes/sec)

All panels use cAdvisor metrics. Additional dashboards can be imported from the [Grafana dashboard marketplace](https://grafana.com/grafana/dashboards/).

### 3.4 Logs in Grafana (Loki)

The Loki datasource is pre-configured in Grafana. To explore logs:

1. Open Grafana → **Explore**
2. Select the **Loki** datasource
3. Query examples:
   ```
   # All API logs
   {container_name=~".*api.*"}
   
   # Errors only
   {container_name=~".*api.*"} |= "error"
   
   # A specific request ID across services
   {container_name=~".*"} |= "abc123-def456"
   ```

Promtail parses JSON log fields (level, timestamp, method, status, etc.) as Loki labels for efficient filtering.

### 3.5 Resource impact

The monitoring stack adds approximately:

| Resource | Estimate |
|----------|----------|
| CPU | ~0.5 cores (mostly idle) |
| Memory | ~600 MB total |
| Disk | ~1 GB for time-series + logs (grows with retention) |

Adjust `mem_limit` values in `docker-compose.monitoring.yml` if the server is resource-constrained. The compose file uses `mem_reservation` (soft limit) and `mem_limit` (hard limit) for each service.

### 3.6 Extending — adding a `/metrics` endpoint to the API

To get application-level metrics (request rate, error rate, Prisma query duration) in Prometheus:

1. Install `@nestjs/terminus` (already present) plus a Prometheus metrics library
2. Add a Prometheus controller at `GET /metrics`
3. Uncomment the `api` job in `monitoring/prometheus/prometheus.yml`
4. Prometheus will start scraping `api:4000/metrics`

---

## 4. File inventory

| File | Purpose |
|------|---------|
| `apps/api/src/common/logger/json-logger.service.ts` | JSON-formatted logger (replaces default NestJS logger) |
| `apps/api/src/common/middleware/request-id.middleware.ts` | Generates/preserves `x-request-id` header |
| `apps/api/src/common/middleware/request-logger.middleware.ts` | Logs every HTTP request after response |
| `apps/api/src/common/filters/http-exception.filter.ts` | Structured error logging (unchanged, reads `x-request-id`) |
| `apps/api/src/main.ts` | Wires up JSON logger and middleware |
| `nginx/nginx.conf` | JSON access log format (`access_log /dev/stdout json`) |
| `docker-compose.monitoring.yml` | Monitoring stack compose override |
| `monitoring/prometheus/prometheus.yml` | Prometheus scrape config |
| `monitoring/loki/loki-config.yml` | Loki storage + retention config |
| `monitoring/promtail/promtail-config.yml` | Promtail Docker log scraping config |
| `monitoring/grafana/datasources/datasources.yml` | Grafana auto-provisioned datasources |
| `monitoring/grafana/dashboards/dashboards.yml` | Grafana dashboard provisioning |
| `monitoring/grafana/dashboards/container-metrics.json` | Container metrics dashboard |
