# DADAN — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Status:** Approved Reference  
> **Languages:** Arabic (ar) & English (en)

---

# 1. Project Overview

## Product Name

**DADAN – Private Digital Jewelry House**

## Description

This application is **not** a standard jewelry e-commerce store.

It is a **closed, invitation-only luxury digital jewelry house** created exclusively for DADAN clients.

Access is restricted through a permanent **House Key** assigned to each client.

Each client receives a personalized experience, including:

- Personalized welcome messages
- Client-specific product visibility
- Curated collections
- Personalized naming throughout the interface

The platform supports:

- Direct purchase
- Private Jewelry Wardrobe
- Digital ownership records
- Downloadable PDF certificates
- Serial number authenticity verification
- Controlled ownership transfer approved by DADAN

The entire application supports:

- Arabic (`ar`)
- English (`en`)

---

# 2. Product Vision

The platform must provide a luxury digital experience rather than a traditional online store.

## Vision

- Closed website only (no public browsing)
- Invitation-only experience
- Luxury private-client experience
- Blend of classic luxury with modern Saudi heritage
- Personalized client identity throughout the platform
- Direct purchase (not inquiry only)
- Every physical jewelry piece becomes a digital asset with:
  - Ownership records
  - Digital certificate
  - Complete traceability

---

# 3. Non-Negotiable Requirements

These requirements are mandatory.

1. Website must be completely private and accessible only using a valid House Key.
2. Every House Key is permanent.
3. Every House Key belongs to exactly one client.
4. Client name must appear throughout the experience.
5. Visible pages and products may differ between clients.
6. Direct purchase checkout is required.
7. Jewelry Wardrobe is required for owned and saved pieces.
8. Every registered piece requires a digital certificate (PDF).
9. Ownership transfer requires:
   - Current owner confirmation
   - Recipient confirmation
   - Direct DADAN communication with both parties
   - Final DADAN approval

---

# 4. Project Phases

## Phase 1

### Authentication

- Private Access Gate
- House Key entry
- Session handling after successful login

### Client Experience

- Personalized homepage
- Client-specific welcome
- Curated product visibility

### Commerce

- Product listing
- Product details
- Cart
- Checkout

### User Features

- Saved Pieces (Favorites)
- Jewelry Wardrobe
- Certificate viewing
- PDF download workflow
- Serial number verification

### Administration

Basic Admin Dashboard including:

- Clients
- Pieces
- Certificates
- Transfer Requests

---

## Phase 2

### Ownership Transfer System

- Ownership transfer request flow
- Transfer type selection:
  - Sale
  - Gift
  - Inheritance
- Recipient identification using House Key
- Current owner confirmation
- Recipient confirmation
- Direct DADAN communication with both parties
- Approve / Reject workflow
- Ownership history updates
- Certificate re-issuance

---

## Phase 3

### Advanced Features

- Audit logs
- Document uploads for inheritance cases
- Full certificate version history
- Operational reports and analytics
- Notification center
- Automated status messages

---

# 5. User Journey

1. Client receives House Key from DADAN.
2. Client opens the Private Access Gate.
3. Client enters the House Key.
4. System validates the key.
5. System opens the assigned private experience.
6. Client sees a personalized greeting and curated pieces.
7. Client can:
   - Browse products
   - Save products
   - Add products to cart
   - Purchase directly
8. Purchased pieces appear inside the Jewelry Wardrobe.
9. Client can:
   - Open certificate
   - Download certificate
   - Verify serial number
10. If ownership transfer is required:
    - Owner initiates transfer
    - Recipient confirms
    - DADAN communicates with both parties
    - DADAN approves or rejects

---

# 6. Required Screens & Modules

## Client

### Access Gate

- Private login page
- House Key input
- DADAN branding

### Client Home

- Personalized greeting
- Featured collections
- Curated sections

### Collection / Curated Grid

- Client-specific visible products

### Product Details

- Image gallery
- Story
- Specifications
- Serial number
- Price
- Purchase CTA

### Cart

- Selected products
- Order summary

### Checkout

- Billing
- Shipping
- Payment
- Order placement

### Saved Pieces

- Client favorites

### Jewelry Wardrobe

