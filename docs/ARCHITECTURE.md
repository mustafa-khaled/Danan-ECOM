# DADAN Dijital — Architecture

> **Platform:** Closed, invitation-only luxury digital jewelry ownership house  
> **Stack:** Next.js 15 · NestJS · PostgreSQL · Prisma · Redis · pluggable Storage  
> **Last updated:** July 2026

---

## Overview

**DADAN Dijital** is a closed, invitation-only luxury jewelry ownership platform. Clients enter with a **House Key** (not public signup), browse a **curated catalog**, purchase one-of-a-kind pieces, manage a digital **wardrobe** with certificates, and transfer ownership through a multi-party approval workflow.

### Related documents

| Document                                                               | Purpose                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------ |
| [README.md](./README.md)                                               | Local setup and scripts                          |
| [DADAN_BUSINESS_LOGIC.md](./DADAN_BUSINESS_LOGIC.md)                   | Domain rules, state machines, security contracts |
| [packages/db/MODELS.md](./packages/db/MODELS.md)                       | Database relationship reference                  |
| [packages/db/prisma/schema.prisma](./packages/db/prisma/schema.prisma) | Schema source of truth                           |

---

## High-level system view

```mermaid
flowchart TB
  subgraph clients [Users]
    B[Browser]
  end

  subgraph edge [Edge - Production]
    NG[Nginx :80]
  end

  subgraph apps [Applications]
    WEB["Unified web app<br/>Next.js 15 :3000<br/>apps/web"]
    API["REST API<br/>NestJS :4000<br/>apps/api"]
  end

  subgraph shared [Shared packages]
    DB["@dadan/db<br/>Prisma"]
    TYPES["@dadan/types"]
    UTILS["@dadan/utils"]
    STORAGE["@dadan/storage"]
    CONFIG["@dadan/config"]
  end

  subgraph infra [Infrastructure]
    PG[(PostgreSQL 16)]
    RD[(Redis 7)]
    FS[(Local storage<br/>/app/uploads)]
  end

  B --> NG
  NG -->|"/ + /admin/*"| WEB
  NG -->|"/api/"| API

  WEB -->|"/backend/* rewrite"| API
  API --> DB
  API --> RD
  API --> FS

  WEB --> UI
  API --> UTILS
  API --> STORAGE
  WEB --> TYPES
  API --> TYPES
```

---

## Monorepo layout

Turborepo + pnpm workspaces orchestrate builds, dev, lint, test, and DB tasks.

```
apps/
  web/      Next.js 15 — client app + admin dashboard (/admin/*)
  api/      NestJS — REST API, business logic, auth

packages/
  db/       Prisma schema + generated client (shared)
  ui/       Shared React component library (luxury design tokens)
  types/    Shared TypeScript interfaces and enums
  utils/    Shared pure utilities (serial number, certificate, transfer logic)
  storage/  Local storage + pluggable providers (Strategy Pattern)
  config/   Shared ESLint, Prettier, TypeScript base configs
```

| Layer          | Path               | Role                                                                   |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| **Web app**    | `apps/web`         | Client routes + admin at `/admin/*` in one Next.js app                 |
| **API**        | `apps/api`         | NestJS REST API — all business logic, auth, state machines             |
| **Database**   | `packages/db`      | Prisma schema, migrations, generated client                            |
| **UI library** | `packages/ui`      | Shared luxury components (`PrivateLayout`, `AdminLayout`, etc.)        |
| **Types**      | `packages/types`   | Shared TS interfaces (sessions, shipping, API shapes)                  |
| **Utils**      | `packages/utils`   | Pure domain helpers (serial numbers, visibility, transfer transitions) |
| **Storage**    | `packages/storage` | Local / S3 upload, API URLs, key conventions (Strategy Pattern)        |
| **Config**     | `packages/config`  | Shared ESLint + TypeScript configs                                     |

---

## Frontend architecture (unified `apps/web`)

