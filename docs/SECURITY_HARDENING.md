# DADAN Dijital — Security Audit & Hardening Plan

Date: 2026-07-02
Scope: `apps/api` (NestJS), `apps/web` (Next.js), `packages/db` (Prisma schema), `packages/storage`.

---

## 1. House Key storage — verdict

**Question:** Should the House Key be encrypted in the DB?

**Answer: No. Keep the current bcrypt hashing — do not switch to encryption.**

- `Client.houseKey` is stored as a **bcrypt hash** (rounds from `HOUSE_KEY_SALT`, default 12). This is the correct design.
- Hashing is one-way: even a full database leak does not reveal keys. Encryption is reversible — the decryption key would live on the same server, so a server compromise exposes every House Key.
- The system only ever needs to _verify_ a key at login (`bcrypt.compare`), never read it back. That is exactly the hashing use case. Encryption is only justified when the original value must be retrieved later (e.g. a third-party API key) — not applicable here.
- Keys are generated as `randomBytes(16).toString("hex")` = 32 hex chars = 128 bits of entropy, so offline brute-force against leaked hashes is infeasible.
- `houseKeyPrefix` (first 4 plaintext chars, used for admin display and hash-candidate lookup) reduces effective entropy slightly (~112 bits). Acceptable trade-off; no action needed.

---

## 2. What is already done well

- httpOnly session cookies (`dadan_session`, `dadan_admin_session`); no tokens in localStorage; no `Authorization` header in frontend JS.
- Audience-separated JWTs (`dadan:client` vs `dadan:admin`) checked in guards.
- bcrypt for House Keys and admin passwords; plaintext key shown only once at create/rotate.
- HMAC-SHA256 certificate verification tokens with `timingSafeEqual`.
- Private R2/S3 bucket; objects served via presigned URLs (1h expiry); server-controlled object keys (no path traversal).
- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- Zod-validated environment config (`JWT_SECRET` min 32 chars, etc.); no hardcoded production secrets.
- Prisma-only DB access; no raw SQL with user input.
- Generic `"Unauthorized"` errors on auth failure (anti-enumeration); hidden resources return 404.
- Redis rate limiting on client key validation and admin login (5 attempts / 15 min / IP).
- No `dangerouslySetInnerHTML`; no secrets in `NEXT_PUBLIC_` vars; `robots: noindex`.
- Two-layer route protection in web: middleware (cookie presence) + server-side session validation in layouts.

---

## 3. Findings & remediation

### High priority

#### H1. Admin transfer detail leaks bcrypt House Key hashes

`getAdminTransfer` in `apps/api/src/transfers/transfers.service.ts` uses
`include: { fromClient: true, toClient: true }`, returning full `Client` records
including the `houseKey` bcrypt hash to the admin UI.

**Fix:** Replace `include` with an explicit `select` returning only safe fields
(`id`, `displayName`, `email`, `houseKeyPrefix`), consistent with the stripping already
done in `clients.service.ts` (`getClientById`). Check the admin transfer _list_ query too.

#### H2. VIEWER admin role has write access

Only 4 endpoints require `SUPER_ADMIN` (rotate-key, transfer approve/reject, cert
regenerate). Every other admin endpoint — creating clients, registering pieces,
uploading images, updating orders/collections/designs — is open to any active admin,
including `VIEWER`.

**Fix (preferred):** Extend the roles guard so `VIEWER` is blocked from all non-GET
requests globally. Alternative: annotate every mutating admin endpoint with
`@Roles(SUPER_ADMIN, STAFF)`.

### Medium priority

#### M1. JWT returned in login JSON body

Both `POST /auth/validate-key` and `POST /admin/auth/login` set the httpOnly cookie
**and** return the raw JWT in the response body (`return { ...client, token }`).
The frontend never reads it, so it is pure attack surface: XSS or a malicious browser
extension could exfiltrate it, defeating httpOnly.

