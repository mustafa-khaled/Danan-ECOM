# DADAN Dijital — Full Claude Code Prompt Guide

## Private Luxury Jewelry Ownership Platform

---

> **Platform Name:** DADAN Dijital  
> **Type:** Closed, invitation-only luxury digital ownership house  
> **Stack:** Next.js (App Router) · NestJS · PostgreSQL · Prisma · S3-compatible Storage · PDF generation  
> **Access Model:** House Key authentication — no public browsing  
> **Delivery Model:** Phased — P0 → P1 → P2 → P3

---

## How to Use This Guide

Each section below is a self-contained Claude Code work order. Feed them in sequence. Each prompt builds on the output of the previous one. Placeholders use `{{DOUBLE_BRACES}}` — fill them before submitting.

**Recommended placeholders to resolve before starting:**

| Placeholder                  | Example                                       |
| ---------------------------- | --------------------------------------------- |
| `{{REPO_ROOT}}`              | `/home/user/dadan-dijital`                    |
| `{{DB_URL}}`                 | `postgresql://user:pass@localhost:5432/dadan` |
| `{{PAYMENT_PROVIDER}}`       | `Moyasar` or `Tap Payments`                   |
| `{{S3_BUCKET}}`              | `dadan-assets`                                |
| `{{ADMIN_EMAIL}}`            | `admin@dadan.sa`                              |
| `{{BASE_URL}}`               | `https://dadan.sa`                            |
| `{{CERTIFICATE_BRAND_NAME}}` | `DADAN Dijital`                               |

---

---

# PROMPT 00 — Repository, Monorepo, and Environment Bootstrap

```
You are building DADAN Dijital — a closed, invitation-only luxury digital jewelry ownership platform.

Set up a Turborepo monorepo at {{REPO_ROOT}} with the following workspace structure:

apps/
  web/          → Next.js 15 App Router (client-facing, fully private)
  admin/        → Next.js 15 App Router (DADAN staff dashboard)
  api/          → NestJS application (REST API, business logic, auth)

packages/
  db/           → Prisma schema + generated client (shared)
  ui/           → Shared React component library (luxury design tokens)
  types/        → Shared TypeScript interfaces and enums
  utils/        → Shared pure utilities (serial number, certificate, transfer logic)
  config/       → Shared ESLint, Prettier, TypeScript base configs

Root-level setup:
- turbo.json with pipeline: build, dev, lint, test, db:generate, db:migrate
- pnpm workspaces
- .env.example with all required environment variables
- Docker Compose file for local: postgres, redis (storage is local by default)
- GitHub Actions CI: lint → typecheck → test → build (all apps)
- .gitignore including .env files, node_modules, .next, dist

Environment variables to scaffold (.env.example):
DATABASE_URL
REDIS_URL
JWT_SECRET
HOUSE_KEY_SALT        # bcrypt salt rounds for House Key hashing
STORAGE_PROVIDER       # local | s3 | r2 | hetzner
STORAGE_LOCAL_PATH     # default: /app/uploads
# S3_ENDPOINT           # uncomment only when STORAGE_PROVIDER != local
# S3_BUCKET
# S3_ACCESS_KEY
# S3_SECRET_KEY
PAYMENT_PROVIDER_KEY
PAYMENT_PROVIDER_SECRET
BASE_URL
ADMIN_EMAIL
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
PDF_WATERMARK_TEXT    # e.g. "DADAN DIJITAL — AUTHENTICATED"

Deliver:
- All config files (turbo.json, package.json files, tsconfig files)
- docker-compose.yml
- .env.example
- CI workflow file
- README.md explaining local setup in 5 commands
```

---

# PROMPT 01 — Database Schema (Prisma + PostgreSQL)

```
You are working on DADAN Dijital at {{REPO_ROOT}}.

Inside packages/db/, write the complete Prisma schema (schema.prisma) for the platform.

Entity requirements:

--- CLIENTS ---
model Client {
  - id: UUID primary key
  - houseKey: String unique (stored as bcrypt hash)
  - houseKeyPrefix: String (first 4 chars plaintext, for admin display only)
  - displayName: String (shown throughout the UI after login)
  - email: String unique
  - phone: String?
  - locale: String default "ar"
  - isActive: Boolean default true
  - visibilityGroups: String[] (array of group tags for curated visibility)
  - createdAt, updatedAt
  - relations: ownedPieces, savedPieces, sentTransfers, receivedTransfers, verificationLogs, orders
}

--- COLLECTIONS ---
model Collection {
  - id, name, slug (unique), description, coverImageUrl
  - isVisible: Boolean
  - sortOrder: Int
  - visibilityGroups: String[] (which client groups can see this collection)
  - createdAt, updatedAt
  - relations: designs
}

--- DESIGNS (product templates) ---
model Design {
  - id, name, slug (unique), collectionId
  - story: String (long text — the narrative of the piece)
  - material, weight (Decimal), dimensions
  - imageUrls: String[] (ordered gallery)
  - basePrice: Decimal, currency: String default "SAR"
  - isActive: Boolean
  - visibilityGroups: String[]
  - createdAt, updatedAt
  - relations: collection, pieces, specifications
}

--- DESIGN SPECIFICATIONS ---
model DesignSpecification {
  - id, designId
  - key: String (e.g. "Stone", "Cut", "Carat")
  - value: String
  - sortOrder: Int
}

--- PIECES (physical instances of a Design) ---
model Piece {
  - id: UUID
  - serialNumber: String unique (generated, never reused)
  - designId
  - currentOwnerId: String? (FK to Client)
  - status: PieceStatus enum (AVAILABLE, OWNED, TRANSFER_PENDING, RETIRED)
  - registeredAt: DateTime
  - createdAt, updatedAt
  - relations: design, currentOwner, ownershipRecords, certificates, transferRequests, verificationLogs, orderItems, savedByClients
}

--- OWNERSHIP RECORDS (append-only, never deleted) ---
model OwnershipRecord {
  - id, pieceId, clientId
  - acquiredAt: DateTime
  - transferredAt: DateTime?
  - acquisitionType: AcquisitionType enum (PURCHASE, GIFT, INHERITANCE, ADMIN_ASSIGNMENT)
  - notes: String?
  - certificateId: String? (FK to the certificate issued for this ownership event)
}

--- CERTIFICATES ---
model Certificate {
  - id, pieceId, ownerId (clientId at time of issuance)
  - certificateNumber: String unique
  - issuedAt: DateTime
  - isActive: Boolean (false when superseded)
  - pdfUrl: String? (S3 key to generated PDF)
  - qrCodeData: String (verification URL + signing token)
  - templateVersion: String
  - createdAt, updatedAt
}

--- ORDERS ---
model Order {
  - id, clientId
  - status: OrderStatus enum (PENDING, PAID, PROCESSING, FULFILLED, CANCELLED)
  - totalAmount: Decimal, currency: String
  - paymentProvider: String, paymentReference: String?
  - shippingAddress: Json
  - placedAt: DateTime
  - createdAt, updatedAt
  - relations: client, items
}

model OrderItem {
  - id, orderId, pieceId, designId (snapshot), priceAtPurchase: Decimal
}

--- SAVED PIECES ---
model SavedPiece {
  - clientId, pieceId (composite PK)
  - savedAt: DateTime
}

--- TRANSFER REQUESTS ---
model TransferRequest {
  - id, pieceId, fromClientId, toClientId
  - transferType: TransferType enum (SALE, GIFT, INHERITANCE)
  - status: TransferStatus enum (INITIATED, SENDER_CONFIRMED, RECIPIENT_CONFIRMED, DADAN_REVIEW, APPROVED, REJECTED, CANCELLED)
  - senderConfirmedAt: DateTime?
  - recipientConfirmedAt: DateTime?
  - dadanReviewedAt: DateTime?
  - dadanReviewedBy: String? (AdminUser id)
  - dadanNotes: String?
  - initiatedAt: DateTime
  - completedAt: DateTime?
}

--- VERIFICATION LOGS ---
model VerificationLog {
  - id, pieceId, serialNumber (snapshot)
  - verifiedAt: DateTime
  - ipAddress: String?
  - clientId: String? (null if anonymous)
  - result: VerificationResult enum (FOUND, NOT_FOUND)
}

--- ADMIN USERS ---
model AdminUser {
  - id, email: String unique, passwordHash: String
  - displayName: String
  - role: AdminRole enum (SUPER_ADMIN, STAFF, VIEWER)
  - isActive: Boolean
  - createdAt, updatedAt
  - relations: transfersReviewed
}

--- AUDIT LOGS ---
model AuditLog {
  - id, actorType: ActorType enum (CLIENT, ADMIN, SYSTEM)
  - actorId: String
  - action: String (e.g. "TRANSFER_APPROVED", "CERTIFICATE_GENERATED", "HOUSE_KEY_VALIDATED")
  - targetType: String?, targetId: String?
  - metadata: Json?
  - createdAt: DateTime
}

Business rules to enforce at schema level:
- serialNumber on Piece must be unique and is immutable after creation
- OwnershipRecord has no delete/update cascade — append-only by convention
- TransferRequest cannot move backwards in status (enforce in service layer, note in schema comments)
- Certificate isActive=false when a new certificate is issued for the same piece

Generate:
- packages/db/prisma/schema.prisma with all models above
- packages/db/src/index.ts exporting PrismaClient singleton
- A seed file at packages/db/prisma/seed.ts with:
  - 2 AdminUsers (SUPER_ADMIN + STAFF)
  - 3 Clients with houseKeys (plaintext in seed, hashed on insert)
  - 2 Collections, 4 Designs, 6 Pieces
  - 2 Certificates
  - 1 Transfer Request in DADAN_REVIEW status
- Migration: run prisma migrate dev --name init
- README note in packages/db/README.md
```

