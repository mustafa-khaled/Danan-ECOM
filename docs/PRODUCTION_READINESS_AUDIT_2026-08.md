# DADAN — Production Readiness & Security Audit

**Date:** 2026-08-09
**Scope:** Full repository (NestJS API `apps/api`, Next.js web `apps/web`, Prisma/Postgres `packages/db`, Redis, storage, deployment). **Payments/PSP integration explicitly out of scope** per request; only touched where it intersects order/piece integrity (idempotency, refund-on-failure).
**Method:** Every finding below is anchored to source code that was read in full (not names/comments), with exact file:line citations. Prisma queries and `$transaction` bodies were traced literally. The four existing docs (`SECURITY_HARDENING.md`, `FULL_REVIEW.md`, `REVIEW_FINDINGS.md`, `DEPLOYMENT_AUDIT.md`) were used as a checklist and independently re-verified — most of their Critical/High findings turned out to be **already fixed** in migrations/code dated 2026-07-29 and 2026-08-09; where a doc's claim is stale or wrong, it is called out explicitly. Anything that requires live infrastructure to verify (actual restore execution, TLS cert validity, real production secret values) is marked **UNVERIFIED**, not assumed.

---

## 1. Executive Summary

DADAN's core transactional security — the part that would cause catastrophic, unrecoverable harm if wrong (cross-client data access, double-selling a piece, corrupting ownership history, forging a certificate) — is **substantially better than the existing audit docs suggest**. Every client-facing controller checked (23/23) scopes its Prisma queries by the authenticated session's `clientId`/`currentOwnerId`, never trusts a client-supplied ID. Checkout, transfer initiation, transfer approval, and transfer rejection all run inside `Serializable` transactions with explicit `SELECT ... FOR UPDATE` row locks and re-verify ownership/state _after_ acquiring the lock, not just before. The DB layer backs up nearly every invariant with partial unique indexes and `CHECK` constraints, not just application logic. Refresh tokens use rotation with reuse-detection (stolen-token family revocation), and both client and admin JWTs are audience-separated and re-validated against the DB (not just the JWT signature) on every request, so deactivation/role changes take effect immediately.

That said, this is **NOT PRODUCTION READY today**, for one dominant reason: **the security regression test suite that proves all of the above never runs in CI.** `apps/api/test/critical-paths.e2e-spec.ts` — the only test file covering IDOR, IDOR-on-certificates, concurrent checkout, admin role escalation, and order-FSM enforcement — requires `pnpm --filter @dadan/api test:e2e`, which is invoked **nowhere** in `.github/workflows/ci.yml`. The CI `code-quality` job runs `pnpm test`, which Jest's own config (`testRegex: ".*\.spec\.ts$"`) does not match against `*.e2e-spec.ts` filenames. The result: a real, well-designed test suite exists, gives the team false confidence, and provides **zero automated protection** against a regression that reintroduces an IDOR or breaks the checkout lock. This is compounded by test-quality problems inside that file itself (Section 9 below): several tests' names promise more than their assertions prove (a "concurrent checkout" test that never issues concurrent requests; a "VIEWER cannot write" test that actually tests a client token, not a VIEWER admin).

The second most important finding is architectural, not a code bug: the "signed" certificate download URL (`getSignedUrl`) is not signed and does not expire for the local storage provider — the only storage provider that actually works (S3/R2/Hetzner are unimplemented stubs). This directly contradicts `SECURITY_HARDENING.md`'s claim of "presigned URLs (1h expiry)" and means any certificate PDF, once its URL is known by any means (shared screenshot, browser history on a shared device, server log), is permanently and anonymously downloadable with no re-authorization.

Beyond those two, the remaining findings are genuine but bounded: admin RBAC is coarse (only `SUPER_ADMIN`/`STAFF`/`VIEWER`, so any STAFF account can reassign pieces, change order status, and edit catalog visibility), a cart-hold race allows one client to steal another's in-progress hold under precise timing, transfer's "DADAN contact confirmation" step is audit-only (not a state-machine gate before approval), and secrets are passed as plaintext Compose environment variables (a common, if imperfect, single-VPS trade-off).

**Overall status: NOT PRODUCTION READY.** The blockers are narrow and fixable in days, not weeks — this is a codebase that is close, not one that needs re-architecture.

---

## 2. Severity Summary

| Severity                     | Count |
| ---------------------------- | ----- |
| CRITICAL                     | 1     |
| HIGH                         | 3     |
| MEDIUM                       | 9     |
| LOW                          | 8     |
| INFO / Unverified (non-code) | 5     |

---

## 3. Production Gates

| #   | Gate                                                                                | Status               | Evidence                                                                                                                 |
| --- | ----------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | No cross-client data access (BOLA/IDOR) via any endpoint                            | **PASS**             | All 23 controllers scope by session `clientId`/`currentOwnerId` (Section 6 matrix)                                       |
| 2   | No cross-audience privilege escalation (client JWT on admin routes)                 | **PASS**             | `ClientGuard`/`AdminGuard` both hard-check `aud` claim (`client.guard.ts:44`, `admin.guard.ts:53`)                       |
| 3   | Piece cannot be sold/assigned to two clients concurrently                           | **PASS**             | `orders.service.ts:70-94` `FOR UPDATE` + `Serializable`; DB backstop `one_current_owner_per_piece`                       |
| 4   | Transfer cannot bypass admin approval or double-approve                             | **PASS**             | `transfers.service.ts:496-583`, re-locks + re-checks `DADAN_REVIEW` + re-checks sender still owns piece                  |
| 5   | Ownership history is append-only and reconstructible                                | **PARTIAL**          | DB comment only, no trigger/constraint (Section 7, Invariant 5) — app-layer only                                         |
| 6   | Certificates cannot be forged or served to non-owners at generation time            | **PASS**             | `getClientCertificate`/`getCertificateDownloadUrl` both re-check `currentOwnerId` before signing                         |
| 7   | Certificate URLs cannot be replayed indefinitely by non-owners once issued          | **FAIL**             | C/H-02 — local `getSignedUrl` ignores expiry, returns permanent public path                                              |
| 8   | Public verification never leaks owner PII                                           | **PASS**             | `verify.service.ts:76-97` whitelist-only response                                                                        |
| 9   | Security regression suite runs automatically on every PR                            | **FAIL**             | CRITICAL-01                                                                                                              |
| 10  | Admin RBAC matches least-privilege for financially/legally sensitive actions        | **PARTIAL**          | Only 4 routes are `SUPER_ADMIN`-gated; STAFF blast radius is large (MEDIUM-01)                                           |
| 11  | Secrets not committed / not logged in plaintext in prod paths                       | **PASS** (with note) | `.env`-based, `:?required` guards; seed-script plaintext logging is dev/CI-only                                          |
| 12  | HTTPS enforced, HSTS, secure cookies, CSRF-resistant sessions                       | **PASS**             | nginx HSTS+redirect; `sameSite:"strict"` when `secure` (prod default)                                                    |
| 13  | Global default-deny auth (no route reachable without explicit `@Public()`)          | **PASS**             | `GlobalAuthGuard` is `APP_GUARD`; verified no bypass                                                                     |
| 14  | Mass assignment prevented on all admin mutation DTOs                                | **PASS**             | All PATCH/POST DTOs are typed `class-validator` DTOs; `whitelist:true, forbidNonWhitelisted:true` globally               |
| 15  | Rate limiting on brute-forceable/expensive endpoints                                | **PASS** (with gaps) | Login, house-key, verify, transfer-initiate limited; see MEDIUM-06 for gaps                                              |
| 16  | Error responses never leak stack traces/internals in production                     | **PASS**             | `GlobalExceptionFilter` always returns generic 500 body; stack only server-logged, only non-prod                         |
| 17  | DB-level financial integrity (no negative amounts, FK integrity)                    | **PASS**             | `order_amounts_nonnegative`, `order_item_amounts_nonnegative`, `CartItem` FKs                                            |
| 18  | Order status transitions are a guarded FSM                                          | **PASS**             | `OrdersService.ORDER_TRANSITIONS` (fixes stale `REVIEW_FINDINGS.md` DB-02 claim)                                         |
| 19  | CI enforces lint/typecheck/unit tests/build/dependency+image scanning               | **PASS**             | `.github/workflows/ci.yml` — mature pipeline (fixes stale `DEPLOYMENT_AUDIT.md` CICD claims)                             |
| 20  | Docker Compose runtime hardening (non-root, read-only, cap-drop, healthchecks)      | **PASS**             | Every service: `security_opt`, `cap_drop: ALL`, `read_only`, healthchecks, `depends_on: condition: service_healthy`      |
| 21  | Backups exist, are automated, and are restorable                                    | **PARTIAL**          | Script quality is good; **no off-site replication configured**; restore never proven against real prod data (UNVERIFIED) |
| 22  | Certificate/ownership-changing side effects (PDF regen) are durable across restarts | **PASS**             | BullMQ with 5 retries + exponential backoff (fixes stale `setTimeout` claim); no dead-letter alerting (LOW)              |
| 23  | Health/readiness checks fail closed on DB/Redis outage                              | **PASS**             | `/health/ready` checks both via Terminus; nginx routes `/api/health/live` around them for pure liveness                  |