Owned pieces including:

- Piece information
- Serial number
- Specifications
- Certificate access

### Certificate View

- Luxury certificate display
- PDF export

### Verify Page

Authenticity verification by serial number.

Can be:

- Public
- Semi-public

Must **never** reveal owner identity.

### Transfer Request

Start ownership transfer from an owned piece.

### Transfer Review / Status

Track:

- Sender confirmation
- Recipient confirmation
- DADAN approval
- Current transfer status

---

## Admin Dashboard

Modules:

- Clients
- Pieces
- Certificates
- Transfer Queue
- Verification Logs

---

# 7. Core Data Model

Required entities:

- Clients
- Collections
- Designs
- Pieces
- Piece Specifications
- Ownership Records
- Transfer Requests
- Transfer Attachments
- Certificates
- Verification Logs
- Admin Users

---

# 8. Critical Business Rules

## House Keys

- Must be unique.
- Must be permanent.
- Must belong to exactly one client.

## Pieces

- Serial number must be unique.
- Serial number must never be reused.

## Ownership

- Ownership history is append-only.
- Existing ownership records must never be overwritten.

## Transfers

Transfers cannot complete automatically.

Required approval workflow:

1. Sender confirmation
2. Recipient confirmation
3. Direct DADAN communication with both parties
4. Final DADAN approval

## Certificates

- Certificate must be re-issued whenever ownership changes.
- Previous certificates must remain archived.

## Verification

- Never expose owner identity.
- Display piece image.
- Display serial number.

## Client Personalization

Admin must be able to configure:

- Product visibility
- Collection visibility
- Client-specific experience

## Auditing

Every important system action must be logged.

---

# 9. Technical Architecture

## Frontend

- Next.js

## Backend

- Node.js
- NestJS

## Database

- PostgreSQL

## Authentication

- Secure House Key validation
- Session or token handling

## Storage

- Secure media storage
- Secure certificate storage

## Payment

- Saudi-compatible payment gateway

## Administration

- Protected Admin Panel
- Role-Based Access Control (RBAC)

---

# 10. Digital Certificate Requirements

Certificates should match the luxury identity of DADAN.

Each certificate must include:

- Piece image
- Piece name
- Collection
- Serial number
- Material
- Weight
- Issue date
- Owner name
- Certificate number
- Verification reference or QR Code

Requirements:

- PDF generation
- PDF download
- Certificate archive
- Version history after ownership changes

---

# 11. Ownership Transfer Workflow

1. Owner opens an owned piece from Jewelry Wardrobe.
2. Owner selects transfer type:
   - Sale
   - Gift
   - Inheritance
3. Owner enters recipient House Key or selects recipient profile.
4. System displays:
   - Piece image
   - Piece information
   - Serial number
5. Current owner confirms intent.
6. Recipient confirms acceptance.
7. DADAN contacts both parties.
8. DADAN reviews the request.
9. DADAN approves or rejects.

If approved:

- Current ownership record is updated.
- Ownership history is appended.
- A new certificate is issued.
- Previous certificate is archived.
- Notifications are sent.

---

# 12. AI Implementation Rules (Source of Truth)

The following rules are mandatory and should always be respected during implementation.

## Personalization

- Every authenticated client has a personalized experience.
- Product visibility is client-specific.
- Collections are client-specific.
- Client name should appear throughout the interface.

## Security

- No public browsing.
- No public product listings.
- Website access requires a valid House Key.
- Owner identity must never be exposed during public verification.

## Ownership

- Every jewelry piece has exactly one current owner.
- Ownership history is immutable (append-only).
- Every ownership change generates a new ownership record.

## Certificates

- Every owned piece has a digital certificate.
- Certificates are versioned.
- Previous certificates remain archived.

## Transfers

Ownership transfers **must never** happen automatically.

Required approval chain:

1. Current owner confirmation
2. Recipient confirmation
3. Direct DADAN communication with both parties
4. Final DADAN approval

## Auditing

Every important action should be logged, including:

- Login
- House Key validation
- Purchases
- Certificate generation
- Certificate download
- Verification requests
- Transfer requests
- Transfer approvals
- Ownership changes
- Admin actions