---

# PROMPT 02 — NestJS API: House Key Authentication & Session

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/api.

Implement the House Key authentication system. This is the only way clients access the platform — there is no username/password login.

House Key rules:
- Each House Key is a unique string issued by DADAN to one client only.
- Keys are stored bcrypt-hashed in the database. The plaintext key is never stored.
- After successful validation, issue a signed JWT (httpOnly cookie + JSON response).
- JWT payload: { sub: clientId, displayName, visibilityGroups, iat, exp }
- Session duration: 30 days (sliding on activity).
- A House Key cannot be shared between two clients. The mapping is 1:1 permanent.
- Rate-limit House Key attempts: max 5 attempts per IP per 15 minutes.

Modules to create:

1. AuthModule
   - POST /auth/validate-key
     Body: { houseKey: string }
     - Trim and normalize input
     - Hash and compare against all active Client records (use bcrypt.compare)
     - On match: create AuditLog entry (action: HOUSE_KEY_VALIDATED), return JWT
     - On fail: increment rate limit counter, return 401 with generic message
     - Never reveal whether a key exists or not — always return the same error message
   - POST /auth/logout
     - Clear session cookie
     - AuditLog: HOUSE_KEY_LOGOUT
   - GET /auth/me
     - Protected route, returns current client profile (no houseKey field ever)

2. ClientGuard (JWT guard for client routes)
   - Validates JWT from Authorization header OR httpOnly cookie
   - Attaches client object to request
   - Returns 401 if expired or invalid

3. AdminAuthModule
   - POST /admin/auth/login  (email + password, bcrypt)
   - POST /admin/auth/logout
   - AdminGuard with role check (SUPER_ADMIN, STAFF, VIEWER)

4. House Key Admin Management
   - POST /admin/clients/:id/rotate-key  (SUPER_ADMIN only)
     - Generates a new random House Key (crypto.randomBytes(16).toString('hex'))
     - Hashes and updates the client record
     - Returns the new plaintext key ONCE (never stored)
     - AuditLog: HOUSE_KEY_ROTATED

Security requirements:
- All House Key comparison timing must be constant-time (bcrypt handles this)
- JWT_SECRET from environment, minimum 64 chars
- httpOnly, Secure, SameSite=Strict cookies in production
- All auth endpoints behind HTTPS in production (note in README)
- AuditLog every auth event with IP address

Deliver:
- src/auth/ module with all guards, strategies, DTOs
- src/admin/auth/ module
- Integration tests for: valid key → JWT, invalid key → 401, rate limit → 429
- Postman/REST collection file for auth endpoints
```

---

# PROMPT 03 — NestJS API: Clients, Visibility, and Profile

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/api.

Implement client profile management and the visibility logic that controls which collections and pieces each client can see.

Visibility System:
- Each Client has visibilityGroups: String[] (e.g. ["vip", "collection-noir", "riyadh"])
- Each Collection and Design also has visibilityGroups: String[]
- A client can see a collection/design if there is ANY intersection between their groups and the item's groups
- If an item has an empty visibilityGroups array, it is visible to ALL active clients
- An item with visibilityGroups: ["admin-only"] is never visible to clients

Client-facing endpoints (all require ClientGuard):

GET /client/profile
  - Returns: id, displayName, email, phone, locale, visibilityGroups, createdAt
  - Never returns houseKey or houseKeyPrefix

PATCH /client/profile
  - Allowed fields: phone, locale only (name/email changes require admin)

GET /client/collections
  - Returns only collections visible to the authenticated client
  - Includes piece count per collection (only pieces visible to this client)

GET /client/collections/:slug
  - Returns collection detail + paginated designs visible to this client

GET /client/designs/:slug
  - Returns design detail, all specifications, available pieces, price
  - 404 if design not visible to this client (same response as truly not found)

Admin endpoints (AdminGuard, STAFF+):

GET /admin/clients
  - Paginated list: id, displayName, email, houseKeyPrefix, isActive, visibilityGroups, pieceCount

POST /admin/clients
  - Creates a new client
  - Generates House Key automatically (return plaintext once, hash stored)
  - Body: { displayName, email, phone?, locale?, visibilityGroups? }

GET /admin/clients/:id
  - Full profile + owned pieces + transfer history

PATCH /admin/clients/:id
  - Update: displayName, email, phone, locale, isActive, visibilityGroups

POST /admin/clients/:id/visibility-groups
  - Add or remove visibility group tags
  - Body: { add?: string[], remove?: string[] }

Business rules:
- A deactivated client (isActive: false) cannot validate their House Key
- Visibility group names are free-form strings, normalized to lowercase-kebab
- Log every admin mutation to AuditLog

Deliver:
- src/clients/ module (client-facing controller + admin controller)
- src/visibility/ service (reusable visibility filter used by all piece/collection queries)
- Unit tests for visibility logic (intersection, empty groups, admin-only groups)
- E2E tests: client A sees X pieces, client B with different groups sees Y pieces
```

