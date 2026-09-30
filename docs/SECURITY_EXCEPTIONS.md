# Security exceptions register

CI fails on any HIGH or CRITICAL finding from `pnpm audit` or Trivy. An advisory
may only be suppressed by adding it here **and** to the matching ignore list:

| Scanner      | Ignore list                                      |
| ------------ | ------------------------------------------------ |
| `pnpm audit` | `pnpm.auditConfig.ignoreGhsas` in `package.json` |
| Trivy        | `.trivyignore.yaml`                              |

Every entry needs an owner, a reason the advisory does not affect us, and a
review date. Entries past their review date should be re-checked or removed —
an exception is a deferral, not a resolution.

---

## Active exceptions

None. Every HIGH/CRITICAL finding is resolved by upgrading the affected
dependency to a patched release.

### Resolved: GHSA-mh99-v99m-4gvg — brace-expansion denial of service

- **Advisory:** CVE-2026-14257, denial of service via unbounded brace expansion
- **Owner:** Platform
- **Added:** 2026-07-26
- **Resolved:** 2026-09-30

This exception was accepted on the premise that only `5.0.8` had been published
and that the 1.x line could not be patched — the 1.x CommonJS build exports the
module as a callable function, whereas `5.x` exports a named `expand`, so
substituting one for the other breaks `minimatch@3` at runtime.

That premise is no longer true. The 1.x line received backported fixes
(`1.1.19`, `1.1.20`), satisfying this exception's own exit condition, and
`1.1.21` keeps the original callable export shape. Both branches are now pinned
to patched releases via `pnpm.overrides` (`brace-expansion@1` at `^1.1.20`,
`brace-expansion@5` at `^5.0.11`), so the advisory no longer applies and the
suppression is no longer required.