**Fix:** Remove `token` from both response bodies
(`apps/api/src/auth/auth.controller.ts`, `apps/api/src/admin/auth/admin-auth.controller.ts`).
Update any tests that assert on it.

#### M2. Unvalidated admin PATCH bodies (mass assignment)

`PATCH admin/collections/:id` and `PATCH admin/designs/:id` in
`apps/api/src/collections/admin-collections.controller.ts` accept
`@Body() dto: Record<string, unknown>` passed straight to Prisma `update()`.
The global ValidationPipe does nothing for untyped bodies, so any Prisma-accepted
field can be written.

**Fix:** Add `UpdateCollectionDto` / `UpdateDesignDto` with class-validator decorators
(all fields optional) so whitelisting applies.

#### M3. No server-side session revocation on logout

Logout only clears the cookie. A stolen client JWT stays valid for 30 days; an admin
JWT for 24 hours.

**Fix:** Add a `jti` claim at sign time; on logout, store it in Redis with TTL equal to
the token's remaining lifetime; check the deny-list in `ClientGuard` / `AdminGuard`.
Also consider shortening the client session from 30 days (e.g. 7 days), configurable.

#### M4. Rate-limit IPs spoofable / wrong behind proxy

Redis rate limits key on `request.ip`, but Express `trust proxy` is never set. Behind
nginx in production, all requests appear to come from the proxy IP (one shared bucket),
or the limit can be bypassed by spoofing `X-Forwarded-For`.

**Fix:** In `apps/api/src/main.ts`, set `trust proxy` to `1` on the underlying Express
instance so `request.ip` is the real client IP behind exactly one proxy hop.

#### M5. Upload memory DoS

The design image upload (`FileInterceptor("file")`) has no multer limits; the entire
file is buffered in memory before the storage layer's 10/20 MB check runs.

**Fix:** Add `limits: { fileSize: 20 * 1024 * 1024 }` to the interceptor options so
oversized uploads are rejected during streaming.

### Low priority

#### L1. Verification token in GET query string

`GET /verify?serial=&token=` puts the HMAC token in URLs (browser history, proxy logs,
Referer). The QR code flow requires GET, but the in-app verify form does not.

**Fix:** Add a POST variant used by `apps/web/components/verify-form.tsx`; keep GET for
QR links; add a validated DTO for the query/body params (currently unvalidated).

#### L2. Unverified JWT decode in verify controller

`apps/api/src/verify/verify.controller.ts` manually base64-decodes the session cookie
payload (no signature check) to extract an optional `clientId` for logging.

**Fix:** Use `jwtService.verifyAsync` and ignore failures.

#### L3. Admin logout not wired in UI

`adminLogout()` exists in `apps/web/lib/api/admin.ts` but nothing calls it; admin
sessions persist until cookie expiry.

**Fix:** Add a logout button to the admin dashboard layout.

#### L4. Miscellaneous (track, no immediate action)

- `certificate.pdfUrl` rendered as unvalidated `href` in `CertificateModal` — only
  exploitable if the API/DB is already compromised.
- No CSP on the Next app (nginx sets X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, HSTS in prod). CSP needs design-time work; defer.
- Hardcoded `mock_token_success` in checkout — fine until a real payment provider
  is integrated; must be removed at that point.
- Seed script prints plaintext House Keys and `AdminPass123!` to stdout — dev-only;
  never run the seed against production.

---

## 4. Implementation order

1. **H1** — strip `houseKey` from admin transfer responses (small, immediate).
2. **H2** — make `VIEWER` read-only via roles guard.
3. **M1** — remove JWT from login response bodies.
4. **M2** — validated DTOs for admin PATCH endpoints.
5. **M4** — `trust proxy` in `main.ts`.
6. **M5** — multer file size limit.
7. **M3** — Redis JWT deny-list on logout (largest change; touches guards + auth services).
8. **L1–L3** — POST verify + DTO, safe JWT decode, admin logout button.

## 5. Explicitly out of scope

- Real payment provider integration (Moyasar/Tap/Stripe).
- CSP for the Next app.