---

# PROMPT 04 — NestJS API: Pieces, Serials, Collections, and Wardrobe

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/api.

Implement piece management, serial number generation, and the Jewelry Wardrobe.

Serial Number System:
- Format: DADAN-{YEAR}-{COLLECTION_CODE}-{SEQUENCE_PADDED_6}
  Example: DADAN-2025-NR-000047
- Generated atomically using a PostgreSQL sequence per collection code
- Once assigned to a piece, the serial number is IMMUTABLE and NEVER reused
- Even if a piece is retired, its serial is permanently reserved

Client-facing endpoints (ClientGuard):

GET /client/wardrobe
  - Returns all Pieces where currentOwnerId === authenticated client
  - Each piece includes: serialNumber, design (name, images, specs), certificate (if exists), currentStatus
  - Ordered by: acquiredAt DESC

GET /client/wardrobe/:pieceId
  - Full piece detail for owned pieces
  - Include full ownership history (show dates and acquisition type, NOT previous owner names)
  - Include active certificate reference
  - Include transfer request if status is TRANSFER_PENDING

GET /client/saved
  - Returns client's SavedPieces with design and piece info

POST /client/saved/:pieceId
  - Add piece to saved list (idempotent)

DELETE /client/saved/:pieceId
  - Remove from saved list

Admin endpoints (AdminGuard, STAFF+):

POST /admin/pieces
  - Register a new physical piece
  - Body: { designId, notes? }
  - Auto-generates serial number
  - Creates first OwnershipRecord if initialClientId provided
  - Creates initial Certificate
  - AuditLog: PIECE_REGISTERED

GET /admin/pieces
  - Paginated: serialNumber, design name, collection, currentOwner name, status

GET /admin/pieces/:id
  - Full piece detail: design, specs, images, full ownership history, all certificates, transfer history

PATCH /admin/pieces/:id
  - Update: status (AVAILABLE → OWNED requires ownership record), notes
  - Cannot change serialNumber

POST /admin/pieces/:id/assign
  - Assign piece to a client (AVAILABLE → OWNED)
  - Body: { clientId, acquisitionType: ADMIN_ASSIGNMENT, notes? }
  - Creates OwnershipRecord, generates Certificate
  - AuditLog: PIECE_ASSIGNED

Admin: Collections and Designs

POST /admin/collections
PATCH /admin/collections/:id
DELETE /admin/collections/:id  (soft delete — set isVisible: false)
POST /admin/designs
PATCH /admin/designs/:id
POST /admin/designs/:id/images  (upload to S3, append to imageUrls)
DELETE /admin/designs/:id  (soft delete)
POST /admin/designs/:id/specifications  (bulk upsert spec key/value pairs)

Deliver:
- src/pieces/ module
- src/collections/ module
- src/serial-number/ service with generation + reservation logic
- Unit tests: serial uniqueness, serial immutability, wardrobe visibility
- Integration test: assign piece → appears in wardrobe
```

---

# PROMPT 05 — NestJS API: Cart, Checkout, and Order Fulfillment

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/api.

Implement the direct purchase flow. DADAN sells individual one-of-a-kind pieces; each piece has one serial and can only be sold once.

Cart Rules:
- Cart is server-side, tied to authenticated client session
- Only one instance of each piece can be in cart
- A piece already owned by ANY client cannot be added to cart
- A piece in another client's cart for >30 minutes is released back to available
- Cart items are scoped per client — clients cannot see each other's carts

Endpoints:

GET /client/cart
POST /client/cart  — Body: { pieceId }
  - Validate: piece is AVAILABLE, not in another active cart
  - Reserve piece temporarily (30-minute hold)
DELETE /client/cart/:pieceId

POST /client/checkout
  Body: {
    shippingAddress: { fullName, line1, line2?, city, region, country, postalCode, phone },
    paymentMethod: "CARD" | "MADA" | "APPLE_PAY",
    paymentToken: string  (from {{PAYMENT_PROVIDER}} client SDK)
  }
  Flow:
  1. Validate all cart pieces are still available (re-check)
  2. Calculate total
  3. Call {{PAYMENT_PROVIDER}} charge API with paymentToken
  4. On payment success:
     a. Create Order record (status: PAID)
     b. For each piece: set status → OWNED, currentOwnerId → client
     c. Create OwnershipRecord (acquisitionType: PURCHASE)
     d. Trigger certificate generation job (async)
     e. Clear cart
     f. AuditLog: ORDER_PLACED, PIECE_OWNERSHIP_TRANSFERRED (system)
  5. On payment failure: return payment error, pieces remain in cart
  6. Return: orderId, orderStatus, pieceSerials[]

GET /client/orders
  - Client's order history (paginated)

GET /client/orders/:orderId
  - Order detail with pieces, payment reference, shipping address

POST /client/orders/:orderId/cancel  (only PENDING orders, before payment)

Admin:
GET /admin/orders  — paginated, filterable by status/client
GET /admin/orders/:id
PATCH /admin/orders/:id/status  — PROCESSING → FULFILLED

Payment provider integration:
- Wrap {{PAYMENT_PROVIDER}} in a PaymentService with interface:
  charge(token, amount, currency, metadata): Promise<PaymentResult>
- PaymentResult: { success, providerReference, failureCode?, failureMessage? }
- This abstraction allows swapping providers later

Deliver:
- src/cart/ module with expiry cleanup (cron job every 5 minutes)
- src/orders/ module
- src/payments/ module with {{PAYMENT_PROVIDER}} adapter
- Unit tests: cart reservation expiry, double-purchase prevention
- Integration test: full checkout flow with mocked payment provider
```

---

