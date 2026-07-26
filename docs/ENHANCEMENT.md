DADAN Dijital — Deep Application Analysis

Your repo already has excellent internal audit habits (docs/SECURITY_HARDENING.md, docs/REVIEW_FINDINGS.md, docs/DEPLOYMENT_AUDIT.md, docs/PRODUCTION_REVIEW.md), and most of the previously-flagged security issues really were fixed. I independently re-verified every claim in those docs against the current code (they're dated 2 July – 4 July, three weeks stale) and found a mix of "actually fixed", "docs are wrong/stale", and genuinely open gaps. Below is the current, ground-truth picture.

Overall verdict

Security fundamentals of the API itself are strong (auth, guards, IDOR scoping, validation). The three things standing between this and a real production launch are: (1) payment flow is not actually production-safe, (2) two customer-facing features are missing entirely (public certificate verification, admin operational UI), and (3) infra secrets/observability/backup practices are still dev-grade.

1. Critical — must fix before accepting real money/customers

Mock payments can run in production undetected
apps/api/src/config/env.validation.ts:39-54 only enforces a real sk*live*/sk*test* key if PAYMENT_PROVIDER_KEY is set — an empty key still boots fine in NODE_ENV=production and silently falls back to the mock provider (payments.service.ts:75-85), which accepts arbitrary tokens as successful charges. docker-compose.prod.yml:170-171 defaults this to empty. Fix: make the refine .superRefine unconditionally require a real key when NODE_ENV=production, and fail fast.

3-D Secure / async payment confirmation is not implemented
apps/api/src/payments/payments.service.ts:117-119 hardcodes threeDSecure: false; a webhook handler exists (payments.controller.ts) but the synchronous checkout path never creates a PENDING order for it to confirm, so handleChargeEvent on CAPTURED doesn't assign pieces/certificates. Cards requiring 3DS (common in KSA/GCC) cannot complete checkout correctly, and any 3DS webhook confirmation path is dead code.

Public certificate verification page doesn't exist
QR codes on physical certificates point to {BASE_URL}/verify?serial=...&token=... (certificates.service.ts:79), but apps/web/app/verify doesn't exist — only an auth-gated /beta/verify. Every customer who scans a certificate QR code hits a 404. This is a core product feature (authenticity verification) that is silently broken for anyone not logged in. The API endpoint (GET /verify) is already public and rate-limited — this is pure frontend work.

Admin operations UI is read-only
Staff cannot approve/reject transfers, create/edit clients, register pieces, or update order status from the UI (apps/web/app/admin/\*\* — tables only, no mutation forms). The core operational workflow (transfer review) has no way to be performed except by calling the API directly. This blocks day-to-day operations at launch.

Secrets passed as plaintext environment variables
JWT_SECRET, POSTGRES_PASSWORD, CERT_SIGNING_SECRET, PAYMENT_PROVIDER_KEY/SECRET, SMTP_PASS are all injected via environment:/env_file in docker-compose.prod.yml — visible to docker inspect, docker compose config, and any process with host/container access. Should move to Docker secrets: (file-mounted at /run/secrets/) at minimum for POSTGRES_PASSWORD, JWT_SECRET, CERT_SIGNING_SECRET, payment keys.

No off-site backups
backup.sh writes only to local disk ($HOME/backups). A single server failure (disk corruption, ransomware, hardware loss) destroys the database and every backup simultaneously. This is the single highest-impact operational risk for a system whose entire value proposition is an immutable ownership ledger.

TLS setup is fragile / inconsistent with docs
nginx/nginx.conf now hard-requires Let's Encrypt certs at /etc/letsencrypt/live/dadan.co/\*.pem in the default compose file, but docs/DEPLOYMENT.md and deploy.sh -t still reference a separate docker-compose.tls.yml override that doesn't exist in the repo. A fresh deploy without pre-provisioned certs will fail nginx startup outright, and there's no documented certbot bootstrap step matching the current config.

2. High — should fix shortly after or just before launch

Redis has no stop_grace_period / hardening matching its peers (docker-compose.prod.yml:90-116) — no read_only, cap_drop, resource limits present on other services.

REDIS_PASSWORD still ships empty in .env.example:92 — Redis boots with --requirepass "" (no auth) unless an operator manually generates one.

Single flat Docker network — Postgres and Redis are reachable from the web container, which has no legitimate reason to talk to either. No network segmentation between edge/app/data tiers.

Certificate PDFs are served from an unauthenticated, non-expiring path under local storage (uploads.controller.ts is @Public(), local-storage.provider.ts:66-68 just returns /api/uploads/{key}) — anyone with a leaked/guessed key can fetch it forever; no signed-URL expiry like the S3-provider design intends.

Order status has no state machine — updateOrderStatus (orders.service.ts:305-314) accepts any transition (e.g. CANCELLED → FULFILLED), unlike the well-built transfer FSM.

Refund is not wired to order cancellation — cancelOrder only permits PENDING orders, which can never exist (checkout creates PAID directly), so client-initiated cancellation is dead code with no real refund path.

Certificate generation failures can leave OWNED pieces with no active certificate — retries are in-process setTimeout (lost on process restart), then just an audit-log entry. No reconciliation job or admin alert exists to catch pieces missing a certificate.

CI has no deployment or image-registry step — push: false on Docker builds; deploys are entirely manual SSH + deploy.sh. No staging environment.

Migrations run synchronously on every API container start (docker-entrypoint.sh:4-6), causing a brief unavailability window on every deploy — no separate migration job.

No zero-downtime deploys — deploy.sh uses docker compose up -d, which stops-then-starts single-replica containers (~5-30s outage per deploy).

No application-level metrics or alerting — no /metrics endpoint (Prometheus scrape target is commented out), and even the optional monitoring stack has no alerting rules configured. Outages are detected only when someone notices.

Test coverage is thin for critical paths: ~4 spec files against ~80 source files in apps/api. No dedicated tests for ClientGuard/AdminGuard behavior, the JWT deny-list, VIEWER write-blocking, the transfer state machine, or payment provider gating (mock vs. live) — exactly the areas where regressions would be most damaging.

Cart race condition: the hold-check → expire → upsert sequence in cart.service.ts:112-128 isn't wrapped in a transaction; low risk at boutique scale but a real race under concurrent load.

Pre-deploy/pre-restore backup snapshots are never pruned (backup.sh:142-143 only matches dadan-_.sql.gz) — slow disk bloat from pre-deploy-_/pre-restore-\* files accumulating indefinitely.

3. Medium — plan within the first operational quarter

Design catalog pages don't exclude pieces currently held in someone else's cart (collections.service.ts:137 filters only by status: AVAILABLE), causing a late failure at checkout instead of hiding unavailable pieces upfront.

updatePiece silently drops the notes field from its DTO.

Serial number collisions throw a generic 500 instead of retrying.

No admin audit-log read API/UI — AuditLog is write-only, so nobody can review the trail without querying the DB directly.

OwnershipRecord.certificateId is never populated despite the schema supporting it, breaking a complete provenance chain.

Upload MIME validation trusts the client-declared Content-Type rather than checking magic bytes.

CORS falls back to localhost:3000 if WEB_ORIGIN is unset — safe default for dev, but worth an explicit fail-fast in production.

sk*test*\* keys are still accepted in NODE_ENV=production, allowing a live deploy to accidentally run against Tap's test environment indefinitely.

Grafana ships with a default admin password fallback in docker-compose.monitoring.yml.

Seed script still prints plaintext House Keys and the admin password to stdout when run (guarded against production by an env check, but a real risk if anyone runs it against a shared/staging DB with real notifications wired up).

4. What's already solid (no action needed)

Auth: httpOnly audience-separated JWTs, bcrypt House Keys/passwords, Redis-backed jti deny-list on logout, login rate limiting, generic anti-enumeration errors.

Authorization: houseKey hash stripped from all client-facing and admin responses; VIEWER role is now globally blocked from mutating requests (not just 4 endpoints); all client-scoped queries filter by clientId/currentOwnerId — no IDOR found across orders/cart/pieces/transfers.

Input validation: global ValidationPipe with whitelist/forbid-non-whitelisted; typed DTOs now on admin collection/design PATCH endpoints (mass-assignment fixed); multer file-size limits in place.

trust proxy correctly set; verify-controller now does signature-checked JWT verification instead of raw base64 decode.

No SQL injection surface (Prisma-only, no unsafe raw queries); no hardcoded secrets in source; no TODO/FIXME markers indicating abandoned work.

Redis URL now correctly includes the password in the API's connection string (an earlier documented bug is fixed).

nginx depends_on now correctly waits on condition: service_healthy for web/api; structured JSON logging; solid backup/restore/deploy scripts with validation and auto-rollback (just missing off-site replication).

Suggested priority order

Payment safety: fail-fast on missing/mock payment key in production; decide and implement the 3DS/async order-confirmation flow before accepting real cards.

Ship the public /verify page — currently a 404 for every real customer who scans a certificate.

Build minimal admin action UI for transfer approve/reject at minimum (the core staff workflow).

Move secrets to Docker secrets:, generate a real REDIS_PASSWORD, add off-site backup replication (rclone to S3/R2).

Fix the TLS bootstrap story so a fresh deploy doesn't fail on missing certs, and reconcile docs/DEPLOYMENT.md/deploy.sh with the current nginx config.

Add an order state machine + wire refund to cancellation, add a certificate-reconciliation job, add network segmentation (db/cache tier vs. web tier).

Add CI Docker image push + a deploy pipeline, app-level /metrics + basic alerting, and expand test coverage around guards/JWT deny-list/payment gating/transfer FSM.

This is an audit/analysis deliverable — say the word if you'd like me to switch to implementing any of these fixes (I'd suggest starting with items 1-3, since they're customer-facing blockers, not just hardening).
