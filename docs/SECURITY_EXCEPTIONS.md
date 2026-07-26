# Security exceptions register

CI fails on any HIGH or CRITICAL finding from `pnpm audit` or Trivy. An advisory
may only be suppressed by adding it here **and** to the matching ignore list:

| Scanner      | Ignore list                                      |
| ------------ | ------------------------------------------------ |
| `pnpm audit` | `pnpm.auditConfig.ignoreGhsas` in `package.json` |
| Trivy        | `.trivyignore`                                   |

Every entry needs an owner, a reason the advisory does not affect us, and a
review date. Entries past their review date should be re-checked or removed —
an exception is a deferral, not a resolution.

---

## Active exceptions

### GHSA-mh99-v99m-4gvg — brace-expansion denial of service

- **Advisory:** CVE-2026-14257, denial of service via unbounded brace expansion
- **Owner:** Platform
- **Added:** 2026-07-26
- **Review before:** 2026-10-01

**Why it is accepted.** The advisory range is `<=5.0.7`, which sweeps in the
entire 1.x line, but the only published patch is `5.0.8`. That release cannot be
substituted for 1.x consumers: its CommonJS build exports a named `expand`,
while `minimatch@3` calls the module itself as a function, so forcing the
override breaks ESLint at runtime.

Every runtime dependency path already resolves `brace-expansion@5.0.8` (pinned
via `pnpm.overrides`). The remaining `1.1.16` copies are reachable only through
ESLint's own `minimatch@3`, which expands glob patterns that come from our lint
configuration — never from user input or request data. The affected code does
not ship in either Docker image.

**Exit condition.** Drop this exception once ESLint's dependency tree moves off
`minimatch@3`, or once the 1.x line receives a backported patch.