# PROMPT 06 — NestJS API: Digital Certificate Generation

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/api.

Implement the digital ownership certificate system.

Certificate Requirements:
- Each certificate is a luxury-formatted PDF
- Must include: piece image, piece name, collection name, serial number, material,
  weight, dimensions, specifications, issue date, owner display name, certificate number
- Must include a QR code linking to the verification page:
  {{BASE_URL}}/verify?serial={serialNumber}&token={verificationToken}
- verificationToken = HMAC-SHA256(serialNumber + certificateId, CERT_SIGNING_SECRET)
- Must include PDF watermark text: "{{CERTIFICATE_BRAND_NAME}} — AUTHENTICATED"
- Old certificates remain archived (isActive=false) — never deleted

Certificate Number Format:
  CERT-{YEAR}-{RANDOM_8_HEX_UPPERCASE}
  Example: CERT-2025-A3F1C09B

Certificate Generation Service (src/certificates/):

generateCertificate(pieceId: string, ownerId: string): Promise<Certificate>
  1. Fetch piece with design, specs, currentOwner
  2. Generate certificate number
  3. Generate QR code (qrcode npm package) as base64 PNG
  4. Download piece primary image from S3 as buffer
  5. Render PDF using pdf-lib:
     - A4 portrait, dark luxury background (#0D0D0D or brand color)
     - DADAN logo area at top
     - Piece image centered
     - Certificate title: "Certificate of Authenticity"
     - All fields in luxury serif/mono typography
     - QR code bottom-right
     - Watermark diagonal at 30% opacity
  6. Upload PDF to S3: certificates/{certificateId}.pdf
  7. Mark any previous certificates for this piece as isActive=false
  8. Save Certificate record with pdfUrl and qrCodeData
  9. AuditLog: CERTIFICATE_GENERATED

regenerateCertificate(pieceId: string, newOwnerId: string): Promise<Certificate>
  - Same flow, archives previous

Client endpoints:
GET /client/wardrobe/:pieceId/certificate
  - Returns: certificateNumber, issuedAt, pdfUrl (signed S3 URL, 1-hour expiry), qrCodeData

GET /client/wardrobe/:pieceId/certificate/download
  - Streams the PDF directly with Content-Disposition: attachment

Admin endpoints:
POST /admin/certificates/regenerate/:pieceId
  - Force regenerate (SUPER_ADMIN only)

GET /admin/certificates
  - Paginated list of all certificates with piece and owner info

Verification endpoint (semi-public, no auth required but rate-limited):
GET /verify?serial={serial}&token={token}
  - Validate HMAC token
  - If valid: return piece info (name, collection, design specs, issuedAt)
  - NEVER return owner name or client information
  - Log to VerificationLog (with clientId if authenticated, null if anonymous)
  - If invalid/not found: return generic "Certificate not found" — no distinction

Deliver:
- src/certificates/ module + service
- src/verify/ public endpoint module
- Unit tests: QR token generation, HMAC verification, certificate number uniqueness
- Integration test: purchase piece → certificate generated → verification returns correct data
```

---

# PROMPT 07 — NestJS API: Ownership Transfer Workflow

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/api.

Implement the full ownership transfer system. This is the most critical business workflow.

Transfer Rules (NON-NEGOTIABLE):
1. Transfer CANNOT complete automatically under any circumstances.
2. Transfer requires: sender confirmation → recipient confirmation → DADAN final approval.
3. DADAN must communicate directly with both parties during review.
4. A transfer can be rejected at any stage.
5. Only one active transfer per piece at a time.
6. Recipient is identified by their House Key — the sender enters the recipient's House Key.
7. If approved: ownership record updates, new certificate issues, notifications send.
8. If rejected: piece returns to OWNED status with original owner.

Transfer Status Machine:
INITIATED → SENDER_CONFIRMED → RECIPIENT_CONFIRMED → DADAN_REVIEW → APPROVED | REJECTED
Any status can move to CANCELLED (by sender, before DADAN_REVIEW)

Client endpoints:

POST /client/transfers/initiate
  Body: { pieceId, transferType: SALE|GIFT|INHERITANCE, recipientHouseKey: string }
  - Validate: piece is owned by authenticated client
  - Validate: no active transfer exists for this piece
  - Validate: recipientHouseKey resolves to a real active client (but don't reveal who)
  - Create TransferRequest (status: INITIATED)
  - Display to sender: piece image, serial, piece name, recipient display name
  - AuditLog: TRANSFER_INITIATED
  - Trigger: email to sender asking for confirmation

POST /client/transfers/:transferId/confirm-sender
  - Authenticated as the SENDER
  - Validate status is INITIATED
  - Update status → SENDER_CONFIRMED
  - Trigger: email/notification to recipient
  - AuditLog: TRANSFER_SENDER_CONFIRMED

POST /client/transfers/:transferId/confirm-recipient
  - Authenticated as the RECIPIENT
  - Validate status is SENDER_CONFIRMED
  - Update status → RECIPIENT_CONFIRMED → DADAN_REVIEW
  - Trigger: email to DADAN admin team + both parties
  - AuditLog: TRANSFER_RECIPIENT_CONFIRMED, TRANSFER_DADAN_REVIEW_TRIGGERED

POST /client/transfers/:transferId/cancel
  - Authenticated as the SENDER
  - Only allowed in INITIATED or SENDER_CONFIRMED status
  - Update status → CANCELLED
  - AuditLog: TRANSFER_CANCELLED_BY_SENDER

GET /client/transfers
  - Returns all transfers where client is sender or recipient
  - Include: piece info, other party display name (first name + last initial only), status, dates

GET /client/transfers/:transferId
  - Full transfer detail for involved parties only

Admin endpoints (STAFF+):

GET /admin/transfers
  - Paginated, filterable by status
  - DADAN_REVIEW items prominently flagged

GET /admin/transfers/:id
  - Full detail: piece + image, sender info, recipient info, timeline, all confirmation timestamps

POST /admin/transfers/:id/approve
  - SUPER_ADMIN only
  - Body: { notes?: string }
  - Atomic transaction:
    a. Update TransferRequest → APPROVED
    b. Update Piece: currentOwnerId → toClientId
    c. Close current OwnershipRecord (transferredAt = now)
    d. Create new OwnershipRecord for recipient
    e. Set piece status back to OWNED
    f. Call certificateService.regenerateCertificate(pieceId, toClientId)
    g. AuditLog: TRANSFER_APPROVED
    h. Send notifications to both parties

POST /admin/transfers/:id/reject
  - SUPER_ADMIN only
  - Body: { reason: string }
  - Update status → REJECTED
  - Piece status stays OWNED with original owner
  - AuditLog: TRANSFER_REJECTED
  - Notify both parties

POST /admin/transfers/:id/contact-sender  (log communication touchpoint)
POST /admin/transfers/:id/contact-recipient  (log communication touchpoint)

All transitions must be wrapped in database transactions.
All state changes must create AuditLog entries.
Email notifications are fire-and-forget (async queue) — never block the HTTP response.

Deliver:
- src/transfers/ module
- src/notifications/ service (email stubs for each event)
- State machine guard utility in packages/utils/
- Unit tests: all state transitions (valid + invalid)
- Integration test: full happy path initiate → sender confirm → recipient confirm → admin approve → new certificate issued
- Integration test: rejection path
```

---

# PROMPT 08 — Next.js Web App: Design System and Access Gate

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/web.

This is a luxury, private-access Next.js 15 App Router application. The entire app is
behind a House Key gate. No page — including the home page — is accessible without
a valid, verified House Key session.

DESIGN SYSTEM (establish first, used by all subsequent prompts):

TypeUI setup (required before UI work):
- Active design system: TypeUI **Luxury** (`luxury`) — see `.typeui-design-system.json`
- Project skills (exactly one design-system skill):
  - `.agents/skills/typeui-fundamentals/` — read all guardrail files before coding
  - `.agents/skills/typeui-design-system/` — component/token specs for visual direction
- Do NOT enable other UI-generation skills alongside TypeUI in this project
- Conflict resolution order: fundamentals guardrails → Luxury design-system tokens → DADAN brand overrides below
- After each UI section: run 1 fundamentals-only cleanup loop via TypeUI MCP before starting the next section
- Theme source of truth: `packages/ui/src/styles/theme.css` (maps Luxury tokens + DADAN brand palette)

Brand Identity:
- DADAN is a luxury Saudi jewelry house — blend of modern minimalism and classic Arabic heritage
- Primary palette:
  --color-void: #0A0A0A          (near-black background)
  --color-surface: #141414        (card/panel background)
  --color-border: #2A2A2A         (subtle borders)
  --color-gold: #C9A96E           (primary accent — warm Saudi gold)
  --color-gold-light: #E8D5A3     (gold highlight)
  --color-ivory: #F5F0E8          (primary text on dark)
  --color-ivory-muted: #9E9A93    (secondary text)
  --color-ruby: #8B1A1A           (danger/alerts)
  --color-emerald: #1A5C3A        (success/verified)

Typography:
  --font-display: "Cormorant Garamond", Georgia, serif  (headings, luxury feel)
  --font-body: "Inter", system-ui, sans-serif           (body text, UI labels)
  --font-mono: "IBM Plex Mono", monospace               (serial numbers, codes, certificates)
  Arabic text: "Noto Naskh Arabic" or system Arabic fallback

Spacing scale: 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)
Border radius: 2px (luxury sharp edges) — subtle, not rounded
Shadows: dark, inset luxury feel — box-shadow: 0 1px 0 rgba(201,169,110,0.15)