```mermaid
flowchart TD
  GATE["/ — Access gate<br/>House Key form"]
  PRIVATE["/(private)/* — Client routes"]
  ADMIN["/admin/* — Staff dashboard"]

  GATE -->|validate-key| PRIVATE

  subgraph private_routes [Client routes]
    HOME[/home]
    COLL[/collections]
    PIECE[/pieces/:slug]
    CART[/cart]
    WARD[/wardrobe]
    ORD[/orders]
    TRANS[/transfers]
  end

  subgraph admin_routes [Admin routes]
    LOGIN[/admin/login]
    DASH[/admin/overview]
    OPS[/admin/clients · pieces · orders · transfers]
  end

  PRIVATE --> private_routes
  ADMIN --> LOGIN
  ADMIN --> DASH
  ADMIN --> OPS
```

- **Client auth:** `(private)/layout.tsx` calls `requireClientSession()`; middleware gates non-`/` client paths on `dadan_session`.
- **Admin auth:** `admin/(dashboard)/layout.tsx` calls `requireAdminSession()`; middleware allows `/admin/*` without client cookie.
- **Sessions:** Separate cookies (`dadan_session` vs `dadan_admin_session`) — never merged.
- **API access:** Browser hits `/backend/*` → Next.js rewrite → NestJS (`apps/web/next.config.ts`).
- **Theming:** Client uses RTL Arabic dark theme; admin uses `data-theme="admin"` LTR shell.

---

## Storage (pluggable provider)

Storage uses a **Strategy Pattern**: a `StorageProvider` interface defines all operations, and the active provider is selected at startup via `STORAGE_PROVIDER` env.

### Current provider

- **LocalStorageProvider** — files stored on the VPS filesystem at `/app/uploads`.
- DB stores **object keys only** (`designs/{id}/{uuid}.jpg`); API resolves keys to URLs in read responses via `getSignedUrl()`.
- For local storage, URLs are API paths: `/api/uploads/{key}`.

| Field                      | Example key                            |
| -------------------------- | -------------------------------------- |
| `Certificate.pdfUrl`       | `certificates/{certificateId}.pdf`     |
| `Design.imageUrls[]`       | `designs/{designId}/{uuid}.jpg`        |
| `Collection.coverImageUrl` | `collections/{collectionId}/cover.jpg` |

Env vars: `STORAGE_PROVIDER=local`, `STORAGE_LOCAL_PATH=/app/uploads`.

### Future providers

The same interface supports `S3CompatibleProvider` (Cloudflare R2, AWS S3, Hetzner Object Storage) — swap the env vars, zero application code changes.

---

## Infrastructure

### Local dev (`docker-compose.yml`)

| Service    | Port | Purpose                 |
| ---------- | ---- | ----------------------- |
| PostgreSQL | 5433 | Primary database        |
| Redis      | 6379 | Rate limiting, sessions |

Apps run via `pnpm dev` (Turbo). R2 credentials required in `.env`.

| Service              | URL                               |
| -------------------- | --------------------------------- |
| Web (client + admin) | http://localhost:3000             |
| Admin login          | http://localhost:3000/admin/login |
| API                  | http://localhost:4000             |

### Production (`docker-compose.prod.yml`)

Containerized: **postgres, redis, api, web, nginx**. Storage is local (no external dependency).

| Path    | Target                    |
| ------- | ------------------------- |
| `/`     | web (client + `/admin/*`) |
| `/api/` | api (rate-limited)        |

---

## Security model

| Concern           | Implementation                                                      |
| ----------------- | ------------------------------------------------------------------- |
| Client auth       | House Key (bcrypt) + JWT in httpOnly cookie                         |
| Admin auth        | Email/password + separate JWT                                       |
| Session isolation | Client and admin tokens never cross                                 |
| Rate limiting     | Redis-backed on auth; nginx rate limits in prod                     |
| Visibility        | Group-based curation — clients only see allowed collections/designs |
| Audit             | Immutable `AuditLog` for significant mutations                      |
| CORS              | API allows `WEB_ORIGIN` / `BASE_URL` with credentials               |

---

## Dependency graph

```
apps/web ──┬── @dadan/types
           └── (rewrites to) apps/api

apps/api ──┬── @dadan/db (Prisma)
           ├── @dadan/types
           ├── @dadan/utils
           ├── @dadan/storage
           ├── PostgreSQL
           ├── Redis
           └── Local / S3 storage (via @dadan/storage)
```
