# DADAN Dijital — Full Application Review (Business Logic, Security, Deployment)

Date: 2026-07-02
Scope: `apps/api` (NestJS), `apps/web` (Next.js), `packages/*`, Docker/nginx deployment artifacts.

This document records the complete audit and its outcome. Section 1 lists everything **fixed in this pass**. Section 2 is the **remaining backlog**, ranked by priority. Section 3 summarizes what was already solid. It complements `docs/SECURITY_HARDENING.md` (the earlier security pass, whose items H1–M5/L1–L3 were all verified as implemented).

---

## 1. Fixed in this pass

### 1.1 Security

| Severity | Issue                                                                                                                                                             | Fix                                                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH     | Admin `PATCH /admin/clients/:id` and `POST .../visibility-groups` returned the full Prisma `Client` including the **bcrypt `houseKey` hash**                      | All mutation paths in `clients.service.ts` now strip `houseKey` via a shared `stripHouseKey` helper (create, get, update, visibility update)                                                            |
| MEDIUM   | **Stale JWT claims**: deactivated clients kept access up to 7 days; deactivated/demoted admins up to 24h; revoked `visibilityGroups` persisted until token expiry | `ClientGuard` and `AdminGuard` now re-fetch `isActive`, `role`, and `visibilityGroups` from the DB on every request and use the fresh values (single indexed lookup)                                    |
| MEDIUM   | **Visibility bypass**: `addToCart` and `savePiece` accepted any piece UUID, letting clients buy/save pieces from designs/collections hidden from them             | Both now enforce the same rules as the catalog (`isActive`, `isVisible`, design + collection visibility groups) and return 404 for hidden pieces                                                        |
| MEDIUM   | Hardcoded `mock_token_success` in the web checkout                                                                                                                | Payment mode is now driven by `NEXT_PUBLIC_PAYMENT_MODE` (build-time). `mock` keeps the preview flow; any other value disables online checkout with a clear message until Stripe Elements is integrated |

### 1.2 Business logic

| Severity | Issue                                                                                                                                                                                   | Fix                                                                                                                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRITICAL | **Payment charged outside the order transaction**: if `createPaidOrder` failed after a successful charge (e.g. piece sold concurrently), money was captured with no order and no refund | Checkout now wraps order creation; on failure it automatically calls `PaymentsService.refund` (previously dead code), writes a `CHECKOUT_REFUNDED` / `CHECKOUT_REFUND_FAILED` audit entry, and returns a clear error                         |
| HIGH     | **VAT mismatch**: UI displayed 15% VAT but the API charged base price only                                                                                                              | The API now charges the VAT-inclusive total (`VAT_RATE` env, default 0.15) and stores it as the order `totalAmount`; the checkout response returns `subtotal` / `vatAmount` / `totalAmount`; the UI rate is driven by `NEXT_PUBLIC_VAT_RATE` |
| HIGH     | **Clients could not initiate transfers**: the API endpoint existed but there was no web UI or API-client method                                                                         | Added `initiateTransfer()` to `apps/web/lib/api/client.ts` and a transfer form (`components/transfer-initiate.tsx`) on the wardrobe piece page, shown only for `OWNED` pieces with no active transfer                                        |
| MEDIUM   | `paymentProvider` recorded as `"mock"` even when Stripe processed the charge                                                                                                            | Orders now record the actual provider (`PaymentsService.providerName`)                                                                                                                                                                       |
| MEDIUM   | **RETIRED pieces could be transferred** (initiate only blocked `TRANSFER_PENDING`)                                                                                                      | Initiate now requires piece status `OWNED`                                                                                                                                                                                                   |
| MEDIUM   | Recipient confirmation skipped the `RECIPIENT_CONFIRMED` state without validating the second hop                                                                                        | Both transitions (`→ RECIPIENT_CONFIRMED → DADAN_REVIEW`) are now asserted against the FSM before the atomic update                                                                                                                          |
| LOW      | Recipient saw a Cancel button the API always rejected                                                                                                                                   | Cancel is now sender-only in `transfer-actions.tsx`, matching the API                                                                                                                                                                        |
| LOW      | Add-to-cart redirected to `/cart` (404) instead of `/beta/cart`; checkout success went to `/orders/:id` instead of `/beta/orders/:id`                                                   | Both routes fixed                                                                                                                                                                                                                            |

