---
name: prisma-pg-performance
description: "Prisma v7 + PostgreSQL performance optimization for NestJS. Use when writing or reviewing database queries, setting up connection pooling, solving N+1 problems, implementing pagination, optimizing slow queries, or configuring PgBouncer. Trigger keywords: N+1, slow query, connection pool, pagination, findMany, include, select, PgBouncer, PrismaPg, cursor, keyset, index, transaction, aggregate, omit, query optimization."
license: MIT
metadata:
  author: xiro
  version: "1.0.0"
compatibility: "NestJS 11+, Prisma v7, PostgreSQL 15+, @prisma/adapter-pg, pg driver"
---

# Prisma v7 + PostgreSQL Performance

Production-ready patterns for high-performance database access in NestJS using Prisma v7 and PostgreSQL. All patterns are based on the official Prisma v7 documentation and 2026 best practices.

## Rules at a Glance

| #   | Rule                                                    | Impact   |
| --- | ------------------------------------------------------- | -------- |
| 1   | Single global `PrismaClient`                            | CRITICAL |
| 2   | `PrismaPg` driver adapter with explicit pool config     | HIGH     |
| 3   | PgBouncer session pooling at DB tier                    | HIGH     |
| 4   | Eliminate N+1 with `include`/`select`                   | CRITICAL |
| 5   | Use `relationLoadStrategy: "join"` for relation queries | HIGH     |
| 6   | Keyset pagination — avoid Prisma's built-in cursor      | HIGH     |
| 7   | Always `select` only needed fields                      | HIGH     |
| 8   | Aggregate on the database side                          | MEDIUM   |
| 9   | Enable query logging for slow query detection           | MEDIUM   |
| 10  | Use `$transaction` for batch writes                     | MEDIUM   |
| 11  | Define `@@index` in Prisma schema                       | HIGH     |
| 12  | Use `omit` for sensitive/large columns                  | MEDIUM   |

---

## 1. Single Global PrismaClient (CRITICAL)

**Never** create a `PrismaClient` inside a service or handler. One pool per process.

```typescript
// packages/db/src/db-context.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class DbContext
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DbContext.name);

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Match your PgBouncer default_pool_size
      idleTimeoutMillis: 300_000, // 5 min — matches Prisma v6 default
      connectionTimeoutMillis: 5_000, // 5 sec — matches Prisma v6 default
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "warn" },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Log slow queries (>500ms) in development
    if (process.env.NODE_ENV !== "production") {
      (this.$on as any)("query", (e: { duration: number; query: string }) => {
        if (e.duration > 500) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

❌ **WRONG** — creates a new pool per injection:

```typescript
// In a service constructor — NEVER DO THIS
this.prisma = new PrismaClient();
```

---

## 2. PrismaPg Driver Adapter — Pool Sizing

Size the pool from your PostgreSQL `max_connections`, budget across instances, and let PgBouncer absorb spikes. Formula: `pool_size = floor((max_connections - admin_overhead) / num_app_instances)`.

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE ?? "10"),
  idleTimeoutMillis: 300_000,
  connectionTimeoutMillis: 5_000,
  // Optional: enforce statement timeout at driver level
  // statement_timeout: 30_000,
});
```

**Prisma v7 pool defaults** (when using `PrismaPg`):

| Setting         | v6 default         | v7 `pg` field             | v7 default          |
| --------------- | ------------------ | ------------------------- | ------------------- |
| Pool size       | `num_cpus * 2 + 1` | `max`                     | `10`                |
| Acquire timeout | 10s                | `connectionTimeoutMillis` | **0 (no timeout!)** |
| Idle timeout    | 300s               | `idleTimeoutMillis`       | 10s                 |

Always set `connectionTimeoutMillis` explicitly — v7 default is 0 (no timeout), which means callers can hang forever.

---

## 3. PgBouncer Session Pooling

Run PgBouncer in **session mode** (safe for Prisma transactions). Use a separate `DIRECT_DATABASE_URL` for migrations.

```bash
# .env
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/mydb   # pooled (app)
DIRECT_DATABASE_URL=postgresql://user:pass@postgres:5432/mydb  # direct (migrations)
```

```ini
# pgbouncer.ini
[pgbouncer]
pool_mode = session
default_pool_size = 20          # ~2-5x CPU cores per DB node
max_client_conn = 200
query_wait_timeout = 10
```

```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

---

## 4. Eliminate N+1 (CRITICAL)

The N+1 problem: 1 query to fetch a list + 1 query per item = N+1 round trips.

❌ **WRONG** — N+1:

```typescript
const orders = await this.db.order.findMany();
for (const order of orders) {
  // 1 extra query per order
  const items = await this.db.orderItem.findMany({
    where: { orderId: order.id },
  });
}
```

✅ **CORRECT** — single query:

```typescript
const orders = await this.db.order.findMany({
  include: { items: true },
});
```

✅ **CORRECT** — batch with `in` filter (when you control the relation side):

```typescript
const orders = await this.db.order.findMany();
const orderIds = orders.map((o) => o.id);
const items = await this.db.orderItem.findMany({
  where: { orderId: { in: orderIds } },
});
```

---

## 5. `relationLoadStrategy: "join"` for Relation Queries

Use `join` to collapse related data into a single SQL query with `LATERAL JOIN`. Reduces round trips.

```typescript
const posts = await this.db.post.findMany({
  relationLoadStrategy: "join", // single SQL query
  include: { author: true, tags: true },
  where: { published: true },
  take: 20,
  orderBy: { createdAt: "desc" },
});
```

**Known limitation**: `relationLoadStrategy: "join"` does **not** support Prisma's built-in `cursor` field. If you add `cursor`, Prisma silently falls back to `query` strategy. Use keyset pagination (Rule 6) instead.

---

## 6. Keyset Pagination — Avoid Prisma's Built-in Cursor ⚠️

Prisma's built-in cursor has a known bug ([#27094](https://github.com/prisma/prisma/issues/27094)): when `cursor` + `skip` + `take` + `orderBy` are combined, Prisma may omit the `LIMIT` clause, causing the entire table to be fetched in-memory.

**Never** use this pattern for large tables:

```typescript
// ❌ WRONG — no LIMIT generated, can OOM on large tables
const page = await this.db.product.findMany({
  cursor: { id: lastId },
  skip: 1,
  take: 20,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
});
```

✅ **CORRECT** — keyset pagination with explicit `where`:

```typescript
// First page
const firstPage = await this.db.product.findMany({
  take: 20,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  where: {
    /* your filters */
  },
});

