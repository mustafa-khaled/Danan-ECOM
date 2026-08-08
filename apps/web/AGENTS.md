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
- Phase 2: Feature API + hooks (12 features: auth, collections, pieces, wardrobe, cart, checkout, orders, transfers, saved, profile, certificates, verify, admin)
- Phase 3: Page migration — all server pages use feature API imports; interactive client components use TanStack Query mutation hooks
- Phase 4: Removed legacy lib/api/, lib/session/, lib/nav.ts, lib/client-context.tsx — no old API code remains

### Build Command
npx tsc --noEmit

### Key Conventions
- Server components fetch reads directly via feature `fetch*` API functions (no client-side read hooks/hydration — that pattern was tried and removed as dead code; keep reads server-side)
- Client components use `useMutation` hooks from each feature for writes (add-to-cart, save/unsave, checkout, transfers, admin actions, etc.)
- Mutations call queryClient.invalidateQueries() instead of router.refresh()
- API layer uses sendRequest() from shared/lib/send-request
- Query keys use factory pattern from shared/lib/query-keys (used by mutations for cache invalidation)
- Each feature exports everything it actually uses from index.ts barrel — don't export dead/unused symbols
- Server-only session logic in features/auth/server/
- Nav items config in shared/lib/nav
- Client context in shared/providers/client-context