### 1.3 Deployment blockers

| Severity | Issue                                                                                                                                                                                                                                                                                        | Fix                                                                                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCKER  | `apps/api/Dockerfile` ran `pnpm --filter @dadan/{types,utils,storage,db} build` but those packages had **no build script** and their `main` pointed at TypeScript source — the production image could not build or run on Node 20 (local dev only worked thanks to Node 22's type stripping) | All four packages now have `tsc` build scripts; `main` points to `dist/index.js` with `types`/`import` conditions still resolving to source for dev/typecheck/bundling. `turbo dev` now depends on `^build` |
| BLOCKER  | `pnpm install` in the Docker `deps` stage ran `@dadan/db`'s `prisma generate` postinstall **without the schema present**                                                                                                                                                                     | Both Dockerfiles now copy `packages/db/prisma` (and all workspace `package.json` files, required by the pnpm lockfile) before `pnpm install`                                                                |
| HIGH     | nginx container healthcheck hit `http://localhost/health/live`, which routes to the web app (no such route) — nginx would always report unhealthy                                                                                                                                            | Healthcheck now uses `/api/health/live`, which nginx proxies to the API                                                                                                                                     |
| MEDIUM   | `NEXT_PUBLIC_API_URL` was `/backend` in dev but `/api` in the prod compose build, with no explanation                                                                                                                                                                                        | `.env.example` fully rewritten: documents both modes, all missing prod vars (`POSTGRES_PASSWORD`, `HTTP_PORT`, `VAT_RATE`, `NEXT_PUBLIC_PAYMENT_MODE`), and secret-generation commands                      |
| —        | No deployment documentation existed                                                                                                                                                                                                                                                          | `docs/DEPLOYMENT.md` added (full single-server guide: prerequisites, R2 setup, env, TLS options, backups, updates, troubleshooting)                                                                         |

---

## 2. Remaining backlog (not fixed in this pass)

### P1 — should be done before/at launch

1. ~~**Real payment integration.**~~ **Done.** The provider is Tap Payments, not Stripe. `PAYMENT_PROVIDER_KEY=sk_*` switches the API to Tap (`apps/api/src/payments/payments.service.ts`), and the web checkout now renders Tap's Web Card SDK (`@tap-payments/card-sdk`) to tokenize real cards when `NEXT_PUBLIC_PAYMENT_MODE=live` and `NEXT_PUBLIC_TAP_PUBLIC_KEY`/`NEXT_PUBLIC_TAP_MERCHANT_ID` are set (`apps/web/features/checkout/components/tap-card-element.tsx`). Remaining follow-up: 3-D Secure redirect flow and native Apple Pay both require the backend to create orders asynchronously after webhook confirmation — not implemented yet (synchronous, non-3DS charges only).
2. **Admin dashboard has no action UI.** All admin pages are read-only tables. Missing: transfer approve/reject buttons (the review queue is the core operational workflow), client create/edit/rotate-key forms, piece register/assign forms, order status updates, collection/design management, pagination controls. All the API endpoints exist — this is purely frontend work in `apps/web/app/admin` + `apps/web/lib/api/admin.ts`.
3. **Public verify page.** Certificate QR codes point to `{BASE_URL}/verify?serial=...&token=...`, but the web app has no public `/verify` route (only the auth-gated `/beta/verify`). Anyone scanning a certificate QR gets a 404. Add a public page that calls `GET /verify` (the API endpoint is already public and rate-limited).
4. **Root page is "Coming Soon".** The live client app is under `/beta/*`. Decide the launch URL structure (promote `/beta` to `/` or keep the gate).

### P2 — important robustness gaps

5. **Certificate generation failure leaves owned pieces without an active certificate.** Post-order and post-transfer cert generation retries 3 times via `setTimeout` (in-process, lost on restart) and then only writes an audit entry. Add an admin alert or a reconciliation job that finds `OWNED` pieces with no active certificate (`certificates.none: { isActive: true }`) and regenerates.
6. **Order status has no state machine.** `updateOrderStatus` accepts any transition (e.g. `CANCELLED → FULFILLED`). Add a `canTransitionOrder` guard like the transfer FSM.
7. **Refund not wired to order cancellation.** `cancelOrder` only works on `PENDING` orders, which can never exist (checkout creates `PAID` directly). Decide the cancellation/refund policy: either remove client cancellation or implement `PAID → CANCELLED` with a refund via `PaymentsService.refund`.
8. **Cart race on concurrent add-to-cart.** The unique `pieceId` in `CartItem` prevents double-selling, but a second client can silently steal an expired hold; there is no transactional lock between hold check and upsert. Low practical risk at boutique scale; wrap in a transaction if inventory contention grows.
9. **Design page shows cart-held pieces as available.** `getDesignBySlug` filters by `status: AVAILABLE` but ignores active cart holds; checkout catches it, but the UX is a late failure. Join against unexpired `CartItem` rows.
10. **`OwnershipRecord.certificateId` is never populated.** The schema supports linking each ownership event to its certificate; no service sets it. Populate it in `generateCertificate` callers for a complete provenance chain.
11. **`updatePiece` ignores the `notes` DTO field** (`pieces.service.ts` updates only `status`).
12. **Serial number collision throws a generic 500.** `serial-number.service.ts` should retry on unique-constraint violation.

### P3 — operational / hardening polish

13. **No audit log read API or admin UI** (`AuditLog` is write-only). Add a paginated `GET /admin/audit` (SUPER_ADMIN) and a dashboard page.
14. **No admin list endpoints for collections/designs** (create/update/delete only) — needed anyway for the admin UI work in P1.2.
15. **Emails are fire-and-forget** with no retry/queue; failures are only logged. Acceptable now; consider a queue if email becomes contractual.
16. **Content Security Policy** on the Next app (deferred in the earlier hardening pass; nginx covers the other headers).
17. **Bearer-token dual transport in guards.** Cookies are the only transport the web uses; the `Authorization: Bearer` path widens the exfiltration surface slightly. Remove unless a native/mobile client is planned.
18. **Upload MIME sniffing.** Design image uploads trust the client `Content-Type`; add magic-byte validation (`file-type`) in the storage layer.
19. **No CI deploy workflow.** CI runs lint/typecheck/test/build but deployment is manual (per `docs/DEPLOYMENT.md`). Consider a GitHub Action that SSHes and runs the update procedure.
20. **`/health` endpoint is public** and reveals DB/Redis status — restrict to internal networks in nginx if that matters to you.
21. **Seed script prints plaintext credentials** — already documented as dev-only; never run in production (the deployment guide creates the real admin differently).

---

## 3. What was verified as already solid

- **Auth architecture**: httpOnly, audience-separated JWTs for client/admin; bcrypt House Keys (128-bit entropy) and admin passwords; `jti` deny-list on logout; login rate limits (5/15min/IP); generic auth errors (anti-enumeration).
- **Authorization**: all client controllers scope queries by `clientId`/`currentOwnerId`; admin endpoints class-guarded with RBAC; VIEWER globally read-only; SUPER_ADMIN required for key rotation, transfer review, cert regeneration.
- **Input validation**: global `ValidationPipe` (whitelist + forbidNonWhitelisted), typed DTOs including admin PATCH bodies, multer 20MB streaming limit, server-generated object keys (no path traversal).
- **Verification flow**: HMAC-SHA256 tokens with `timingSafeEqual`, only the active certificate verifiable, no owner PII in responses, 30 req/min/IP limit, every attempt logged.
- **Data model**: append-only `OwnershipRecord` provenance, transfer FSM in `packages/utils`, one-active-certificate invariant, atomic order fulfillment transaction.
- **Infra**: private R2 bucket with presigned URLs, Prisma-only DB access (no raw SQL with user input), Zod env validation that refuses to boot production without a valid Tap secret key, `trust proxy`, helmet, restricted CORS, nginx rate limiting + security headers.