// Subsequent pages — use the last row's sort values as bounds
const nextPage = await this.db.product.findMany({
  take: 20,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  where: {
    AND: [
      {
        /* your filters */
      },
      {
        OR: [
          { createdAt: { lt: lastRow.createdAt } },
          { createdAt: { equals: lastRow.createdAt }, id: { lt: lastRow.id } },
        ],
      },
    ],
  },
});
```

Return `nextCursor: { createdAt: lastRow.createdAt, id: lastRow.id }` in the API response so the client can pass it back.

Use offset (`skip`/`take`) **only** for admin UIs with small datasets where jumping to arbitrary pages is required.

---

## 7. Always `select` Only Needed Fields

Never return columns you don't use. Large text, JSON blobs, and binary fields are expensive.

❌ **WRONG** — fetches all columns including large ones:

```typescript
const users = await this.db.user.findMany();
```

✅ **CORRECT** — only the fields you need:

```typescript
const users = await this.db.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    // avatar (blob), bio (text), metadata (json) — NOT included
  },
});
```

For fields that should _never_ appear in any query (e.g. `passwordHash`), use global `omit` in the Prisma schema:

```prisma
// schema.prisma
model User {
  id           String @id
  email        String
  passwordHash String @omit   // never returned unless explicitly selected
}
```

---

## 8. Aggregate on the Database Side

Never fetch all rows to count or aggregate in application memory.

❌ **WRONG**:

```typescript
const all = await this.db.order.findMany();
const total = all.length;
const revenue = all.reduce((sum, o) => sum + o.total, 0);
```

✅ **CORRECT**:

```typescript
const [total, revenueResult] = await this.db.$transaction([
  this.db.order.count({ where: { status: "COMPLETED" } }),
  this.db.order.aggregate({
    _sum: { total: true },
    where: { status: "COMPLETED" },
  }),
]);
const revenue = revenueResult._sum.total ?? 0;
```

---

## 9. Query Logging for Slow Query Detection

Enable structured query logging in development; send to your APM in production.

```typescript
// In DbContext constructor
super({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "warn" },
  ],
});

// In onModuleInit
(this.$on as any)(
  "query",
  (e: { query: string; params: string; duration: number }) => {
    if (e.duration > 200) {
      this.logger.warn({
        message: "Slow query",
        durationMs: e.duration,
        query: e.query,
      });
    }
  },
);
```

In production, forward slow queries to Datadog / New Relic via their Node.js APM agent instead of stdout.

---

## 10. `$transaction` for Batch Writes

Use interactive transactions for multi-step writes that must be atomic. Keep transactions short.

```typescript
// Sequential operations in one transaction
const result = await this.db.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.updateMany({
    where: { productId: { in: itemIds } },
    data: { reserved: { increment: 1 } },
  });
  await tx.auditLog.create({
    data: { action: "ORDER_CREATED", orderId: order.id },
  });
  return order;
});

// Batch reads (no transaction needed — use Promise.all)
const [users, products] = await Promise.all([
  this.db.user.findMany({
    where: { active: true },
    select: { id: true, email: true },
  }),
  this.db.product.findMany({
    where: { inStock: true },
    select: { id: true, price: true },
  }),
]);
```

Set a statement timeout on long-running transactions to protect p99:

```typescript
await this.db.$transaction(async (tx) => { ... }, {
  timeout: 10_000, // 10 seconds max
});
```

---

## 11. Define `@@index` in Prisma Schema

Every `where` filter field, foreign key, and `orderBy` field needs a database index.

```prisma
model Order {
  id         String   @id @default(cuid())
  userId     String
  status     OrderStatus
  createdAt  DateTime @default(now())
  total      Decimal

  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])                           // FK — always index
  @@index([status, createdAt(sort: Desc)])    // composite for list queries
  @@index([createdAt(sort: Desc), id(sort: Desc)])  // keyset pagination columns
}
```

Run `EXPLAIN ANALYZE` on any query that takes >50ms to verify index usage. If `Seq Scan` appears on a large table, add an index.

---

## 12. `omit` for Sensitive or Large Columns

Use Prisma's `omit` to globally exclude columns that should never leak.

```prisma
model User {
  id           String @id
  email        String
  passwordHash String @omit    // excluded from all queries by default
  refreshToken String? @omit   // excluded from all queries by default
  bio          String?         // large but not sensitive — omit per query if needed
}
```

To include an omitted field explicitly when needed:

```typescript
const user = await this.db.user.findUnique({
  where: { id },
  omit: { passwordHash: false }, // override the schema-level omit
});
```
