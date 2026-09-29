# DADAN — Technical Review Pain Points & Engineering Backlog (check if fixed first)

**Source:** DADAN Technical Review Notes — September 28, 2026  
**Purpose:** Engineering checklist derived from the review document.  
**Goal:** Give Claude a complete, actionable list of items that need fixing, clarification, verification, or technical evidence before final approval.

---

## Important Classification

Do not treat every item as an implementation bug. The review contains three categories:

1. **Actual bugs / UX issues** — behavior observed to be incorrect.
2. **Missing or incomplete functionality** — flows that still need implementation or completion.
3. **Needs technical evidence / verification** — functionality may exist, but the review did not have enough evidence to mark it complete.

Do not rebuild functionality that the review explicitly confirms as working. Re-test those flows after related changes.

---

# Status Log — 2026-09-29

Statuses use the vocabulary in [Definition of Done](#definition-of-done). This pass audited all 24 items and implemented the confirmed **P1 code bugs**; P0 payment/certificate/verify work and the P2 operations evidence were left for their own passes.

| #   | Item                              | Status                     |
| --- | --------------------------------- | -------------------------- |
| 1   | Key House permanence              | `FIXED`                    |
| 2   | Real payment gateway              | `IN PROGRESS`              |
| 3   | Certificate creation after purch. | `FIXED` (pre-existing)     |
| 4   | Certificate lifecycle after xfer  | `TODO`                     |
| 5   | Verify — QR / token / serial      | `TODO`                     |
| 6   | Security & data integrity         | `VERIFIED` (see below)     |
| 7   | Collections main route            | `FIXED`                    |
| 8   | Collection access status          | `FIXED`                    |
| 9   | Admin collection access actions   | `FIXED`                    |
| 10  | Analytics navigation              | `FIXED`                    |
| 11  | Analytics counter formatting      | `NOT APPLICABLE`           |
| 12  | Currency consistency              | `FIXED`                    |
| 13  | Timezone                          | `FIXED`                    |
| 14  | Checkout validation               | `FIXED`                    |
| 15  | Viewer permission UX              | `FIXED`                    |
| 16  | Inheritance transfer E2E          | `TODO`                     |
| 17  | Sale transfer E2E                 | `TODO`                     |
| 18  | Upload scenarios E2E              | `TODO`                     |
| 19  | CI/CD                             | `NEEDS TECHNICAL EVIDENCE` |
| 20  | Rollback                          | `NEEDS TECHNICAL EVIDENCE` |
| 21  | Monitoring                        | `NEEDS TECHNICAL EVIDENCE` |
| 22  | Backup & restore                  | `NEEDS TECHNICAL EVIDENCE` |
| 23  | Technical documentation           | `NEEDS TECHNICAL EVIDENCE` |
| 24  | Figma vs implementation           | `TODO`                     |

Gate results for this pass: `pnpm typecheck` clean, `pnpm lint` 0 errors (1 pre-existing `react-hooks/exhaustive-deps` warning in `membership-classes.tsx`), `pnpm test` 131 API + 60 web tests passing.

**Not yet re-run:** the [regression scenarios](#regression-tests--already-confirmed-working) and the Playwright suite. They need Postgres, Redis and a running API, none of which were available in this environment. `playwright test --list` confirms all 17 specs — including the 3 new collections specs — are discovered and parse, but they have not been executed. Checkout, gift transfer, ownership history and viewer restrictions all sit downstream of changes in this pass and must be re-run before sign-off. The two new migrations (`20260929060000_key_house_permanent`, `20260929061000_staff_request_collection_index`) have also not been applied to a live database.

## 1. Key House permanence — `FIXED`

- **Changed:** Key House is now permanent everywhere. Removed `keyValidityMonths` and `requireKeyRenewal`, which nothing ever read — auth never loaded `HouseSettings` and `Client` has no expiry column, so they only advertised a renewal policy the system did not implement.
- **Where:** `packages/db/prisma/schema.prisma` (+ migration `20260929060000_key_house_permanent`), `apps/api/src/settings/dto/update-house-settings.dto.ts`, `apps/web/features/admin/components/settings/house-access.tsx`, `apps/web/features/admin/api/fetch-admin-settings.ts`, new `admin.settings.houseKeyPermanent` copy in `en.json`/`ar.json`.
- **Tested:** typecheck + lint + full suite; i18n parity test covers the new key.
- **Expected/actual:** The settings screen states the key is permanent and offers no validity or renewal control; the API rejects both removed fields via `forbidNonWhitelisted`. Matches.
- **Limitation:** Rotation and deactivation remain the only ways to invalidate a key; `Client.houseKey` carries a doc comment warning against reintroducing expiry semantics.

## 6. Security & data integrity — `VERIFIED`

Audited, no change required. Already present: a global exception filter that strips stack traces in production, `helmet` and `compression` registered before routes, env-whitelisted CORS, a Redis-backed throttler with stricter limits on auth routes, `whitelist` + `forbidNonWhitelisted` on the global `ValidationPipe`, a default-deny `GlobalAuthGuard` with explicit `@Public()`, refresh-token rotation with reuse detection, a Redis access-token deny-list, bcrypt hashing, and HMAC-signed private storage URLs. Integrity is enforced in Postgres, not only in application code: partial unique indexes for one current owner per piece, one active certificate per piece and one active transfer per piece, a `piece_owned_has_owner` CHECK, and `Piece.serialNumber @unique` behind a locked `SerialCounter`. Client-scoped `where` clauses have an IDOR e2e suite.

## 7. Collections main route — `FIXED`

- **Changed:** `/beta/collections` rendered the member's own wardrobe with wishlist tabs instead of the Collections catalogue. It now lists the collections the signed-in member's class can see, each linking to `/beta/collections/[slug]`.
- **Where:** new `apps/web/features/collections/components/collections-catalog.tsx`, rewritten `apps/web/app/beta/(private)/collections/page.tsx`; deleted the now-dead `collections-grid.tsx` and `sidebar.tsx`; new `collections.pieceCount` copy.
- **Tested:** new Playwright spec `apps/web/e2e/collections.spec.ts` asserts the catalogue heading renders, the wishlist tabs are gone, the header nav reaches the page, and a card opens its detail page.
- **Expected/actual:** Catalogue renders for a signed-in member, empty state otherwise. Matches.
- **Limitation:** Visibility is enforced server-side — the API only returns collections the member's class can see — so the page does no filtering of its own.

## 8. Collection access status — `FIXED`

- **Changed:** Two defects. Granting a class access to a collection left the matching `ACCESS_REQUEST` rows `PENDING` forever, and the admin roster's Access column was derived from `isActive` rather than from actual access. A new `CollectionAccessSyncService` completes satisfied open requests inside the transactions that grant access, writing the audit rows on the same transaction so the trail cannot disagree with state. `listClients` now computes a real `GRANTED`/`PENDING`/`REVOKED` per row and includes members with open requests in the collection-scoped roster.
- **Where:** new `apps/api/src/collections/collection-access-sync.{service,module}.ts`, wired into `collections.service.ts` (`updateCollection`) and `clients.service.ts` (`updateClient`, `listClients`); `apps/web/features/admin/types/index.ts`; `collection-access-columns.tsx` now keys off the union instead of substring-matching `"PEND"`. Added `@@index([collectionId, type, status])` (migration `20260929061000_staff_request_collection_index`) for the roster lookup.
- **Tested:** new `apps/api/test/collection-access-sync.service.spec.ts` (6 tests) plus 10 rewritten/added cases in `admin-clients-list.spec.ts`, including that a live class grant wins over a stale open request.
- **Expected/actual:** Requests close when access is granted; the roster reflects real access. Matches.
- **Limitation:** Sync is deliberately one-directional — revoking a class grant does not reopen a completed request. The per-page pending lookup is one extra query, not one per row.

## 9. Admin collection access actions — `FIXED`

- **Changed:** Three row/filter links pointed at `/admin/clients*`, which has no page and 404s — the routes are `/admin/members*`. Rotate Key was a dead button: `rotateClientKey` existed in the API client but was imported nowhere. It is now a `useMutation` behind a danger `useConfirm` that warns the key stops working and every session is revoked, and the new key is revealed once in a `Modal` with a copy action rather than a `window.alert`. The action is hidden from non-super-admins because the endpoint is `@Roles(SUPER_ADMIN)`.
- **Where:** `collection-access-row-actions.tsx`, `collection-access-filter.tsx`, new `features/admin/hooks/use-rotate-client-key.ts`, new `admin.rotateKey.*` copy in both locales.
- **Tested:** new `apps/web/shared/lib/admin-routes.test.ts` walks `app/admin/**/page.tsx` into route patterns and asserts every `/admin/...` href in `app/admin`, `features/admin` and `components/admin` resolves to a real page. Verified non-vacuous by reintroducing `/admin/clients/new` and watching it fail.
- **Expected/actual:** Links navigate; rotation asks for confirmation and shows the key once. Matches.
- **Limitation:** The reported i18n key `rotateKey.rowActions.admin` does not exist in the codebase; the real key is `admin.rowActions.rotateKey` and it was already translated in both locales (see item 11's note on the same pattern).

## 10. Analytics navigation — `FIXED`

- **Changed:** The sidebar's direct links and Settings row wrapped a `<button>` inside the `<Link>` — interactive content inside an anchor, which is invalid HTML and swallowed the navigation. Row styling moved onto the `Link`, matching the sub-link pattern that already worked.
- **Where:** `apps/web/components/admin/layout/navigation-area.tsx`.
- **Tested:** new `navigation-area.test.tsx` asserts Analytics, Members, Payments and Settings each render as a plain link with the right `href` and no nested `button`.
- **Expected/actual:** Clicking Analytics in the sidebar navigates. Matches.

## 11. Analytics counter formatting — `NOT APPLICABLE`

Audited, no change required. The count KPIs already use plain `toLocaleString()` and no `$` literal exists anywhere in `apps/web`. The one money KPI on that page was the real problem and is covered by item 12.

## 12. Currency consistency — `FIXED`

- **Changed:** Money was assembled by hand in three places — `currency: locale === "ar" ? "ر.س" : "SAR"` rendered in a separate span on the analytics and payments KPIs, and a literal `SAR {value}` in the payments amount column. All now go through `formatPrice(value, "SAR", locale)`, which puts the currency where the locale expects it instead of always before the number. The payments amount-range filter labels were hardcoded English with embedded "SAR" and are now `admin.payments.amount*` keys with the bounds formatted through `formatPrice`.
- **Where:** `app/admin/(dashboard)/analytics/page.tsx`, `app/admin/(dashboard)/payments/page.tsx`, `payments-columns.tsx`, `payments-table.tsx`, `payments-table-filter.tsx`, new copy in both locales.
- **Tested:** new `shared/utils/format.test.ts` covers SAR formatting in both locales; typecheck + lint + full suite.
- **Expected/actual:** One currency helper renders every money value. Matches.
- **Limitation:** The status and method selects in `payments-table-filter.tsx` are still hardcoded English. That is a separate i18n gap, not a currency one, and was left out of this pass.

## 13. Timezone — `FIXED`

- **Changed:** The settings Select offered `value="utc"` labelled "UTC (Gulf Standard Time - 4)" and `value="est"` — neither is a valid IANA identifier, and the column stores one. It now renders the shared `HOUSE_TIMEZONES` list with labels whose offsets come from `Intl`, so they cannot drift or go stale across DST. The API validates the field with `@IsIn(HOUSE_TIMEZONES)` instead of `@IsString()`. Separately, `formatAdminDate` had no `timeZone`, so the same timestamp showed a different calendar day depending on where the admin's browser was; it is now pinned to `Asia/Riyadh`.
- **Where:** new `HOUSE_TIMEZONES` in `packages/types/src/index.ts` (read by both apps so the Select and the validation cannot diverge), `apps/api/src/settings/dto/update-house-settings.dto.ts`, `apps/web/features/admin/components/settings/general.tsx`, `apps/web/shared/utils/format.ts`.
- **Tested:** `shared/utils/format.test.ts` asserts a 21:30 UTC timestamp renders as the next Riyadh day; the suite passes under `TZ=America/New_York`, which is where the old behaviour would have shown the previous day.
- **Expected/actual:** Dates read the same for every admin. Matches.
- **Limitation:** Legacy rows holding `"utc"` fall back to `Asia/Riyadh` in the Select rather than failing; the DB default was already `Asia/Riyadh`.

## 14. Checkout validation — `FIXED`

- **Changed:** Field errors were set only on submit and cleared only at the start of the next submit, so a shopper who corrected a field kept staring at the stale message, and stepping back to the review step carried the errors along. Errors now clear on change and revalidate on blur (only for fields that actually have a value, so tabbing through does not nag), and reset when returning to step 1. The schema's messages were hardcoded English in a bilingual checkout; they are now stable keys translated through `checkout.validation.*`.
- **Where:** `apps/web/features/checkout/schemas/shipping-address.ts`, `apps/web/components/checkout-form.tsx`, new copy in both locales. Also removed a `console.log` that fired from `Input`'s `StatusIcon` on every error render.
- **Tested:** `shipping-address.test.ts` rewritten — asserts the parser returns keys rather than prose, that single-field validation reports the same keys, and that every key the schema can emit has English copy. New `checkout-form.test.tsx` drives the rendered form: a required error clears on the first keystroke with no second submit, clearing is scoped to the one field that changed, blur flags a badly formatted phone but stays quiet on an untouched empty field, stepping back to the review drops the errors, and the same empty submit under `locale="ar"` renders the Arabic copy. Verified non-vacuous by removing the `onChange` clearing and watching the two clearing cases fail.
- **Expected/actual:** Feedback tracks what the shopper typed, in their language. Matches.

## 15. Viewer permission UX — `FIXED`

- **Changed:** `useAdmin()` and `getAdminNavItems()` both existed but were called from nowhere, so every role saw the full sidebar and every write control, then hit a 403. `AdminLayout` also defaulted a missing session to `SUPER_ADMIN`, failing open. Now: the layout fails closed to `VIEWER`; the sidebar filters its rows through `ADMIN_NAV_ITEMS`; write affordances are gated on `canWrite` across the collection, piece, member, ownership and operation row actions and the "add new" buttons; and a new `AdminAccessGuard` renders an explicit Access Denied for sections a role cannot open and for any create/edit route when the role is read-only. Gating the write _route_ covers every current and future form, rather than each submit button.
- **Where:** `shared/lib/admin-nav.ts` (`findAdminNavItem`, `canAccessAdminPath`, `isAdminWritePath`), new `components/admin/admin-access-guard.tsx` and `admin-write-only.tsx`, `AdminLayout.tsx`, `navigation-area.tsx`, and the row-action/filter components listed above.
- **Tested:** new `admin-access-guard.test.tsx` (7 cases incl. nested routes and create/edit paths) and role cases in `navigation-area.test.tsx`, one of which asserts every sidebar row has a rule in `ADMIN_NAV_ITEMS` — an unmapped row would otherwise be visible to every role.
- **Expected/actual:** A VIEWER sees only readable sections and no write controls. Matches.
- **Limitation:** This is UX, not enforcement; the API guards remain the authority. `error.tsx` still string-matches for 403 as a fallback for failures that originate in the API rather than in routing.

## Confirmed broken, deliberately out of scope

These were verified as real defects during the audit but fall outside this pass:

- **4** — `getClientCertificate` gates on `currentOwnerId: clientId` before anything else, so a former owner gets a 404 instead of their archived certificate.
- **5** — `CertificateModal.tsx` renders no QR code or token.
- **2** — the mock gateway can still reach `PAID`; production blocks it unless `ALLOW_MOCK_PAYMENTS=true`, but the dev path remains.
- **16 / 17** — Inheritance and Sale have no type-specific logic and no E2E coverage.
- **19–23** — no CD job, no Alertmanager or application alert rules, no API-side Sentry, Postgres-only unencrypted backups, and zero tests for transfers, certificates or verify.

---

# P0 — Critical / Final Approval Blockers

## 1. Key House — Permanence vs 12-Month Expiration

### Current issue

Settings currently show Key House validity as **12 months** with renewal enabled, while the requirement describes Key House as permanent.

### Required work

- [ ] Resolve whether Key House should be permanent or renewable.
- [ ] If permanent, change implementation.
- [ ] If 12-month renewal is intentional, formally document/update the requirement.
- [ ] Verify the business rule at backend/database level where applicable.
- [ ] Verify uniqueness and permanence constraints.

### Acceptance criteria

- The implemented behavior matches the officially approved requirement.
- The rule cannot be bypassed through direct API/database manipulation.

---

# 2. Real Payment Gateway — Replace Mock Payment

### Current issue

Checkout currently uses a Mock payment gateway. The test flow can result in `PAID` and create Ownership without proving a real payment-provider success.

### Required work

- [ ] Connect the real payment provider in Sandbox/UAT.
- [ ] Implement payment creation.
- [ ] Implement successful payment handling.
- [ ] Implement failed payment handling.
- [ ] Implement cancellation handling where applicable.
- [ ] Implement refund handling.
- [ ] Implement webhook handling.
- [ ] Verify webhook signatures/security.
- [ ] Implement webhook idempotency / duplicate-event protection.
- [ ] Synchronize internal payment status with provider status.
- [ ] Implement reconciliation.
- [ ] Verify Ownership is created/confirmed according to the verified payment state.
- [ ] Test delayed webhook scenarios.
- [ ] Test repeated webhook scenarios.

### Acceptance criteria

- A Mock payment is no longer required for the UAT purchase flow.
- Successful provider payment produces the expected internal state.
- Failed payment does not incorrectly create a paid Ownership.
- Duplicate webhooks do not duplicate orders, ownership, certificates, or other side effects.
- Refund state is correctly reflected.

---

# 3. Certificate Creation After Purchase

### Current issue

In tested cases, Ownership can exist while Certificate Number and issue/since date remain empty. The customer can see `Certificate not found`.

### Required work

- [ ] Connect Purchase success to Certificate issuance.
- [ ] Generate Certificate Number.
- [ ] Set issued/since date.
- [ ] Make certificate available to the owner.
- [ ] Ensure certificate creation happens reliably after successful purchase.
- [ ] Handle failure between Ownership creation and Certificate creation.
- [ ] Define/review transaction or retry behavior for partial failures.

### Acceptance criteria

Successful purchase results in:

`Purchase → Ownership → Certificate → Certificate Number + Issue Date → Certificate accessible`

No valid ownership should unexpectedly show `Certificate not found`.

---

# 4. Certificate Lifecycle After Transfer

### Current issue

Purchase history remains visible after transfer, but opening the previous certificate resulted in `404`.

### Required work

- [ ] Define certificate versioning/lifecycle rules.
- [ ] Preserve previous certificate versions.
- [ ] Archive previous certificate rather than deleting its historical reference.
- [ ] Generate/reissue the appropriate certificate after ownership transfer.
- [ ] Keep History linked to the correct certificate version.
- [ ] Ensure old certificate URLs do not become unexplained 404s.
- [ ] Define what information remains visible on historical certificates according to privacy requirements.

### Acceptance criteria

For:

`Owner A → Transfer → Owner B`

the system preserves the historical certificate/ownership record and provides the correct certificate for the new owner.

---

# 5. Verify — QR / Token / Serial Complete Flow

### Current issue

Verify asks for Verification Token + Serial, but the tested digital certificate does not expose a QR/token that can be used to complete the successful verification flow.

### Required work

- [ ] Add QR to the appropriate certificate view/PDF if required by the approved design.
- [ ] Expose a valid verification reference/token.
- [ ] Connect QR/token to Verify.
- [ ] Verify Serial + Token.
- [ ] Implement successful verification.
- [ ] Test invalid token.
- [ ] Test invalid serial.
- [ ] Test wrong serial + valid token.
- [ ] Test old/historical certificate.
- [ ] Test not-found state.
- [ ] Test privacy behavior.
- [ ] Verify that verification does not expose unauthorized/private customer data.

### Acceptance criteria

A valid certificate can complete:

`Certificate → QR/Token → Verify → Valid certificate result`

Invalid/expired/old certificates return the correct controlled result.

---

# 6. Security & Data Integrity Review

The review explicitly states that these require separate technical verification.

## Security

- [ ] Review authentication/session expiry.
- [ ] Review session invalidation/logout.
- [ ] Review authorization on APIs.
- [ ] Test direct URL access.
- [ ] Test Viewer attempting privileged APIs.
- [ ] Test user-to-user data access.
- [ ] Review rate limiting.
- [ ] Review XSS protections.
- [ ] Review CSRF protections where applicable.
- [ ] Review input validation.
- [ ] Review access to private files.
- [ ] Review sensitive data exposure.

## Database/API integrity

- [ ] Verify Ownership is append-only where required.
- [ ] Verify historical ownership cannot be improperly overwritten/deleted.
- [ ] Verify Serial uniqueness at database level.
- [ ] Verify Serial cannot be reused where prohibited.
- [ ] Verify Collection/Ownership constraints.
- [ ] Verify critical business rules cannot be bypassed by direct API calls.
- [ ] Verify permissions are enforced server-side, not only in the frontend.

### Acceptance criteria

Critical business rules remain enforced even if the frontend is bypassed.

---

# P1 — High Priority Functional Issues

# 7. Collections Main Route

### Current issue

Opening `/beta/collections` or clicking Collections from the header displays the wrong content instead of the Collections page.

### Required work

- [ ] Review route mapping.
- [ ] Review component/page mapping.
- [ ] Review header navigation.
- [ ] Review redirects.
- [ ] Add regression test for `/beta/collections`.

### Acceptance criteria

Collections navigation always opens the actual Collections page.

---

# 8. Collection Access Status

### Current issue

For Noir Collection, the Access request remains `Pending` even though the user has House Key / Granted access and the Collection is active.

### Required work

- [ ] Synchronize request status with granted access.
- [ ] Update/close Request Access when access is granted.
- [ ] Ensure eligibility/grant logic updates the corresponding request state.
- [ ] Test Pending → Granted/Active.

### Acceptance criteria

A granted/active Collection access cannot remain incorrectly displayed as Pending.

---

# 9. Admin Collection Access Actions

### Current issues

- Edit/View actions result in 404.
- Raw i18n key `rotateKey.rowActions.admin` is displayed.
- Rotate House Key needs clear confirmation.

### Required work

- [ ] Fix Edit route.
- [ ] Fix View route.
- [ ] Verify ID/parameter mapping.
- [ ] Verify authorization.
- [ ] Add missing i18n translation.
- [ ] Verify Arabic and English labels.
- [ ] Add confirmation before Rotate House Key.
- [ ] Define clear warning/confirmation text for key rotation.

### Acceptance criteria

Admin actions open the correct pages, use proper translations, and destructive/security-sensitive actions require confirmation.

---

# 10. Analytics Navigation

### Current issue

Clicking Analytics from the sidebar stays on `/overview/admin`, while `/analytics/admin` works directly.

### Required work

- [ ] Fix sidebar Analytics href.
- [ ] Verify route.
- [ ] Verify active sidebar state.
- [ ] Verify redirects/middleware.

### Acceptance criteria

Sidebar Analytics navigation opens `/analytics/admin`.

---

# 11. Analytics Counter Formatting

### Current issue

Counters can display values such as `$3 Members` and `$9 Owned Pieces`, even though these are counts rather than financial values.

### Required work

- [ ] Remove currency formatting from count metrics.
- [ ] Keep currency formatting only for financial metrics.
- [ ] Review all Analytics cards for the same issue.

### Acceptance criteria

Examples:

`3 Members`

`9 Owned Pieces`

Financial metrics use the approved currency format.

---

# 12. Currency Consistency

### Current issue

Some financial metrics use `$` while prices/transactions use SAR.

### Required work

- [ ] Define the approved currency presentation.
- [ ] Standardize currency across:
  - [ ] Products
  - [ ] Checkout
  - [ ] Orders
  - [ ] Payments
  - [ ] Revenue
  - [ ] Analytics
  - [ ] Refunds
  - [ ] Admin
  - [ ] Reports
- [ ] Ensure non-financial counters never receive currency formatting.

### Acceptance criteria

All financial screens consistently use the approved SAR representation.

---

# 13. Timezone

### Current issue

Settings show `+4 UTC / GST`, while the project is Saudi-based and the review requests confirmation of `Asia/Riyadh / UTC+3`.

### Required work

- [ ] Confirm approved timezone.
- [ ] Review backend timezone.
- [ ] Review database timestamp handling.
- [ ] Review frontend date formatting.
- [ ] Review scheduled jobs.
- [ ] Review notifications.
- [ ] Review certificate dates.
- [ ] Review order/payment timestamps.
- [ ] Review Analytics date ranges.
- [ ] Review logs.

### Acceptance criteria

All user-facing and operational timestamps follow the approved timezone consistently.

---

# 14. Checkout Validation

### Current issue

Required validation messages can remain visible after valid values are entered, even though the checkout eventually completes.

### Required work

- [ ] Fix validation state clearing.
- [ ] Verify onChange behavior.
- [ ] Verify onBlur behavior.
- [ ] Verify submit behavior.
- [ ] Verify server-side validation.
- [ ] Verify Arabic messages.
- [ ] Verify English messages.

### Acceptance criteria

`Empty field → Required error`

`Valid field → Error disappears`

Successful submission leaves no stale validation messages.

---

# 15. Viewer Permission UX

The permission enforcement itself worked in tested cases, but the UI still exposes some unavailable actions.

### Required work

- [ ] Replace generic `Something went wrong` with clear `Access Denied` where appropriate.
- [ ] Hide or disable unauthorized Transfer actions.
- [ ] Hide or disable unauthorized Add actions.
- [ ] Hide or disable unauthorized Save actions.
- [ ] Hide or disable unauthorized Edit actions.
- [ ] Review all Viewer-visible actions, not only the tested examples.
- [ ] Keep server-side authorization regardless of UI hiding/disabling.

### Acceptance criteria

Viewer receives a clear, intentional permission experience.

Unauthorized actions are not presented as if they are available.

---

# P1 — Untested Business Flows

# 16. Inheritance Transfer — End-to-End

Gift Transfer was tested, but Inheritance still requires E2E verification.

### Test:

- [ ] Initiation
- [ ] Required information
- [ ] Validation
- [ ] Approval
- [ ] Ownership update
- [ ] Ownership history
- [ ] Certificate lifecycle
- [ ] Previous certificate
- [ ] New certificate
- [ ] Notifications
- [ ] Audit trail
- [ ] Failure/cancellation scenarios

---

# 17. Sale Transfer — End-to-End

### Test:

- [ ] Initiation
- [ ] Buyer/seller information
- [ ] Validation
- [ ] Approval
- [ ] Payment if applicable
- [ ] Ownership update
- [ ] History
- [ ] Certificate lifecycle
- [ ] Previous certificate
- [ ] New certificate
- [ ] Notifications
- [ ] Audit trail
- [ ] Failure/cancellation scenarios

---

# 18. Upload Scenarios — End-to-End

The review identifies upload scenarios as not fully closed.

### Test:

- [ ] Valid upload
- [ ] Invalid file type
- [ ] Large file
- [ ] Empty file
- [ ] Multiple files where applicable
- [ ] Failed upload
- [ ] Replace file
- [ ] Delete file
- [ ] Unauthorized upload
- [ ] Unauthorized download
- [ ] Direct/private file URL access
- [ ] Storage permissions
- [ ] File validation
- [ ] Error handling

---

# P2 — Technical Evidence / Operations

These items may already exist. The requirement is to provide sufficient technical evidence and/or test them.

# 19. CI/CD

Provide evidence for:

- [ ] Build pipeline
- [ ] Test pipeline
- [ ] Deployment process
- [ ] Environment handling
- [ ] Production deployment
- [ ] Failure handling

---

# 20. Rollback

Document/test:

- [ ] Application rollback.
- [ ] Deployment rollback.
- [ ] Database migration rollback strategy.
- [ ] Asset/version compatibility.
- [ ] Failed deployment recovery.
- [ ] Who can trigger rollback.
- [ ] Expected rollback procedure.

---

# 21. Monitoring

Provide evidence for:

- [ ] Application monitoring.
- [ ] API errors.
- [ ] Server health.
- [ ] Database health.
- [ ] Payment failures.
- [ ] Webhook failures.
- [ ] Background jobs.
- [ ] Authentication failures.
- [ ] Critical exceptions.
- [ ] Alerts/notifications.

---

# 22. Backup & Restore

Document and verify:

- [ ] Database backups.
- [ ] Uploaded-file/object-storage backups where required.
- [ ] Configuration backup where required.
- [ ] Backup frequency.
- [ ] Retention.
- [ ] Storage location.
- [ ] Encryption/security.
- [ ] Restore procedure.
- [ ] Actual restore test.
- [ ] Recovery expectations.

A backup should not be marked complete merely because backups exist; provide evidence that restoration works.

---

# 23. Technical Documentation

Ensure documentation exists for:

- [ ] Architecture.
- [ ] Environment setup.
- [ ] Environment variables.
- [ ] Database.
- [ ] Deployment.
- [ ] Payment integration.
- [ ] Webhooks.
- [ ] Certificate lifecycle.
- [ ] Verify system.
- [ ] Ownership lifecycle.
- [ ] Transfer lifecycle.
- [ ] Permissions.
- [ ] Backup.
- [ ] Restore.
- [ ] Rollback.
- [ ] Monitoring.
- [ ] CI/CD.

---

# 24. Final Figma vs Implementation Review

After functional issues are closed:

- [ ] Compare Desktop implementation against Figma.
- [ ] Compare Mobile implementation against Figma.
- [ ] Check Arabic.
- [ ] Check English.
- [ ] Check spacing.
- [ ] Check typography.
- [ ] Check components.
- [ ] Check loading states.
- [ ] Check empty states.
- [ ] Check error states.
- [ ] Check responsive behavior.
- [ ] Check permissions states.
- [ ] Check success states.

---

# Regression Tests — Already Confirmed Working

Do not rebuild these without evidence of regression.

The review confirmed these scenarios working in the tested environment:

- [ ] Wrong Key House key is rejected.
- [ ] Direct access without session returns to the gateway.
- [ ] Customer experience/data isolation works in tested scenarios.
- [ ] Wardrobe isolation works.
- [ ] Class-based Collection access works.
- [ ] Favorites/Wish List synchronization works.
- [ ] Cart works.
- [ ] 15% VAT works.
- [ ] Checkout works functionally in the test environment.
- [ ] Order is generated after test purchase.
- [ ] Ownership is generated after test purchase.
- [ ] Gift Transfer works E2E through ownership update.
- [ ] Admin Ownership History retains previous and new owner.
- [ ] Current owner's certificate remains available during Pending Transfer.
- [ ] Serial/Collection/Status are not editable through Edit Piece.
- [ ] Viewer cannot save sensitive changes in tested paths.

After changes, re-run these regression tests.

---

# Suggested Implementation Order

## Phase 1 — Business-critical

1. [ ] Resolve Key House permanence/renewal requirement.
2. [ ] Implement real payment Sandbox/UAT.
3. [ ] Implement payment webhooks.
4. [ ] Implement payment failure/success/refund/reconciliation.
5. [ ] Fix Certificate creation after Purchase.
6. [ ] Fix Certificate lifecycle after Transfer.
7. [ ] Implement QR/Token Verify flow.
8. [ ] Verify database/API ownership and Serial constraints.
9. [ ] Perform security review.

## Phase 2 — Functional Bugs

10. [ ] Fix Collections route.
11. [ ] Fix Collection Access status synchronization.
12. [ ] Fix Admin Collection Access 404s.
13. [ ] Fix Rotate Key translation.
14. [ ] Add Rotate Key confirmation.
15. [ ] Fix Analytics navigation.
16. [ ] Fix Analytics counter formatting.
17. [ ] Standardize SAR.
18. [ ] Confirm/fix timezone.
19. [ ] Fix Checkout validation.
20. [ ] Improve Viewer permission UX.

## Phase 3 — Missing E2E Coverage

21. [ ] Test Inheritance E2E.
22. [ ] Test Sale E2E.
23. [ ] Test uploads E2E.

## Phase 4 — Technical Evidence

24. [ ] CI/CD evidence.
25. [ ] Rollback evidence.
26. [ ] Monitoring evidence.
27. [ ] Backup + restore evidence.
28. [ ] Technical documentation.

## Phase 5 — Final QA

29. [ ] Re-run regression scenarios.
30. [ ] Compare Desktop against Figma.
31. [ ] Compare Mobile against Figma.
32. [ ] Verify Arabic/English.
33. [ ] Perform final UAT.
34. [ ] Update requirement status.

---

# Definition of Done

A review item should not be marked complete simply because the UI appears to work.

Use one of these statuses:

- `TODO`
- `IN PROGRESS`
- `FIXED`
- `VERIFIED`
- `NEEDS CLARIFICATION`
- `NEEDS TECHNICAL EVIDENCE`
- `NOT APPLICABLE`

For every fixed item, record:

1. What was changed.
2. Where it was changed.
3. How it was tested.
4. Expected result.
5. Actual result.
6. Any remaining limitation.

For technical/infrastructure items, attach evidence where appropriate.

---

# Final Closure Criteria

Before final approval, the following areas need to be closed or explicitly documented:

- [ ] Key House policy is resolved.
- [ ] Real payment integration is working in UAT/Sandbox.
- [ ] Webhooks are verified and idempotent.
- [ ] Refund/failure/success flows are tested.
- [ ] Certificate issuance works.
- [ ] Certificate history/archive works.
- [ ] QR/Token Verify works.
- [ ] Ownership/Serial DB constraints are verified.
- [ ] Security review is completed.
- [ ] Collections route is fixed.
- [ ] Collection Access state is synchronized.
- [ ] Admin Collection actions work.
- [ ] Analytics navigation works.
- [ ] Currency formatting is consistent.
- [ ] Timezone is confirmed.
- [ ] Checkout validation is fixed.
- [ ] Viewer UX is cleaned up.
- [ ] Inheritance is tested E2E.
- [ ] Sale is tested E2E.
- [ ] Uploads are tested E2E.
- [ ] CI/CD evidence is provided.
- [ ] Rollback evidence is provided.
- [ ] Monitoring evidence is provided.
- [ ] Backup/restore evidence is provided.
- [ ] Technical documentation is complete.
- [ ] Final Desktop/Mobile Figma comparison is complete.
- [ ] Regression tests pass.
- [ ] Final UAT passes.