---

## 4. Issue Table

| ID        | Severity | Area                  | Issue                                                                                                                                                                                                                                                                                                                                                     | Location                                                                                                                  | Status                                          |
| --------- | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| CRIT-01   | CRITICAL | CI/CD, Testing        | Only security/IDOR/concurrency regression suite never runs in CI                                                                                                                                                                                                                                                                                          | `.github/workflows/ci.yml`, `apps/api/jest.config.js`, `test/jest-e2e.config.js`                                          | Open                                            |
| HIGH-01   | HIGH     | Storage, Certificates | "Signed" certificate URL is a permanent public path, not signed/expiring                                                                                                                                                                                                                                                                                  | `packages/storage/src/providers/local-storage.provider.ts:67-70`                                                          | Open                                            |
| HIGH-02   | HIGH     | Testing               | Existing e2e test file has multiple name/assertion mismatches, masking real coverage gaps                                                                                                                                                                                                                                                                 | `apps/api/test/critical-paths.e2e-spec.ts` (tests 1, 4, 6)                                                                | Open                                            |
| HIGH-03   | HIGH     | Transfers             | "DADAN contact confirmation" is audit-log-only; not enforced as an approval gate                                                                                                                                                                                                                                                                          | `transfers.service.ts:482-583`, `:725-740`                                                                                | Open                                            |
| MEDIUM-01 | MEDIUM   | Admin RBAC            | Only 4 endpoints require `SUPER_ADMIN`; any STAFF admin can reassign pieces, change order status, edit catalog visibility, deactivate clients                                                                                                                                                                                                             | `admin/auth/guards/admin.guard.ts`, all `admin-*.controller.ts`                                                           | Open                                            |
| MEDIUM-02 | MEDIUM   | Cart                  | `addToCart` check-then-upsert is not atomic; a concurrent request can silently steal an active (unexpired) hold from another client                                                                                                                                                                                                                       | `cart/cart.service.ts:112-159`                                                                                            | Open                                            |
| MEDIUM-03 | MEDIUM   | Checkout              | Idempotency key includes `Date.now()`, so it is not stable across client retries/double-clicks at the payment-gateway layer (order-level double-sale is still prevented by the piece row lock)                                                                                                                                                            | `cart/cart.service.ts:218-219`                                                                                            | Open                                            |
| MEDIUM-04 | MEDIUM   | Pieces (Admin)        | `assignPiece` has no `FOR UPDATE` lock; concurrent admin assignment of the same piece relies on a DB unique-constraint throw (ugly 500) rather than a graceful conflict                                                                                                                                                                                   | `pieces/pieces.service.ts:402-446`                                                                                        | Open                                            |
| MEDIUM-05 | MEDIUM   | Audit Logging         | `AuditLog` has no request/correlation ID or User-Agent column; cannot join an audit entry back to the HTTP request log by ID                                                                                                                                                                                                                              | `packages/db/prisma/schema.prisma:379-393`, `audit/audit.service.ts`                                                      | Open                                            |
| MEDIUM-06 | MEDIUM   | Rate Limiting         | Certificate download, wardrobe/order listing, and admin login have no endpoint-specific limiter beyond nginx's blanket 20 r/s zone; only house-key validation, admin login, verify, and transfer-initiate have app-level Redis limiters                                                                                                                   | `nginx/nginx.conf:122-123`, service files                                                                                 | Open                                            |
| MEDIUM-07 | MEDIUM   | Reliability           | Certificate generation/regeneration queue jobs have no dead-letter alerting or reconciliation job after 5 retries are exhausted                                                                                                                                                                                                                           | `certificates/jobs/certificate-job.processor.ts`                                                                          | Open                                            |
| MEDIUM-08 | MEDIUM   | Deployment            | Secrets (`JWT_SECRET`, `POSTGRES_PASSWORD`, `CERT_SIGNING_SECRET`, `REDIS_PASSWORD`, `SMTP_PASS`) are plaintext Compose `environment:` values, visible via `docker inspect`/`docker compose config` to anyone with host/Docker-group access                                                                                                               | `docker-compose.prod.yml:70-178`                                                                                          | Open (accepted trade-off, should be documented) |
| MEDIUM-09 | MEDIUM   | Backups               | Backups are local-disk only (`$HOME/backups`); no automated off-site replication; restore has never been executed against real data (UNVERIFIED)                                                                                                                                                                                                          | `backup.sh`, `restore.sh`                                                                                                 | Open                                            |
| LOW-01    | LOW      | Ownership             | Append-only ownership history is enforced only by "never call `.update`/`.delete`" convention in the service layer, not a DB trigger/rule                                                                                                                                                                                                                 | `schema.prisma:212`, `ownership record writes across services`                                                            | Open                                            |
| LOW-02    | LOW      | Auth                  | No account lockout independent of IP (only per-IP rate limit); mitigated by 128-bit house-key entropy and bcrypt cost                                                                                                                                                                                                                                     | `auth.service.ts:52-60`                                                                                                   | Accepted risk                                   |
| LOW-03    | LOW      | Auth                  | House-key candidate loop (`bcrypt.compare` per prefix match) is a theoretical timing side channel on number of same-prefix accounts                                                                                                                                                                                                                       | `auth.service.ts:65-79`                                                                                                   | Accepted risk                                   |
| LOW-04    | LOW      | Admin                 | No MFA on `SUPER_ADMIN` accounts despite highest blast radius (key rotation, transfer approval, cert regen)                                                                                                                                                                                                                                               | `admin-auth.service.ts` (no `mfa`/`totp` anywhere in repo)                                                                | Open                                            |
| LOW-05    | LOW      | Migrations            | Recent index-creation migrations do not use `CREATE INDEX CONCURRENTLY`; fine at current scale, will lock table on a large `Order`/`Piece` table later                                                                                                                                                                                                    | `20260809110000_add_client_orders_placedAt_index/migration.sql`                                                           | Open                                            |
| LOW-06    | LOW      | Seed                  | `seed.ts` logs plaintext house keys/admin passwords to stdout; dev/CI-only, but CI logs are visible to repo collaborators                                                                                                                                                                                                                                 | `packages/db/prisma/seed.ts:324-329`                                                                                      | Accepted (dev/CI only)                          |
| LOW-07    | LOW      | Input Validation      | No `ParseUUIDPipe`/DTO validation on `:id`-style path params anywhere; a malformed UUID reaches Prisma directly and surfaces as a generic `500` (via `PrismaClientValidationError`, uncaught by `mapPrismaError`'s known-error-code switch) instead of a clean `400` — no information leak, just an imprecise status code                                 | All `*.controller.ts` `:id`/`:pieceId`/`:transferId`/`:orderId` params; `common/filters/http-exception.filter.ts:123-138` | Open                                            |
| LOW-08    | LOW      | Transfers             | `confirmSender`/`confirmRecipient` lock only the `TransferRequest` row (`FOR UPDATE`), not the `Piece` row unlike `initiate`/`cancel`/`approve`/`reject`; not currently exploitable (piece `status` is already `TRANSFER_PENDING` and no other code path acts on a `TRANSFER_PENDING` piece), but inconsistent with the locking discipline used elsewhere | `transfers.service.ts:187-278`                                                                                            | Open (defense-in-depth)                         |

---

## 5. Detailed Findings

### CRIT-01 — Security regression tests exist but never run in CI (CRITICAL)

**Location:** `.github/workflows/ci.yml`, `apps/api/jest.config.js:4`, `apps/api/test/jest-e2e.config.js:4`, `apps/api/package.json:10-11`

**Current behavior:** `apps/api/test/critical-paths.e2e-spec.ts` is the single file that tests IDOR (wardrobe, certificate, order cross-client access), concurrent checkout, idempotency, admin role escalation, path traversal, and order-status FSM enforcement against a **real** Postgres+Redis+seeded database (per its own top-of-file comment). It is run via `pnpm --filter @dadan/api test:e2e`, which invokes `jest --config test/jest-e2e.config.js`, whose `testRegex` is `".*\.e2e-spec\.ts$"`.

`ci.yml`'s `code-quality` job instead runs plain `pnpm test`, which uses `apps/api/jest.config.js`'s `testRegex: ".*\.spec\.ts$"`. This regex requires a literal `.` immediately before `spec.ts`; the filename `critical-paths.e2e-spec.ts` has a `-` there, not a `.`, so **it does not match** — confirmed by inspecting both regexes directly, not by trusting either config's name. The `e2e` job in `ci.yml` runs Playwright (`pnpm --filter @dadan/web test:e2e`), which is a separate suite entirely (browser-driven Next.js smoke tests) and never touches `apps/api/test/*.e2e-spec.ts`. Grepping the entire `.github/workflows/` directory and `apps/api/package.json` confirms `test:e2e` for `@dadan/api` is invoked nowhere in automation — only manually, per `docs/DEPLOYMENT_SEEDER_GUIDE.md:65` ("pnpm --filter @dadan/api test:e2e # 28/28"), which is a one-time developer note, not a CI enforcement.

**Attack/failure scenario:** A future PR reintroduces an IDOR (e.g. an engineer "simplifies" `getWardrobePiece` to `findUnique({ where: { id } })` without the `currentOwnerId` filter), or removes the `FOR UPDATE` lock from `createPaidOrder` while refactoring. Lint, typecheck, unit tests (mocked), build, and both Docker/dependency scans all pass — none of them exercise real cross-client authorization or real concurrency. The PR merges to `main` with a green check. The regression ships to production undetected until a client (or an attacker) actually exploits it.

**Root cause:** The e2e test file was written to a jest-e2e config that requires live infrastructure (Postgres+Redis+seed), which is reasonable, but no CI job was ever wired to provision that infrastructure and run it — despite the sibling Playwright `e2e` job in the same workflow already provisioning exactly those service containers for a different purpose.

**Expected behavior:** Every PR to `main` runs `apps/api`'s `test:e2e` against the same Postgres/Redis service containers already defined in the `e2e` job, and a failure blocks merge.

**Fix guidance:** Add a step (or a new job depending on `code-quality`, reusing the `e2e` job's `services:` block) that runs `pnpm exec prisma migrate deploy`, seeds, and then `pnpm --filter @dadan/api test:e2e` before/alongside the Playwright run. Treat this as a release blocker independent of any other finding in this report — it is the control that would have caught most of the rest.

**Regression test:** A CI meta-test: add a workflow-lint step (or a simple Node script executed in CI) asserting that `apps/api/test/critical-paths.e2e-spec.ts` (or any `*.e2e-spec.ts` under `apps/api/test`) was executed in the current run — e.g. have the test suite write a sentinel file/log line and have a final CI step assert its presence. Simpler: just wire the job and treat "0 endpoints exercised by IDOR tests in CI" as the bug; once wired, the existing 28 tests plus the new ones from HIGH-02 become the regression coverage.

---

### HIGH-01 — Certificate "signed" URL is a permanent, unauthenticated public path (HIGH)

**Location:** `packages/storage/src/providers/local-storage.provider.ts:67-70`, `apps/api/src/storage/uploads.controller.ts:60-118`, `apps/api/src/certificates/certificates.service.ts:150-185`

**Current behavior:**

```67:70:packages/storage/src/providers/local-storage.provider.ts
  async getSignedUrl(key: string, _options?: SignedUrlOptions): Promise<string> {
    const safeKey = normalize("/" + key).replace(/^[/\\]+/, "");
    return `${this.publicUrlPrefix}/${safeKey}`;
  }
```

The `_options` parameter (containing `expiresInSeconds`) is explicitly discarded (underscore-prefixed, unused). `getClientCertificate` and `getCertificateDownloadUrl` (`certificates.service.ts:150-185`) both correctly re-check `currentOwnerId === clientId` and `certificate.isActive` **before** calling `getSignedUrl` — so the authorization gate is real at generation time. But the URL it returns, `/api/uploads/certificates/<uuid>.pdf`, is served by `UploadsController`, which is `@Public()` with **no auth check of any kind** — only path-traversal string filtering (`uploads.controller.ts:64-77`). Since S3/R2/Hetzner providers are unimplemented stubs (confirmed via `packages/storage/src/factories/storage-provider.factory.ts` throwing "not implemented"), the local provider — and therefore this behavior — is what actually runs in production (`STORAGE_PROVIDER: ${STORAGE_PROVIDER:-local}` in `docker-compose.prod.yml:166`).

**Attack/failure scenario:** A certificate PDF contains the owner's display name, the piece's serial number, and proof of authenticity/ownership. Once its URL leaks through _any_ channel — a screenshot shared by the client, browser cache/history on a shared or public device, a referrer header from an outbound link, a compromised or curious party with server/CDN log access — anyone with that URL can download it **forever**, from anywhere, with no cookie, no token, no re-authorization, and no way for DADAN to revoke access short of deleting the file. This directly contradicts `SECURITY_HARDENING.md`'s claim ("private R2/S3 bucket; objects served via presigned URLs, 1h expiry") which is **stale/incorrect** for the current codebase — that document describes an intended design, not the shipped one.

**Root cause:** `getSignedUrl`'s `SignedUrlOptions.expiresInSeconds` was designed for a cloud-provider signature scheme (S3/R2) that was never implemented; the local fallback provider was written to just return a static path, and `UploadsController` was made globally public to serve non-sensitive catalog images (a legitimate need) without distinguishing that certificates are not catalog images.

**Compounding issue — the raw storage key is exposed even more directly than the "signed" URL flow suggests.** `getClientCertificate`/`getCertificateDownloadUrl` correctly route through `getSignedUrl` before returning a URL, but two other read paths embed the **raw, unsigned** `Certificate` row (including its `pdfUrl` storage key) directly in their response, bypassing `getSignedUrl` entirely:

```78:78:apps/api/src/pieces/pieces.service.ts
        certificate: p.certificates[0] ?? null,
```

```147:147:apps/api/src/pieces/pieces.service.ts
        certificate: piece.certificates[0] ?? null,
```

`GET /client/wardrobe` and `GET /client/wardrobe/:pieceId` both return this embedded raw certificate object to the (correctly-scoped) owning client. This isn't a new cross-client IDOR — wardrobe access is properly owner-scoped — but it means the storage key reaches the client directly in a JSON payload rather than only via the intended sign-then-redirect flow, making it more likely to be logged, cached, or shared inadvertently, and confirms that URL "signing" is applied inconsistently even for legitimate owner access. The same raw-`pdfUrl` pattern also appears in `certificates.service.ts`'s `listCertificates` (admin list), `regenerate` (admin regen response), and `pieces.service.ts`'s admin `getPieceById` — all admin-facing, lower risk, but still bypass the signing layer.

**Fix guidance (updated):** In addition to making `UploadsController` re-authorize/expire certificate keys (above), strip `pdfUrl` from any certificate object embedded in `getWardrobe`/`getWardrobePiece`/admin list-and-detail responses and require callers to go through `getClientCertificate`/`getCertificateDownloadUrl` (or the admin equivalent) to obtain a URL.

**Expected behavior:** Certificate downloads must be re-authorized on every fetch (not just at link-generation time), or must use a real HMAC-signed, time-boxed token embedded in the URL that `UploadsController` verifies before streaming certificate paths specifically.

**Fix guidance:** Add a signed-token check to `UploadsController` gated on key prefix (e.g., `certificates/`): generate an HMAC over `key + expiry` using `CERT_SIGNING_SECRET` (already used for verification tokens — reuse the pattern in `@dadan/utils`'s `createVerificationToken`/`verifyVerificationToken`), append it as a query param in `getSignedUrl`, and validate + check expiry in `UploadsController` before streaming any `certificates/*` key. Catalog images (`designs/*`, `collections/*`) can remain unauthenticated since they are intentionally public marketing content.

**Regression test:** E2E test: generate a certificate download URL as the owning client, wait (or mock time past `expiresInSeconds`), then assert the URL 403s/404s. Separately, assert that fetching a certificate URL with no cookie at all (as today) is rejected, not streamed.

---

### HIGH-02 — Existing e2e test names do not match their assertions (masks real coverage) (HIGH)

**Location:** `apps/api/test/critical-paths.e2e-spec.ts`

Per the audit's explicit instruction not to trust test titles, each test's actual assertions were read line-by-line. Three concrete mismatches:

1. **"1. Concurrent checkout race condition" (`:83-143`)** never issues two simultaneous requests. It sequentially: client A adds to cart → client B's add is checked only conditionally (`if (secondAdd.status === 400)`) → client A checks out. There is no `Promise.all` of two competing checkouts. The test cannot detect a regression that removes the `FOR UPDATE` lock in `orders.service.ts`, because nothing ever races.
2. **"4. Double-charge prevention (idempotency)" (`:199-258`)** submits checkout twice _sequentially_, but the first checkout already empties the cart (`cartItem.deleteMany` inside `createPaidOrder`), so the second call fails with `CART_EMPTY` — a cart-state check, not the `Order.idempotencyKey` unique-constraint lookup the title claims to test. The actual idempotency mechanism (`orders.service.ts:56-64`) is never exercised.
3. **"6. Admin role escalation prevention" → "VIEWER role cannot perform write operations" (`:293-300`)** authenticates with `amiraCookie` (a **client** JWT) and asserts `401` on an admin route — this is identical to the preceding test and only proves the audience check, not VIEWER-role enforcement. There is no test anywhere in the suite that logs in as an actual `VIEWER`-role admin and asserts a `403` on a write route (the real behavior implemented in `admin.guard.ts:91-100`).

Additionally, both IDOR tests (`:145-197`) are wrapped in `if (wardrobe.body.length > 0)` / `if (orders.body.items?.length > 0)` — if seed data ever changes such that the array is empty, the test **passes without asserting anything**, silently.

**Fix guidance:** Rewrite test 1 to fire two `Promise.all` checkout calls for the same piece and assert exactly one `201`/one `4xx`. Rewrite test 4 to submit the _same_ cart/idempotency scenario twice concurrently (or reuse a captured `idempotencyKey`) without emptying the cart in between. Add a real VIEWER-role fixture (seed one) and assert `403` on a write route. Replace conditional `if (...length > 0)` wrappers with `expect(...length).toBeGreaterThan(0)` so missing fixtures fail loudly instead of skipping silently. This must be paired with CRIT-01 — fixed tests are worthless if they still don't run in CI.

---

### HIGH-03 — Transfer "DADAN contact confirmation" is not an enforced approval gate (HIGH)

**Location:** `apps/api/src/transfers/transfers.service.ts:482-634` (`approve`), `:725-740` (`logContact`), `admin-transfers.controller.ts:59-75`

**Current behavior:** The admin-facing workflow exposes `POST /admin/transfers/:id/contact-sender` and `contact-recipient`, which call `logContact()` — this **only writes an audit log entry** (`TRANSFER_CONTACT_SENDER`/`TRANSFER_CONTACT_RECIPIENT`) and returns `{ success: true }`; it does not touch `TransferRequest.status` or any other gating column. `approve()` (`:482-634`) requires only `transfer.status === DADAN_REVIEW`, re-checked inside the lock — it never checks whether `logContact` was ever called for either party.

**Attack/failure scenario:** This is not an external-attacker vulnerability (only `SUPER_ADMIN` can call `approve`), but a process-integrity gap: a SUPER_ADMIN can approve a high-value transfer (changing legal/luxury ownership records) without DADAN ever having actually contacted sender or recipient to verify the transfer is legitimate and consensual — the two-person verification step the business process implies is advisory-only in code, not enforced. A compromised or coerced SUPER_ADMIN account (or simple human error/haste) can complete an ownership change that bypasses the intended human-verification control entirely.

**Root cause:** The state machine models `INITIATED → SENDER_CONFIRMED → DADAN_REVIEW → APPROVED/REJECTED`; "contact confirmed" was implemented as a side audit action rather than as required boolean state (`senderContactedAt`/`recipientContactedAt`) checked in `approve()`.

**Expected behavior:** `approve()` should refuse to transition out of `DADAN_REVIEW` unless both contact confirmations have been recorded (or an explicit, separately-audited override is used).

**Fix guidance:** Add `senderContactedAt`/`recipientContactedAt` (nullable `DateTime`) columns to `TransferRequest`; have `logContact` set them; have `approve()` throw `BadRequestException` if either is null.

**Regression test:** E2E test: initiate → confirm-sender → confirm-recipient (reaches `DADAN_REVIEW`) → attempt `approve` **without** calling either contact-sender/contact-recipient first → assert rejection. Then call both contact endpoints → assert `approve` now succeeds.

---

### MEDIUM-01 — Admin RBAC is too coarse for the blast radius of STAFF accounts

**Location:** `apps/api/src/admin/auth/guards/admin.guard.ts`, all `admin-*.controller.ts`

Only 4 routes across the entire admin surface carry `@Roles(AdminRole.SUPER_ADMIN)`: `POST /admin/clients/:id/rotate-key`, `POST /admin/transfers/:id/approve`, `POST /admin/transfers/:id/reject`, and cert regeneration (confirmed via grep for `@Roles(`). Every other admin mutation — create/update/deactivate clients (`admin-clients.controller.ts`), assign a piece to any client (`admin-pieces.controller.ts:57-65`), change an order's status (`admin-orders.controller.ts:40-53`), create/update/soft-delete collections and designs including their `visibilityGroups` (which controls what any client can even see or buy) (`admin-collections.controller.ts`) — is reachable by any active `STAFF` admin. `AdminRole` has only 3 values (`SUPER_ADMIN`, `STAFF`, `VIEWER` — `schema.prisma:74-78`), so there is no way to scope a STAFF account to, say, catalog-only or order-fulfillment-only duties.

**Attack/failure scenario:** A single compromised or malicious STAFF credential (which per LOW-04 has no MFA requirement) can reassign any available piece to any client, mark any order `FULFILLED`, deactivate any client account, or quietly narrow/widen catalog visibility groups — all without a second approver, unlike the two SUPER_ADMIN-gated transfer actions.

**Fix guidance:** Either add finer-grained permission flags (e.g. `clients.manage`, `pieces.manage`, `orders.manage`, `catalog.manage`) checked per-route in place of/alongside the 3-value enum, or at minimum promote piece-assignment and order-fulfillment-status changes to `SUPER_ADMIN`-only (or dual-control) given their financial/legal weight, matching the bar already set for transfers.

**Regression test:** Seed a STAFF admin and assert `403` on the newly-restricted routes; assert `200` for a SUPER_ADMIN on the same routes.

---

### MEDIUM-02 — `addToCart` check-then-act race allows stealing another client's active hold

**Location:** `apps/api/src/cart/cart.service.ts:112-159`

```140:156:apps/api/src/cart/cart.service.ts
    const existingCart = await this.prisma.db.cartItem.findUnique({
      where: { pieceId },
    });
    if (existingCart && existingCart.clientId !== clientId) {
      if (existingCart.expiresAt > new Date()) {
        throw new BadRequestException("errors.PIECE_RESERVED");
      }
      await this.prisma.db.cartItem.delete({ where: { id: existingCart.id } });
    }
    ...
    await this.prisma.db.cartItem.upsert({
      where: { pieceId },
      create: { clientId, pieceId, expiresAt },
      update: { clientId, expiresAt, addedAt: new Date() },
    });
```

The ownership/expiry check and the `upsert` are two separate statements, not one atomic operation. If client B's `findUnique` runs in the narrow window before client A's row is committed (or simply loses a race with another concurrent B-vs-B/A-vs-B call), B's `upsert` unconditionally overwrites the row's `clientId`/`expiresAt` via `ON CONFLICT (pieceId) DO UPDATE`, silently reassigning an active, unexpired hold away from A with no error to A. The final-purchase path is still safe (checkout re-verifies `piece.status === AVAILABLE` and `createPaidOrder` locks the piece row), so this cannot cause a double-sale — but it can cause A to lose a hold on an exclusive piece they believed was reserved, which matters for a "one-of-a-kind luxury drop" product.

**Fix guidance:** Wrap the read-check-write in a single `Serializable` transaction with `SELECT ... FOR UPDATE` on the `CartItem` row (or a raw `INSERT ... ON CONFLICT (pieceId) DO UPDATE ... WHERE "CartItem"."expiresAt" < now() OR "CartItem"."clientId" = EXCLUDED."clientId"` to make the guard atomic).

**Regression test:** Fire two concurrent `addToCart` calls (different clients, same piece) and assert exactly one succeeds while the other receives `PIECE_RESERVED`.

---

### MEDIUM-03 — Checkout idempotency key is not stable across retries

**Location:** `apps/api/src/cart/cart.service.ts:218-219`

```218:219:apps/api/src/cart/cart.service.ts
    const sortedPieceIds = cartItems.map((i) => i.pieceId).sort().join("|");
    const idempotencyKey = `checkout_${clientId}_${Date.now()}_${createHash("sha256").update(sortedPieceIds).digest("hex").slice(0, 16)}`;
```

`Date.now()` makes this key different on every call even for the exact same cart contents from the same client seconds apart (e.g. a double-click or client-side retry), which defeats the purpose of the deterministic hash portion. Two rapid duplicate requests would each get their own idempotency key and each call `payments.charge()` as if they were independent — a real double-charge risk at the payment-gateway layer. This is explicitly bounded from becoming a double-_order_ though: `createPaidOrder`'s `FOR UPDATE` lock + `AVAILABLE` status re-check means only one of the two concurrent attempts can actually create an order; the other throws, triggering the automatic `refundFailedCheckout` path (`cart.service.ts:253-266`). Since payment-provider mechanics are explicitly out of scope for this audit, this is flagged as a data-integrity/idempotency-design note rather than scored as a payments finding.

**Fix guidance:** Remove `Date.now()` from the key; derive it purely from `clientId + sortedPieceIds` (or a client-supplied idempotency header) so retries within the cart's hold window collapse to the same key at the payment-provider layer too, not just at the order layer.

**Regression test:** Call `checkout()` twice in immediate succession with identical cart state (before either completes) and assert the computed idempotency keys are equal.

---

### MEDIUM-04 — `assignPiece` lacks row locking

**Location:** `apps/api/src/pieces/pieces.service.ts:402-446`

Unlike every client-facing mutation (checkout, transfer initiate/approve), `assignPiece` reads the piece with a plain `findUnique`, checks `status === AVAILABLE` outside any lock, then runs a transaction that unconditionally sets `status: OWNED, currentOwnerId`. Two admins concurrently assigning the same `AVAILABLE` piece to different clients would both pass the initial check; the DB's `one_current_owner_per_piece` partial unique index on `OwnershipRecord` would reject the second `ownershipRecord.create()`, so no actual double-ownership can persist — but the second admin's request fails with an unhandled `P2002` (raw 500, not a clean `409 Conflict`), and the `Piece.currentOwnerId` update for that request may have already landed depending on statement ordering within its own transaction before the ownership-record insert fails and rolls the whole transaction back (Prisma's `$transaction` will roll back both statements together, so no split-brain state actually results — but the failure mode is ungraceful).

**Fix guidance:** Mirror the `FOR UPDATE` + `Serializable` pattern already used in `orders.service.ts`/`transfers.service.ts` for consistency and a clean `409`.

**Regression test:** Fire two concurrent `assignPiece` calls for the same piece to different clients; assert one succeeds and the other returns a clean `4xx` (not a raw 500).

---

### MEDIUM-05 — AuditLog lacks correlation ID / User-Agent, and several sensitive reads/failures are not audited

**Location:** `packages/db/prisma/schema.prisma:379-393`, `apps/api/src/audit/audit.service.ts`

`AuditLog` captures `actorType, actorId, action, targetType, targetId, metadata, ipAddress, createdAt` — but not a `result` column, a request/correlation ID (the app does generate `x-request-id` per request via `requestIdMiddleware` in `main.ts`), or `User-Agent`. This makes it harder to definitively tie a specific audit entry to a specific HTTP request/log line during an investigation, especially when the same actor performs several similar actions within the same second. `action` is also a free-form `string` parameter on `AuditService.log()` rather than a typed enum, so there is nothing preventing action-name drift/typos across ~30 call sites over time.

Cross-referencing every `audit.log()` call site against the required event list surfaces concrete gaps, not just schema gaps:

- **House Key validation failure is not audited** — only the success path (`auth.service.ts:87-94`) logs; the `UnauthorizedException` thrown at `auth.service.ts:81-82` on a wrong key has no audit trail (only the IP-rate-limit counter reflects it).
- **Certificate viewing and downloading are not audited** — `getClientCertificate` (`certificates.service.ts:150-171`) and `getCertificateDownloadUrl` (`:173-185`) have no `audit.log()` call, so there is no record of who actually accessed a given certificate/PDF, only that one was generated.
- **Public serial verification writes to `VerificationLog`, not `AuditLog`** — correct for the public-facing record, but means verification attempts don't appear in the unified admin audit trail alongside other actor-attributed events.
- Collection/design visibility changes are folded into the generic `COLLECTION_UPDATED`/`DESIGN_UPDATED` actions rather than a dedicated `VISIBILITY_CHANGED` action, making it harder to specifically audit "who changed what a client can see/buy" without diffing metadata payloads.

**Fix guidance:** Add `result String?`, `requestId String?`, and `userAgent String?` columns; thread `request.headers['x-request-id']` through the existing `AuditService.log()` call sites (most already have access to the `Request` object via `getClientIp(req)`); add audit calls for house-key failures (rate-limit-safe — log the attempted prefix, not the raw key) and certificate view/download; consider promoting `action` to a TypeScript string-literal union or enum shared between `AuditService` and its ~30 call sites.

---

### MEDIUM-06 — Rate limiting gaps on non-auth endpoints

**Location:** `nginx/nginx.conf:122-123` (blanket `api_limit: 20r/s`), `app.module.ts` (global `ThrottlerGuard`, 120 req/60s/IP, Redis-backed), service files

App-level, endpoint-specific Redis rate limiting exists for: house-key validation (5/900s, `auth.service.ts:52-60`), admin login (5/900s, `admin-auth.service.ts:41-50`), public verification (30/60s, `verify.service.ts:37-41`), transfer initiation (5/900s per client, `transfers.service.ts:61-69`), and both refresh endpoints (`@Throttle` 10/60s, stricter than the global default). Certificate download, transfer confirm-sender/confirm-recipient, file uploads, and wardrobe/order/collection listing rely solely on the generic global limiter (120 req/min/IP) plus nginx's blanket 20 req/s zone — both generous enough that a single client could still hammer, e.g., the certificate-download redirect endpoint (relevant given HIGH-01) far more than a sensitive, PII-adjacent endpoint should allow. Notably, `GET /uploads/*` is explicitly `@SkipThrottle()`'d (intentional, to not starve legitimate image-heavy page loads) — meaning if HIGH-01's fix adds real authorization there, it should also get a dedicated limiter rather than remaining fully unthrottled.

**Fix guidance:** Add a dedicated `RedisService.isRateLimited` check (or `@Throttle`) on `GET /client/wardrobe/:pieceId/certificate/download` and admin login (currently only IP-based — no per-account lockout signal surfaced to admins).

---

### MEDIUM-07 — No dead-letter alerting for certificate generation

**Location:** `apps/api/src/certificates/jobs/certificate-job.processor.ts`

BullMQ jobs are configured with `attempts: 5, backoff: exponential, removeOnFail: 50` — durable across process restarts, a real improvement over an in-process `setTimeout` retry (which is what `REVIEW_FINDINGS.md` describes and is **no longer accurate**). However, there is no `@OnWorkerEvent('failed')` handler, no alert, and no scheduled reconciliation job that scans for pieces missing an active certificate after all retries are exhausted. A piece could silently end up owned with no valid certificate if PDF generation (e.g. a corrupt design image, a `pdf-lib` exception) fails 5 times.

**Fix guidance:** Add a `@OnWorkerEvent('failed')` handler that logs/alerts on final failure (`job.attemptsMade >= job.opts.attempts`), and a daily cron (alongside the existing `DesignCleanupService`/`CartCleanupService` pattern) that finds pieces with `status IN (OWNED, TRANSFER_PENDING)` and no `Certificate` row with `isActive = true`, then re-enqueues generation and/or pages an operator.

**Concretely, this is worse than "no alert" for transfers specifically:** in `transfers.service.ts`'s `approve()`, the ownership transaction (piece `currentOwnerId`, `OwnershipRecord`, transfer status) commits fully before the `regenerate-certificate` job is even enqueued (`:585-604`, outside the `$transaction`). Certificate archiving/reissuance (`certificates.service.ts:115-132`, which sets the old cert `isActive: false` and creates the new one) happens later, inside the queue worker. If Redis is briefly unavailable when `.add()` is called (only `.catch()`-logged, not retried at the enqueue level) or if all 5 job attempts fail, the piece has a new legal owner while its only `isActive` certificate still names the **previous** owner — a real, if narrow, data-integrity window worth the reconciliation job above, not just a logging improvement.

---

### MEDIUM-08 — Secrets as plaintext Compose environment variables

**Location:** `docker-compose.prod.yml:70-178`

`POSTGRES_PASSWORD`, `JWT_SECRET`, `CERT_SIGNING_SECRET`, `REDIS_PASSWORD`, `SMTP_PASS`, `PAYMENT_PROVIDER_SECRET` are all interpolated from `.env` into plain `environment:` blocks. Anyone with `docker inspect`/`docker compose config` access on the host (or any process capable of reading `/proc/<pid>/environ` for the container) can read all secrets in cleartext. This is mitigated by the fact that host access is already a high-privilege boundary and the compose file otherwise hardens the containers well (`cap_drop: ALL`, `read_only`, `no-new-privileges`), but it remains a real exposure surface relative to Docker secrets/an external secrets manager (Vault, SOPS, etc.).

**Fix guidance:** Not a blocker for a single-VPS launch, but should be documented as an accepted risk (per the existing `docs/SECURITY_EXCEPTIONS.md` pattern used for the Trivy CVE) with a plan to migrate to Docker secrets or an external KMS/secrets manager before scaling beyond a single trusted operator.

---

### MEDIUM-09 — Backups are local-only; restore is unproven

**Location:** `backup.sh`, `restore.sh`

Both scripts are well-engineered: health-checked pre-flight, gzip integrity verification, pre-restore safety snapshot, post-restore table-count validation, retention pruning. However, `BACKUP_DIR` defaults to `$HOME/backups` on the same host as the database — if the VPS is lost (disk failure, provider incident, ransomware), the backups are lost with it. No off-site sync (rclone/S3/etc.) is wired despite being anticipated in commentary elsewhere in `docs/DEPLOYMENT.md`. Additionally, **no evidence exists of `restore.sh` ever being executed against a real (or even staging) dataset** — this is marked **UNVERIFIED**, not assumed working, per the audit's explicit rule.

**Fix guidance:** Add an off-site sync step to `backup.sh` (rclone to S3/B2/etc.) and run one full restore drill into a staging environment before launch, documenting the result.

---

## 6. Client Isolation Matrix

Every client-facing (`ClientGuard`-protected) endpoint, and the exact query/check that enforces isolation.

| Endpoint                                                                                   | Isolation mechanism                                                                                                                                                              | Verified                              |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `GET /client/wardrobe`                                                                     | `pieces.service.ts` `getWardrobe(clientId)` → `where: { currentOwnerId: clientId }`                                                                                              | ✅                                    |
| `GET /client/wardrobe/my-collection`                                                       | scoped by `clientId` param                                                                                                                                                       | ✅                                    |
| `GET /client/wardrobe/:pieceId`                                                            | `getWardrobePiece(clientId, pieceId)` → `findFirst({ where: { id: pieceId, currentOwnerId: clientId } })`                                                                        | ✅                                    |
| `GET /client/wardrobe/:pieceId/certificate`                                                | `getClientCertificate` → re-checks `currentOwnerId: clientId` then `ownerId: clientId, isActive: true`                                                                           | ✅                                    |
| `GET /client/wardrobe/:pieceId/certificate/download`                                       | `getCertificateDownloadUrl` — same double check                                                                                                                                  | ✅ (but see HIGH-01 for URL lifetime) |
| `GET/POST/DELETE /client/saved(/:pieceId)`                                                 | `pieces.service.ts` scoped by `clientId` (composite PK `SavedPiece(clientId, pieceId)`)                                                                                          | ✅                                    |
| `GET/POST/DELETE /client/cart(/:pieceId)`                                                  | `cart.service.ts` scoped by `clientId`; `removeFromCart` uses `deleteMany({ where: { clientId, pieceId } })` (cannot delete another client's item even with a guessed `pieceId`) | ✅                                    |
| `POST /client/checkout`                                                                    | operates only on `cartItem.findMany({ where: { clientId } })`                                                                                                                    | ✅                                    |
| `GET /client/orders`, `GET /client/orders/:orderId`, `POST /client/orders/:orderId/cancel` | `findFirst({ where: { id: orderId, clientId } })` — non-owned order IDs 404, not 403 (no existence leak)                                                                         | ✅                                    |
| `POST /client/transfers/initiate`                                                          | pre-check + locked re-check `currentOwnerId === clientId` before allowing initiation                                                                                             | ✅                                    |
| `POST /client/transfers/:id/confirm-sender`                                                | `findFirst({ where: { id, fromClientId: clientId } })`                                                                                                                           | ✅                                    |
| `POST /client/transfers/:id/confirm-recipient`                                             | `findFirst({ where: { id, toClientId: clientId } })`                                                                                                                             | ✅                                    |
| `POST /client/transfers/:id/cancel`                                                        | `getTransferForSender` → `fromClientId: clientId` only                                                                                                                           | ✅                                    |
| `GET /client/transfers`, `GET /client/transfers/:id`                                       | `OR: [{ fromClientId: clientId }, { toClientId: clientId }]`                                                                                                                     | ✅                                    |
| `GET/PATCH /client/profile`, `GET /client/profile/summary`                                 | operates on `client.clientId` from session only, no ID param accepted                                                                                                            | ✅                                    |
| `GET /client/home/selected-pieces`                                                         | scoped by `clientId` + `visibilityGroups`                                                                                                                                        | ✅                                    |
| `GET /client/collections`, `/collections/:slug`, `/designs/:slug`                          | not owner-scoped (correct — these are catalog reads), but visibility-scoped by `visibilityGroups` + `isActive`/`isVisible` (see Section 7)                                       | ✅                                    |
| `GET /auth/me`                                                                             | `getMe(clientId)` from session `sub` only                                                                                                                                        | ✅                                    |

**No endpoint checked accepts a client-supplied `clientId`/`ownerId` in the body or query string.** The only place a foreign identifier appears in a client-facing DTO is `recipientHouseId` in `InitiateTransferDto`, which is resolved server-side via `findClientByHouseId` (a public, shareable, non-secret 6-character ID — not the login credential) and never trusted for anything beyond "who is the recipient," with full re-validation (`isActive`, `!== self`) before use.

---

## 7. Endpoint Authorization Matrix

All 23 controllers, every route, guard, and role requirement (`@Public()` unless noted; `AdminGuard`/`ClientGuard` implies default-deny `GlobalAuthGuard` is superseded by the explicit guard).

| Controller                        | Route                                                              | Auth        | Roles/Notes                                                                             |
| --------------------------------- | ------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------- |
| `AuthController`                  | `POST /auth/validate-key`                                          | Public      | Rate-limited (5/15min/IP)                                                               |
|                                   | `POST /auth/refresh`                                               | Public      | Throttled 10/min; requires valid refresh cookie                                         |
|                                   | `POST /auth/logout`, `/logout-all`                                 | ClientGuard |                                                                                         |
|                                   | `GET /auth/me`                                                     | ClientGuard |                                                                                         |
| `AdminAuthController`             | `POST /admin/auth/login`                                           | Public      | Rate-limited (5/15min/IP)                                                               |
|                                   | `POST /admin/auth/refresh`                                         | Public      | Throttled 10/min                                                                        |
|                                   | `GET /admin/auth/me`                                               | AdminGuard  |                                                                                         |
|                                   | `POST /admin/auth/logout`, `/logout-all`                           | AdminGuard  | `@AllowViewerWrite()` (VIEWER can log itself out)                                       |
| `ClientProfileController`         | `GET/PATCH /client/profile`, `GET /summary`                        | ClientGuard |                                                                                         |
| `AdminClientsController`          | `GET /admin/clients`, `GET /:id`                                   | AdminGuard  | Any role (read)                                                                         |
|                                   | `POST /admin/clients`, `PATCH /:id`, `POST /:id/visibility-groups` | AdminGuard  | STAFF+ (VIEWER blocked by default write-lock)                                           |
|                                   | `POST /admin/clients/:id/rotate-key`                               | AdminGuard  | **`@Roles(SUPER_ADMIN)`**                                                               |
| `ClientCollectionsController`     | `GET /client/collections`, `/collections/:slug`, `/designs/:slug`  | ClientGuard | Visibility-filtered                                                                     |
| `AdminCollectionsController`      | `GET` routes                                                       | AdminGuard  | Any role                                                                                |
|                                   | `POST/PATCH/DELETE` collections/designs, image upload, specs       | AdminGuard  | STAFF+                                                                                  |
| `ClientWardrobeController`        | all routes                                                         | ClientGuard | Owner-scoped (Section 6)                                                                |
| `ClientSavedController`           | all routes                                                         | ClientGuard | Owner-scoped                                                                            |
| `AdminPiecesController`           | `GET` routes                                                       | AdminGuard  | Any role                                                                                |
|                                   | `POST /admin/pieces`, `PATCH /:id`, `POST /:id/assign`             | AdminGuard  | STAFF+ (no finer role split — MEDIUM-01)                                                |
| `ClientOrdersController`          | all routes                                                         | ClientGuard | Owner-scoped                                                                            |
| `AdminOrdersController`           | `GET` routes                                                       | AdminGuard  | Any role                                                                                |
|                                   | `PATCH /:id/status`                                                | AdminGuard  | STAFF+ (FSM-guarded)                                                                    |
| `CartController`                  | all routes                                                         | ClientGuard | Owner-scoped                                                                            |
| `CheckoutController`              | `POST /client/checkout`                                            | ClientGuard |                                                                                         |
| `ClientTransfersController`       | all routes                                                         | ClientGuard | Sender/recipient-scoped                                                                 |
| `AdminTransfersController`        | `GET` routes                                                       | AdminGuard  | Any role                                                                                |
|                                   | `POST /:id/approve`, `/:id/reject`                                 | AdminGuard  | **`@Roles(SUPER_ADMIN)`**                                                               |
|                                   | `POST /:id/contact-sender`, `/contact-recipient`                   | AdminGuard  | STAFF+ (audit-only, HIGH-03)                                                            |
| `ClientCertificatesController`    | `GET`, `GET /download`                                             | ClientGuard | Owner-scoped (Section 6)                                                                |
| `VerifyController`                | `GET`/`POST /verify`                                               | Public      | Rate-limited 30/60s/IP; whitelisted response                                            |
| `AdminVerificationLogsController` | `GET /admin/verification-logs`                                     | AdminGuard  | Any role                                                                                |
| `ClientHomeController`            | `GET /client/home/selected-pieces`                                 | ClientGuard | Owner+visibility scoped                                                                 |
| `PaymentsController`              | `POST /payments/webhook`                                           | Public      | HMAC signature-verified; rejects unsigned/tampered                                      |
| `HealthController`                | `GET /health`, `/live`, `/ready`                                   | Public      | No sensitive data returned                                                              |
| `UploadsController`               | `GET /uploads/*`                                                   | Public      | Path-traversal filtered only — **no auth** (see HIGH-01 for the one place this matters) |

No endpoint was found where an admin route's `@Roles` decorator was missing where sensitive, nor where a client route trusted a body/query-supplied identity field over the session.

---

## 8. Database Invariant Report

| #   | Invariant                                                                                                 | Enforcement  | Evidence                                                                                                                                                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Piece serial numbers are unique                                                                           | **DB**       | `Piece.serialNumber @unique` (`schema.prisma:190`)                                                                                                                                                                                                                                                                                  |
| 2   | Exactly one current owner per piece at any time                                                           | **BOTH**     | `one_current_owner_per_piece` partial unique index on `OwnershipRecord(pieceId) WHERE transferredAt IS NULL`; app never inserts a second open record without closing the prior one (`transfers.service.ts:563-578`)                                                                                                                 |
| 3   | Piece status/owner consistency (`OWNED`/`TRANSFER_PENDING` ⇒ has owner; `AVAILABLE`/`RETIRED` ⇒ no owner) | **DB**       | `piece_owned_has_owner` CHECK constraint (`20260729130000_production_readiness`)                                                                                                                                                                                                                                                    |
| 4   | Exactly one active certificate per piece                                                                  | **BOTH**     | `one_active_certificate_per_piece` partial unique index; app deactivates old cert in the same transaction as creating the new one (`certificates.service.ts:115-132`)                                                                                                                                                               |
| 5   | Ownership history is append-only (no update/delete of past records)                                       | **APP ONLY** | Schema comment only (`schema.prisma:212`); no DB trigger/rule prevents an `UPDATE`/`DELETE` from any future code path — LOW-01                                                                                                                                                                                                      |
| 6   | Exactly one active (non-terminal) transfer per piece                                                      | **BOTH**     | `one_active_transfer_per_piece` partial unique index; app double-checks via `activeTransfer` query inside the lock (`transfers.service.ts:118-127`)                                                                                                                                                                                 |
| 7   | Transfer sender ≠ recipient                                                                               | **BOTH**     | `transfer_participants_must_differ` CHECK; app checks `recipient.id === clientId` at initiate (`transfers.service.ts:86-88`)                                                                                                                                                                                                        |
| 8   | Transfer status transitions are forward-only, no skipped/backward states                                  | **APP ONLY** | `canTransitionTransfer` map (`@dadan/utils`) enforced via `assertTransition`; no DB CHECK on status sequencing (acceptable — sequencing logic is inherently procedural)                                                                                                                                                             |
| 9   | Order amounts are non-negative                                                                            | **DB**       | `order_amounts_nonnegative`, `order_item_amounts_nonnegative` CHECK constraints                                                                                                                                                                                                                                                     |
| 10  | Order status transitions are a guarded FSM                                                                | **APP ONLY** | `OrdersService.ORDER_TRANSITIONS` map (`orders.service.ts:378-400`) — no DB CHECK, acceptable for the same reason as #8                                                                                                                                                                                                             |
| 11  | A piece cannot appear twice in the same order                                                             | **DB**       | `unique_piece_per_order` unique index on `OrderItem(orderId, pieceId)` — **not reflected in `schema.prisma`** (raw SQL only), a schema/migration drift risk worth reconciling                                                                                                                                                       |
| 12  | Payment reference uniqueness per provider                                                                 | **DB**       | `unique_payment_reference_per_provider` partial unique index (`WHERE paymentReference IS NOT NULL`)                                                                                                                                                                                                                                 |
| 13  | Client house key / house ID / email uniqueness                                                            | **DB**       | `@unique` on all three (`schema.prisma:91-95`)                                                                                                                                                                                                                                                                                      |
| 14  | A transfer cannot be approved/rejected twice                                                              | **BOTH**     | DB: once `APPROVED`, the `one_active_transfer_per_piece` partial index no longer applies (status excluded), but the real guard is app-level re-check of `status === DADAN_REVIEW` inside the `FOR UPDATE` lock (`transfers.service.ts:519-521`), which is race-safe because Serializable + row lock serializes concurrent approvers |
| 15  | Cart item references a single piece exclusively (`CartItem.pieceId @unique`)                              | **DB**       | `schema.prisma:398`; but see MEDIUM-02 for the app-layer race on the surrounding check                                                                                                                                                                                                                                              |

**Reconciliation note:** `unique_piece_per_order` (Invariant 11) exists in the database (`20260729094439_add_integrity_constraints/migration.sql:61-62`) but has no corresponding `@@unique([orderId, pieceId])` in `schema.prisma`'s `OrderItem` model. This is schema-drift risk: a future `prisma migrate dev`/`db push` cycle that doesn't account for this could silently drop the constraint. Recommend adding the `@@unique` to the Prisma schema so it round-trips correctly.

---

## 9. Test Report

**What is verified by tests today (with real assertions, confirmed by reading each one):**

- Cross-client wardrobe access → 404 (test 2)
- Cross-client certificate access → 404 (test 2)
- Cross-client order access → 404 (test 3)
- Client JWT rejected on admin routes → 401 (tests 6, and the mislabeled "VIEWER" test)
- Declined payment leaves no order and piece stays `AVAILABLE` (test 7)
- Order status FSM rejects an invalid transition on a `FULFILLED` order (test 8, conditional on fixture existing)
- Path-traversal upload/read attempts rejected (test 9)
- Cart hold expiry allows re-add after removal (test 10)
- VAT line-item math reconciles to order total (test 5)

**What is claimed by test titles but NOT actually verified (HIGH-02):**

- True concurrent-checkout race (test 1 is sequential)
- True idempotency-key double-submit protection (test 4 tests an unrelated empty-cart path)
- VIEWER-role write rejection (mislabeled test actually re-tests client-vs-admin audience)

**What has no test coverage at all**, confirmed by grepping the full `apps/api/test/` directory for `transfer`, `saved`, `favorite`, `admin-clients`, `visibility`, `mass-assign`:

- The entire transfer state machine (initiate/confirm-sender/confirm-recipient/approve/reject) — no cross-client IDOR test (e.g. can client C confirm-sender on a transfer they're not party to?), no test that approval is blocked pre-contact (HIGH-03), no concurrent-double-approve test
- Saved-pieces (favorites) cross-client access
- Admin RBAC insufficient-role tests (no seeded VIEWER/STAFF fixtures used against restricted routes)
- Hidden/invisible product add-to-cart rejection (negative visibility test)
- Mass-assignment attempts against any admin DTO (e.g. POSTing `role` in an `UpdateClientDto` body and confirming the field is silently dropped, not applied)
- Certificate URL expiry/re-authorization (would currently fail given HIGH-01)
- Rate-limit trip-and-recovery behavior for any limited endpoint

This file is real, valuable work — but per the audit's methodology, "a test file exists" is not equivalent to "the behavior is verified," and per CRIT-01, none of it currently protects `main`.

---

## 10. Production Blockers

These must be resolved before a real launch, in priority order:

1. **CRIT-01** — Wire `apps/api`'s `test:e2e` into CI against real Postgres/Redis, blocking merge on failure.
2. **HIGH-01** — Fix certificate URL to be genuinely re-authorized/expiring, not a permanent public path.
3. **HIGH-02** — Rewrite the three mismatched tests to actually test what their names claim (concurrency, idempotency, VIEWER-role), and add the transfer-IDOR and admin-RBAC-insufficient-role tests called out in Section 9.
4. **HIGH-03** — Enforce DADAN contact confirmation as a real gate before transfer approval, not an audit-only side action.

## 11. Remaining Risks (require live infra / cannot be verified from source alone)

- **UNVERIFIED:** `restore.sh` has never been proven against a real or staging dataset — schedule a restore drill before launch.
- **UNVERIFIED:** TLS certificate validity/renewal automation (`certbot` cron, referenced but not included in this repo) was not inspected — confirm it exists and is tested outside this repo's scope.
- **UNVERIFIED:** Actual production values for `JWT_SECRET`/`CERT_SIGNING_SECRET`/etc. (entropy, uniqueness vs. any leaked dev values) cannot be assessed from source; confirm these were freshly generated for production, not copied from `.env.example`/dev.
- **UNVERIFIED:** DNS/WAF/CDN posture (e.g. is Cloudflare actually in front, per the commented-out `cloudflare-ips.conf` include in `nginx.conf`) — if not enabled, `set_real_ip_from` config for Cloudflare ranges is dead code and doesn't matter, but if enabled without it, `X-Forwarded-For` trust would be misconfigured. Confirm which mode is actually deployed.
- **INFO:** No admin MFA (LOW-04) — not a blocker for an initial trusted-operator launch, but should be prioritized as the admin user base grows beyond a handful of trusted individuals.

## 12. Final Decision

# **NOT PRODUCTION READY**

The transactional core (client isolation, ownership integrity, checkout/transfer concurrency, error handling, deployment hardening) is genuinely solid and has clearly benefited from a real prior hardening effort — most of the historical audit docs' Critical findings are fixed. But the four blockers in Section 10 are real, and CRIT-01 in particular means the team currently has **no automated way to know if any of this regresses**. Fix the four blockers (realistically days, not weeks, of work given how close the underlying implementation already is), re-run this audit's regression tests, and this becomes a legitimately launchable system.
