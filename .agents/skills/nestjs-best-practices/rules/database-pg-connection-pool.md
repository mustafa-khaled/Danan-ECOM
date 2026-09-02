# database-pg-connection-pool

Configure PostgreSQL connection pooling for NestJS + Prisma v7 using the PrismaPg driver adapter and PgBouncer.

## For AI Agents

1. Verify there is exactly **one** `DbContext` module providing `PrismaClient` via NestJS DI. If you see `new PrismaClient()` anywhere in a service, remove it and inject `DbContext` instead.
2. Ensure `DbContext` uses `PrismaPg` with an explicit `Pool` config — especially `connectionTimeoutMillis` (Prisma v7 default is 0, meaning no timeout).
3. Ensure `DATABASE_URL` points to PgBouncer and `DIRECT_DATABASE_URL` points directly to PostgreSQL (for migrations).
4. Check that `DbContext` implements `OnModuleInit` (calls `$connect()`) and `OnModuleDestroy` (calls `$disconnect()`).
5. If the project uses multiple Prisma clients (e.g. read replica), they must each have their own `Pool` with an appropriate `max` setting — but still instantiated once.

## Quick Reference Checklist

- [ ] Single `DbContext` class extending `PrismaClient` registered as `@Global()` provider
- [ ] `PrismaPg` adapter with explicit `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`
- [ ] `DATABASE_URL` → PgBouncer (session mode)
- [ ] `DIRECT_DATABASE_URL` → PostgreSQL direct (migrations only)
- [ ] `OnModuleInit` / `OnModuleDestroy` implemented
- [ ] Pool size ≤ `(pg max_connections - admin) / num_instances`

## ❌ WRONG vs ✅ CORRECT

### Multiple PrismaClient instances

```typescript
// ❌ src/users/users.service.ts — creates a new pool every injection
@Injectable()
export class UsersService {
  private prisma = new PrismaClient();
}

// ✅ Inject the single shared DbContext
@Injectable()
export class UsersService {
  constructor(private readonly db: DbContext) {}
}
```

### Missing connectionTimeoutMillis

```typescript
// ❌ No timeout — callers can hang forever under load
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ Explicit timeouts matching v6 behaviour
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 300_000,
});
```

### Migrations using the pooled URL

```bash
# ❌ PgBouncer in session mode may block DDL
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/mydb npx prisma migrate deploy

# ✅ Use the direct connection for migrations
DIRECT_DATABASE_URL=postgresql://user:pass@postgres:5432/mydb npx prisma migrate deploy
```

## Implementation Pattern

### `packages/db/src/db-context.ts`

```typescript
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Global,
} from "@nestjs/common";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Global()
@Injectable()
export class DbContext
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DbContext.name);

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_SIZE ?? "10"),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 300_000,
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connected");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }
}
```

### `packages/db/src/db.module.ts`

```typescript
import { Global, Module } from "@nestjs/common";
import { DbContext } from "./db-context";

@Global()
@Module({
  providers: [DbContext],
  exports: [DbContext],
})
export class DbModule {}
```

### `apps/api/src/app.module.ts`

```typescript
import { DbModule } from "@dadan/db";

@Module({
  imports: [
    DbModule, // once at root — @Global() propagates to all feature modules
    // ... feature modules
  ],
})
export class AppModule {}
```

### Environment variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:6432/mydb     # PgBouncer
DIRECT_DATABASE_URL=postgresql://user:pass@localhost:5432/mydb  # Direct
DB_POOL_SIZE=10   # Tune based on: (pg max_connections - 5) / num_instances
```

### `prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

## Installation

```bash
bun add @prisma/adapter-pg pg
bun add -d @types/pg
```

## Pool Sizing Guide

```
PostgreSQL max_connections = 100 (default)
Admin overhead             = 5
Available connections      = 95
App instances              = 3
Per-instance pool max      = floor(95 / 3) = 31

→ Set DB_POOL_SIZE=30 (leave 1 for headroom)
→ PgBouncer default_pool_size = 30
```

## PgBouncer Configuration (session mode)

```ini
[databases]
mydb = host=postgres port=5432 dbname=mydb

[pgbouncer]
pool_mode = session
default_pool_size = 30
max_client_conn = 200
query_wait_timeout = 10
server_idle_timeout = 300
log_connections = 0
log_disconnections = 0
```