Component library (packages/ui/ — shared with admin):
- <LuxuryButton variant="primary|ghost|danger" size="sm|md|lg" />
- <GoldDivider /> — thin horizontal rule with gold tint
- <SerialBadge serial="DADAN-2025-NR-000047" /> — mono font, letter-spaced
- <PieceCard piece={...} /> — dark card, gold hover border, image, name, serial
- <ClientBadge name="..." /> — top-right client name display
- <StatusPill status="..." /> — transfer/order status indicator
- <LuxuryModal /> — dark overlay modal
- <LoadingRune /> — minimal DADAN-branded loading indicator

Layout components:
- <PrivateLayout /> — wraps all authenticated pages, shows ClientBadge + nav
- <AdminLayout /> — wraps all admin pages

ACCESS GATE (apps/web/app/page.tsx — the ONLY public page):

Requirements:
- Full-screen dark page, centered DADAN logo/wordmark
- Single input field: "House Key" (type="password", no autocomplete)
- Arabic subtitle: "أدخل مفتاحك الخاص"
- Submit button: "Enter" / "دخول"
- On submit: POST /auth/validate-key → on success redirect to /home
- On failure: subtle error message, no detail about why
- Rate limit feedback: after 3 failed attempts show "Please wait before trying again"
- NO links, NO sign-up, NO "forgot key" — this is invitation-only
- Subtle gold particle or geometry animation in background (CSS only, no heavy JS)
- RTL-aware (the Arabic text must render correctly)

Session handling:
- Use Next.js middleware (middleware.ts) to protect ALL routes except /
- If no valid JWT cookie: redirect to /
- If valid JWT: allow through, inject client context via React context
- ClientContext: { clientId, displayName, visibilityGroups }

Deliver:
- packages/ui/src/ with all components above (Tailwind CSS, CSS variables)
- apps/web/app/page.tsx (access gate)
- apps/web/middleware.ts (route protection)
- apps/web/lib/client-context.tsx (session context provider)
- apps/web/lib/api.ts (typed fetch wrapper pointing to the NestJS API)
- Storybook stories for all UI components
- Visual test: access gate renders correctly, form submits, error shows
```

---

# PROMPT 09 — Next.js Web App: Client Home and Curated Collections

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/web.

Build the authenticated client home page and collection browsing experience.

All pages use <PrivateLayout /> and require authenticated session.
Client name (from ClientContext) must appear in the top-right as <ClientBadge />.

apps/web/app/(private)/home/page.tsx — Client Home

Sections:
1. WELCOME HEADER
   - "مرحباً، {displayName}" in Arabic (Cormorant Garamond, large)
   - English: "Welcome to your private house" in smaller gold-tinted text
   - Current date in Arabic and English

2. FEATURED COLLECTION HERO
   - Full-width dark card showing the featured collection
   - Large collection image, collection name, brief description
   - CTA: "Explore Collection" → links to /collections/{slug}

3. NEW ARRIVALS GRID
   - 3-4 piece cards (newest pieces, filtered by client visibility)
   - Each: <PieceCard /> with piece image, design name, collection, price
   - "View All" link

4. YOUR WARDROBE PREVIEW
   - If client owns pieces: show 2-3 wardrobe pieces as mini-cards
   - CTA: "Open Wardrobe" → /wardrobe
   - If no pieces: elegant empty state "Your collection awaits"

5. SAVED PIECES PREVIEW
   - If saved pieces exist: show 2 saved pieces
   - CTA: "View Saved" → /saved

All data fetched server-side (Next.js Server Components) with the client's JWT cookie
forwarded to the API. Visibility filtering happens in the API — the frontend trusts the API response.

apps/web/app/(private)/collections/page.tsx — Collections Grid

- Grid of collection cards (only visible collections for this client)
- Each card: cover image, collection name, piece count, "Explore →"
- Dark luxury grid layout

apps/web/app/(private)/collections/[slug]/page.tsx — Collection Detail

- Collection hero: full-width image, name, description
- Filterable/sortable piece grid (filter by material, sort by price)
- Each piece: <PieceCard /> — click → /pieces/{designSlug}
- If collection not visible to this client: 404 (identical to not-found page)

apps/web/app/(private)/pieces/[slug]/page.tsx — Piece / Design Detail

Sections:
1. IMAGE GALLERY — large main image with thumbnail strip, zoom on hover
2. PIECE HEADER — design name, collection name, serial number (if a specific piece is selected), price in SAR
3. STORY — long-form narrative text (Cormorant Garamond italic)
4. SPECIFICATIONS TABLE — material, weight, dimensions, stone details etc.
5. PURCHASE CTA — "Add to Cart" button (if piece is AVAILABLE), or "Owned by You" badge, or "Not Available"
6. SAVE button — bookmark icon, toggles saved state

Navigation:
- Breadcrumb: Home > Collections > {collection} > {piece}
- Always show client name in header

Deliver:
- All page files above
- Loading skeletons for each page (Suspense boundaries)
- Error boundaries with luxury empty states
- Mobile-responsive layouts (RTL support for Arabic content)
```

