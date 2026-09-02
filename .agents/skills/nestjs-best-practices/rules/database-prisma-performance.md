# database-prisma-performance

Prisma v7 query optimization patterns for NestJS. Eliminates N+1 queries, prevents over-fetching, and ensures efficient pagination.

## For AI Agents

1. Check every `findMany()` call: does it have a `select` or `include`? If not, add `select` with only the fields the caller uses.
2. Look for any loop that calls a Prisma method — that is an N+1. Replace with `include` or a batched `in` query.
3. Check every `findMany()` used for pagination: does it use `cursor` + `skip`? If yes, replace with keyset pagination (see pattern below).
4. Check every `.count()` or `.findMany()` used for counting: replace with `this.db.model.count({ where })`.
5. When querying related data, add `relationLoadStrategy: 'join'` if no cursor is used.

## Quick Reference Checklist

- [ ] No in-loop Prisma calls (N+1)
- [ ] Every `findMany()` has explicit `select` or `include`
- [ ] Pagination on large tables uses keyset, not `cursor`+`skip`
- [ ] Aggregations use `.count()`, `.aggregate()`, `.groupBy()` — not fetch-all
- [ ] `relationLoadStrategy: 'join'` used where applicable

## ❌ WRONG vs ✅ CORRECT

### N+1

```typescript
// ❌ src/orders/orders.service.ts
const orders = await this.db.order.findMany();
for (const order of orders) {
  const items = await this.db.orderItem.findMany({
    where: { orderId: order.id },
  });
}

// ✅ src/orders/orders.service.ts
const orders = await this.db.order.findMany({
  include: { items: true },
});
```

### Over-fetching

```typescript
// ❌ Returns all columns including large blobs
const users = await this.db.user.findMany();

// ✅ Only the fields the endpoint actually returns
const users = await this.db.user.findMany({
  select: { id: true, email: true, name: true, createdAt: true },
});
```

### Cursor pagination bug (Prisma #27094)

```typescript
// ❌ May omit LIMIT clause — can OOM on large tables
const page = await this.db.product.findMany({
  cursor: { id: lastId },
  skip: 1,
  take: 20,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
});

// ✅ Keyset pagination with explicit where bounds
const page = await this.db.product.findMany({
  take: 20,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  where: {
    OR: [
      { createdAt: { lt: lastRow.createdAt } },
      { createdAt: { equals: lastRow.createdAt }, id: { lt: lastRow.id } },
    ],
  },
});
```

### Counting

```typescript
// ❌ Fetches all rows to count
const all = await this.db.order.findMany({ where: { status: "PENDING" } });
const count = all.length;

// ✅ COUNT(*) in the database
const count = await this.db.order.count({ where: { status: "PENDING" } });
```

### JOIN strategy

```typescript
// ❌ Two round trips
const posts = await this.db.post.findMany({ include: { author: true } });

// ✅ Single SQL query with LATERAL JOIN
const posts = await this.db.post.findMany({
  relationLoadStrategy: "join",
  include: { author: true },
});
// Note: do NOT add cursor: {} when using relationLoadStrategy: 'join'
```

## Security Considerations

- Always pass `where` clauses that are scoped to the authenticated user — never expose other users' data
- Never interpolate user input into raw SQL (`$queryRaw`); use parameterized queries
- Use `omit` in the Prisma schema to globally hide sensitive columns (e.g. `passwordHash`)

## Performance Considerations

- Add `@@index` in the Prisma schema for every field used in `where`, `orderBy`, or as a foreign key
- Run `EXPLAIN ANALYZE` on any query taking >50ms; look for `Seq Scan` on large tables
- Prefer `Promise.all([query1, query2])` for independent reads over sequential `await`
