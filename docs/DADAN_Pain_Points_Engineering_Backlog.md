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