---

# PROMPT 10 — Next.js Web App: Cart, Checkout, and Order Confirmation

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/web.

Build the cart and checkout experience. DADAN sells unique physical luxury pieces — each
purchase is meaningful and irreversible. The UI must reflect that gravity.

apps/web/app/(private)/cart/page.tsx — Cart

- List of reserved pieces (server-fetched from GET /client/cart)
- Each item: piece image, name, serial number, collection, price
- Reservation timer: "Reserved for {MM:SS}" — countdown, auto-refresh at 0
- Remove item button (DELETE /client/cart/:pieceId)
- Order summary: subtotal, estimated VAT (15% Saudi), total in SAR
- CTA: "Proceed to Checkout" → /checkout
- Empty cart: luxury illustration, "Your cart is empty", CTA to collections

apps/web/app/(private)/checkout/page.tsx — Checkout (multi-step, single page)

Step 1 — Order Review:
- Read-only piece list with images and serials
- Confirm total
- "Confirm and Continue" button

Step 2 — Shipping Address:
- Fields: Full Name, Phone, Address Line 1, Line 2, City, Region (Saudi regions), Postal Code
- Country: Saudi Arabia (fixed for Phase 1, others optional config)
- RTL-aware form layout

Step 3 — Payment:
- Integrate {{PAYMENT_PROVIDER}} hosted fields / JS SDK
- Show accepted methods: Visa, Mastercard, Mada, Apple Pay
- No raw card data touches DADAN servers — all via provider SDK
- Submit: POST /client/checkout with paymentToken from provider
- Loading state: "Completing your acquisition..." (never "processing payment" — luxury language)

Step 4 — Confirmation:
- Success: order reference, list of acquired pieces with serials
- Message: "Your certificate is being prepared and will appear in your Wardrobe shortly."
- CTA: "Open Wardrobe" + "Continue Browsing"
- Failure: clear error, option to retry payment, pieces remain reserved

Language:
- Use luxury framing: "Acquire" not "Buy", "Your Collection" not "Cart", "Piece" not "Product"

Deliver:
- apps/web/app/(private)/cart/page.tsx
- apps/web/app/(private)/checkout/page.tsx (multi-step client component)
- apps/web/app/(private)/orders/page.tsx (order history)
- apps/web/app/(private)/orders/[id]/page.tsx (order detail)
- Payment provider SDK integration (follow {{PAYMENT_PROVIDER}} docs for Next.js)
- E2E test stub: add to cart → checkout → confirmation page renders
```

---

# PROMPT 11 — Next.js Web App: Jewelry Wardrobe and Certificate

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/web.

Build the Jewelry Wardrobe — the client's private digital archive of all owned pieces —
and the digital certificate experience. This is the emotional core of the platform.

apps/web/app/(private)/wardrobe/page.tsx — Jewelry Wardrobe

- "Your Wardrobe" header with client name
- Grid of owned pieces, each as a wardrobe card:
  - Piece image (full quality)
  - Design name and collection
  - <SerialBadge serial="..." />
  - Acquisition date and type (Purchased / Gift / Inherited)
  - "View Details" → /wardrobe/{pieceId}
- Sort: by acquisition date (default), by collection, by name
- Empty state: "Your wardrobe awaits your first acquisition"

apps/web/app/(private)/wardrobe/[pieceId]/page.tsx — Piece Ownership Detail

Layout: two-column (image left, details right) on desktop; stacked on mobile

Left:
- Large high-resolution piece image
- Thumbnail gallery

Right:
- Design name + collection (Cormorant Garamond heading)
- <SerialBadge />
- Specification table (material, weight, stone, cut, etc.)
- "Your Piece" ownership confirmation badge

Below the fold:
- CERTIFICATE SECTION:
  - "Certificate of Authenticity" heading
  - Certificate number + issue date
  - "View Certificate" button → opens <CertificateModal />
  - "Download Certificate (PDF)" button → triggers download from /client/wardrobe/{pieceId}/certificate/download

- OWNERSHIP TIMELINE:
  - Visual timeline of ownership events (dates + acquisition types)
  - Never show previous owner names — only dates and event types

- TRANSFER SECTION:
  - If no active transfer: "Initiate Transfer" button → /transfers/initiate?pieceId={id}
  - If transfer is in progress: show current status with elegant status indicator

<CertificateModal /> — Luxury in-browser certificate view:
- Dark overlay modal, full certificate layout rendered in browser
- Mirrors the PDF: piece image, all fields, serial, certificate number, QR code
- Animated entrance (fade + scale)
- "Download PDF" button inside modal
- "Close" (minimal X button)

apps/web/app/(private)/saved/page.tsx — Saved Pieces

- Grid of saved designs (similar to wardrobe but shows AVAILABLE pieces only)
- Each card: piece image, name, price, "Remove from Saved" button
- "Add to Cart" if still available

apps/web/app/(private)/verify/page.tsx — Serial Verification

- Simple centered page: "Verify Authenticity"
- Serial number input field
- "Verify" button → GET /verify?serial={input}
- Result (if found):
  - "Authenticated" badge in gold
  - Piece name, collection, certificate issue date
  - QR token validation confirmation
  - NEVER show owner information
- Result (if not found):
  - "Serial number not found in DADAN records"

Deliver:
- All page files above
- <CertificateModal /> component in packages/ui/
- Loading and error states for all pages
- Mobile-responsive layouts
- RTL support throughout (Arabic labels and text)
```

---

# PROMPT 12 — Next.js Web App: Ownership Transfer Flow (Client Side)

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/web.

Build the client-facing ownership transfer initiation and confirmation flows.
Transfer is a high-gravity, irreversible action. The UI must communicate that weight clearly.

apps/web/app/(private)/transfers/initiate/page.tsx — Initiate Transfer

