# AGENTS.md

## Project Summary

### Objective
Refactor frontend from flat-by-type structure to feature-based (modular monolith) architecture with TanStack React Query, typed request layer, and proper separation of concerns.

### Architecture
```
features/{domain}/  →  api/ + hooks/ + types/ + index.ts
shared/             →  lib/ + providers/ + components/ + types/ + utils/
```

### Status: COMPLETE

All four phases are done:
- Phase 1: Shared infrastructure (send-request, query-keys, QueryProvider, types, common components, providers)
- Phase 2: Feature API + hooks (11 features: auth, collections, pieces, wardrobe, cart, checkout, orders, transfers, saved, certificates, verify, admin)
- Phase 3: Page migration — all 20 server pages use feature API imports, all 8 client components use TanStack Query hooks
- Phase 4: Removed legacy lib/api/, lib/session/, lib/nav.ts, lib/client-context.tsx — no old API code remains

### Build Command
npx tsc --noEmit

### Key Conventions
- Server components prefetch via feature API calls + HydrationBoundary
- Client components use useQuery/useMutation from @tanstack/react-query
- Mutations call queryClient.invalidateQueries() instead of router.refresh()
- API layer uses sendRequest() from shared/lib/send-request
- Query keys use factory pattern from shared/lib/query-keys
- Each feature exports everything from index.ts barrel
- Server-only session logic in features/auth/server/
- Nav items config in shared/lib/nav
- Client context in shared/providers/client-context