This page is reached from /wardrobe/{pieceId} "Initiate Transfer" button.
pieceId is a query param.

Step 1 — Piece Confirmation:
- Show piece image, name, serial number prominently
- Text: "You are initiating a transfer of ownership for this piece."
- Select transfer type: Sale / Gift / Inheritance (styled as luxury choice cards)
- "Continue" button

Step 2 — Identify Recipient:
- Input: "Recipient's House Key"
- Label (Arabic): "مفتاح المستلم"
- On blur/submit: API call to validate House Key and return recipient display name
  (the server returns first name only for privacy)
- Show recipient confirmation: "You are transferring to: {First Name}"
- Important notice: "The recipient must confirm acceptance. This transfer requires DADAN approval."
- "Initiate Transfer" button with confirmation dialog: "Are you certain you wish to proceed?"

Step 3 — Confirmation:
- Transfer initiated successfully
- Transfer reference number
- "You will receive confirmation when the recipient responds."
- Next step guidance shown

apps/web/app/(private)/transfers/page.tsx — Transfer Status List

- All active and historical transfers (as sender or recipient)
- Each item: piece image, serial, transfer type, other party (first name only), status pill, date
- Status pills: luxury styled (INITIATED, AWAITING RECIPIENT, UNDER DADAN REVIEW, APPROVED, REJECTED)

apps/web/app/(private)/transfers/[transferId]/page.tsx — Transfer Detail + Confirm

For RECIPIENT (when status is SENDER_CONFIRMED):
- "You have received a transfer request"
- Piece image, name, serial, collection specs
- Sender: first name only
- Transfer type
- "Accept Transfer" button → POST /client/transfers/:id/confirm-recipient
- "Decline" button (with confirmation)

For SENDER (when status is INITIATED):
- "Awaiting your confirmation"
- POST /client/transfers/:id/confirm-sender
- "Cancel Transfer" button

For both (when DADAN_REVIEW or later):
- Status display only
- "DADAN is reviewing this transfer. You will be notified of their decision."
- Timeline of events so far

All transfer pages must:
- Prominently show the piece image and serial number at all times
- Never auto-submit — always require deliberate user action
- Use strong, clear language about the irreversibility

Deliver:
- All transfer page files
- Reusable <TransferStatusTimeline /> component
- Loading and error states
- E2E test: sender initiates → recipient confirms → page shows DADAN_REVIEW
```

---

# PROMPT 13 — Next.js Admin Dashboard

```
You are working on DADAN Dijital at {{REPO_ROOT}}/apps/admin.

Build the DADAN internal admin dashboard. This is used by DADAN staff to manage the
entire platform: clients, pieces, transfers, certificates, and system oversight.

This is a separate Next.js app. Admin users authenticate with email + password (not House Key).
Route protection via AdminGuard middleware. SUPER_ADMIN sees everything; STAFF sees most things;
VIEWER sees read-only.

Use the shared packages/ui/ components but with a slightly lighter admin theme:
- Background: #F8F6F2 (light ivory) or maintain dark theme — consistent with brand
- Recommend: dark sidebar + light main content area
- Data-dense layouts acceptable — this is a staff tool

Sidebar Navigation:
- Dashboard (overview)
- Clients
- Collections & Designs
- Pieces & Serials
- Certificates
- Transfer Requests (badge showing DADAN_REVIEW count)
- Orders
- Verify Logs
- Audit Log
- Settings (SUPER_ADMIN only)

apps/admin/app/(admin)/dashboard/page.tsx — Overview
- Stats cards: Total clients, total pieces, active transfers pending review, total certificates issued
- Recent activity feed from AuditLog
- Transfer requests requiring action (quick list)

apps/admin/app/(admin)/clients/ — Client Management
- List: searchable, filterable by isActive/visibilityGroup
- Detail: full profile, owned pieces count, House Key prefix (4 chars only), visibility groups
- Create new client: form → auto-generates House Key → shows ONE TIME → copy button
- Edit: displayName, email, phone, locale, isActive, visibilityGroups
- Rotate House Key button (SUPER_ADMIN only) → shows new key ONE TIME

apps/admin/app/(admin)/pieces/ — Piece Registry
- List: serial, design, collection, owner, status, registered date
- Detail: full piece history, all certificates, all transfer requests
- Register new piece: select design → auto-generate serial → optionally assign to client
- Assign to client: select client → creates ownership record + generates certificate

apps/admin/app/(admin)/transfers/ — Transfer Queue
- Filter: ALL / DADAN_REVIEW (default) / APPROVED / REJECTED
- Each row: piece image + serial, sender name, recipient name, type, status, date
- Detail page: full transfer timeline, contact-sender / contact-recipient log buttons, approve/reject actions
- Approve: confirmation modal with required notes field
- Reject: confirmation modal with required reason field

apps/admin/app/(admin)/certificates/ — Certificate Registry
- List: certificate number, piece serial, owner name, issued date, isActive
- Detail: preview certificate data, link to PDF, link to piece
- Regenerate certificate (SUPER_ADMIN only)

apps/admin/app/(admin)/audit-log/ — Audit Trail
- Read-only, paginated, filterable by actorType/action/date range
- Shows: timestamp, actor (type + id), action, target, metadata
- Export to CSV button

Deliver:
- Full admin app with all pages above
- Role-based access control on each page/action
- Data tables with pagination, sorting, filtering
- Confirmation modals for all destructive/critical actions
- Print/export for certificate and transfer records
```

---

# PROMPT 14 — Testing, CI Hardening, and Deployment

```
You are working on DADAN Dijital at {{REPO_ROOT}}.

This is the final hardening and delivery prompt. Implement comprehensive testing,
CI pipeline, and deployment configuration.

TESTING REQUIREMENTS:

apps/api — NestJS Tests:
Target: 85%+ line coverage on business-critical paths

Must-have unit tests:
- AuthService: House Key validation (valid, invalid, rate limit, inactive client)
- SerialNumberService: uniqueness, immutability, format validation
- CertificateService: generation, archiving of previous cert, HMAC token
- TransferService: ALL state transitions (valid + invalid), transaction rollback on failure
- VisibilityService: group intersection logic, edge cases (empty groups, admin-only)
- OrderService: piece reservation, double-purchase prevention, cart expiry

Must-have integration tests (against real test PostgreSQL):
- Full purchase flow: add to cart → checkout → piece owned → certificate generated
- Full transfer flow: initiate → sender confirm → recipient confirm → admin approve → new cert
- House Key rotation: old key invalid, new key works
- Visibility: client A cannot access client B's restricted pieces

apps/web — Next.js Tests:
- Access gate: correct redirect logic
- Middleware: unauthenticated → redirect to /, authenticated → allow
- Wardrobe: owned pieces render correctly, non-owned pieces return 404
- Certificate download: correct Content-Disposition header
- Transfer initiate: multi-step form state

CI PIPELINE (.github/workflows/ci.yml):

Stages:
1. Lint (eslint + prettier check — all packages)
2. Type Check (tsc --noEmit — all apps and packages)
3. Unit Tests (jest — api + packages)
4. Integration Tests (jest with Docker postgres)
5. Web Tests (jest + testing-library — web + admin)
6. Build Check (turbo build — verifies all apps build)
7. Security Scan (npm audit --audit-level=high)

On main branch merge only:
8. Database Migration Check (prisma migrate deploy --dry-run)

DEPLOYMENT:

Docker:
- apps/api/Dockerfile (multi-stage: builder + production)
- apps/web/Dockerfile (multi-stage: builder + production)
- apps/admin/Dockerfile (multi-stage)
- docker-compose.prod.yml: api, web, nginx, postgres, redis

nginx/nginx.conf:
- Reverse proxy: / → web app, /api → NestJS API, /admin → admin app
- HTTPS redirect
- Security headers: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- Rate limiting at nginx level (backup to app-level rate limiting)

Environment validation:
- apps/api/src/config/env.validation.ts — zod schema validating all required env vars at startup
- App refuses to start if required env vars are missing

SECURITY HARDENING CHECKLIST (implement all):
- [ ] House Key never logged, never in error messages, never in URLs
- [ ] Client visibility: 404 (not 403) for unauthorized pieces — don't reveal existence
- [ ] Transfer confirmation requires re-authentication (ask for House Key again)
- [ ] Certificate PDFs served via signed S3 URLs (expire in 1 hour)
- [ ] Verification endpoint: no owner data ever, rate-limited at 20 req/min per IP
- [ ] Admin panel: separate auth domain, no cross-contamination with client JWTs
- [ ] All database queries use parameterized statements (Prisma handles this)
- [ ] File uploads (admin): validate MIME type + file size, scan for malicious content
- [ ] Serial numbers in URLs: validate format before DB query, return 404 on invalid format
- [ ] AuditLog is append-only (no update/delete routes or permissions)

Deliver:
- Complete test suites for all the above
- CI workflow file
- All Docker files
- nginx configuration
- Environment validation
- SECURITY.md documenting the security posture
- DEPLOYMENT.md: step-by-step production deployment guide
```

---

---

## Appendix A — Entity Relationship Summary

```
Client ──────────────── owns ─────────────────── Piece
Client ──────────────── saves ────────────────── Piece (SavedPiece)
Client ──────────────── places ───────────────── Order ─── OrderItem ─── Piece
Client ──────────────── initiates ────────────── TransferRequest (as sender)
Client ──────────────── receives ─────────────── TransferRequest (as recipient)

Collection ──────────── contains ─────────────── Design
Design ──────────────── instantiates ──────────── Piece
Design ──────────────── has many ──────────────── DesignSpecification

Piece ───────────────── has many (append-only) ── OwnershipRecord
Piece ───────────────── has many ──────────────── Certificate (one isActive at a time)
Piece ───────────────── has many ──────────────── VerificationLog
Piece ───────────────── has at most one ───────── active TransferRequest

Certificate ─────────── belongs to ──────────── OwnershipRecord (via certificateId)

AdminUser ───────────── reviews ──────────────── TransferRequest
```

---

## Appendix B — Serial Number Formats

| Entity             | Format                                   | Example                |
| ------------------ | ---------------------------------------- | ---------------------- |
| Piece Serial       | `DADAN-{YYYY}-{COL}-{SEQ6}`              | `DADAN-2025-NR-000047` |
| Certificate Number | `CERT-{YYYY}-{HEX8}`                     | `CERT-2025-A3F1C09B`   |
| House Key          | `{16 hex chars}` (generated, shown once) | `a3f1c09b2e4d7f1a`     |
| Transfer ID        | UUID v4                                  | standard UUID          |
| Order ID           | UUID v4                                  | standard UUID          |

---

## Appendix C — Transfer Status Machine

```
INITIATED
    │
    ▼ (sender confirms)
SENDER_CONFIRMED
    │
    ▼ (recipient confirms)
RECIPIENT_CONFIRMED → DADAN_REVIEW
                            │
                  ┌─────────┴──────────┐
                  ▼                    ▼
              APPROVED             REJECTED

Any state before DADAN_REVIEW → CANCELLED (by sender)
```

---

## Appendix D — Certificate PDF Layout

```
┌─────────────────────────────────────────────┐
│  [DADAN DIJITAL LOGO / WORDMARK]            │
│  ─────────────── ◆ ───────────────          │
│                                             │
│         [PIECE PRIMARY IMAGE]               │
│                                             │
│  ─────────────── ◆ ───────────────          │
│  CERTIFICATE OF AUTHENTICITY               │
│  شهادة أصالة                               │
│  ─────────────────────────────             │
│  Piece:        {design name}               │
│  Collection:   {collection name}           │
│  Serial:       DADAN-2025-NR-000047        │
│  Material:     {material}                  │
│  Weight:       {weight}g                   │
│  Owner:        {displayName}               │
│  Issued:       {date}                      │
│  Certificate:  CERT-2025-A3F1C09B         │
│  ─────────────────────────────             │
│                         [QR CODE]          │
│  DADAN DIJITAL — AUTHENTICATED             │
└─────────────────────────────────────────────┘
(Watermark: "DADAN DIJITAL" diagonal, 30% opacity)
```

---

## Appendix E — Acceptance Criteria Checklist

Before any phase is marked complete, verify every item:

**Phase 1 (P0+P1):**

- [ ] Entering an invalid House Key returns 401 with no detail about the reason
- [ ] Entering different valid House Keys opens different curated experiences
- [ ] Client display name appears in the header on every authenticated page
- [ ] A piece not in the client's visibility groups returns 404 (not 403)
- [ ] Direct purchase completes and piece appears in Wardrobe
- [ ] Certificate PDF downloads with correct piece and owner data
- [ ] Serial verification returns piece info but NEVER owner identity
- [ ] Admin can create a client and generate a House Key (shown once)

**Phase 2 (Transfer):**

- [ ] Transfer cannot complete unless: sender confirms AND recipient confirms AND DADAN approves
- [ ] Piece remains OWNED (not transferred) until DADAN explicitly approves
- [ ] New certificate is issued to new owner immediately upon approval
- [ ] Previous certificate is archived (isActive: false), not deleted
- [ ] Ownership history is append-only — no records modified or deleted
- [ ] AuditLog has an entry for every state change in the transfer workflow

---

_End of DADAN Dijital Claude Code Prompt Guide_
_15 prompts (00–14) covering: Bootstrap → Schema → Auth → Clients/Visibility → Pieces/Wardrobe → Cart/Checkout → Certificates → Transfer → Web UI (6 prompts) → Admin → Testing/Deployment_
