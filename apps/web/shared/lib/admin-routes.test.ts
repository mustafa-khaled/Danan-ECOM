import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the bug class behind the review finding "Admin Edit/View actions result
 * in 404": the collection access menu linked to `/admin/clients/:id` while the
 * pages live at `/admin/members/:id`. Nothing failed at build time because a
 * `Link` href is just a string.
 *
 * Every `/admin/...` link in the source must resolve to a real App Router page.
 */

/** Vitest runs with the web app as its root. */
const WEB_ROOT = process.cwd();
const ADMIN_APP_DIR = join(WEB_ROOT, "app", "admin");
const SOURCE_DIRS = ["app/admin", "features/admin", "components/admin"];

const PARAM = ":param";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** `app/admin/(dashboard)/members/[id]/edit/page.tsx` -> `/admin/members/:param/edit` */
function toRoute(pageFile: string): string {
  const segments = relative(WEB_ROOT, pageFile)
    .split(sep)
    .slice(0, -1) // drop page.tsx
    .filter((segment) => segment !== "app")
    .filter((segment) => !segment.startsWith("(")) // route groups are not in the URL
    .map((segment) => (segment.startsWith("[") ? PARAM : segment));
  return `/${segments.join("/")}`;
}

/**
 * Reads one string/template literal starting at its opening quote, replacing each
 * `${...}` with a param marker. Tracks interpolation depth so a nested template —
 * `` `/admin/operations/${id}${kind ? `?kind=${kind}` : ""}` `` — does not
 * terminate the literal early.
 */
function readLiteral(source: string, openQuoteIndex: number): string {
  const quote = source[openQuoteIndex];
  let out = "";
  let depth = 0;

  for (let i = openQuoteIndex + 1; i < source.length; i++) {
    const char = source[i];

    if (depth === 0) {
      if (char === quote) return out;
      if (char === "$" && source[i + 1] === "{") {
        out += PARAM;
        depth = 1;
        i += 1;
        continue;
      }
      out += char;
      continue;
    }

    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
  }
  return out;
}

/** Drops the query/hash and any trailing slash so hrefs compare as routes. */
function toComparableHref(href: string): string {
  return (
    href
      .replace(/[?#].*$/, "")
      // Adjacent interpolations are one dynamic segment. `${id}${kind ? ... : ""}`
      // is a single `[id]` plus an optional query string.
      .replace(new RegExp(`(?:${PARAM})+`, "g"), PARAM)
      .replace(/\/$/, "")
  );
}

function collectAdminHrefs(): { file: string; href: string }[] {
  // Matches href="/admin/x", href={`/admin/x`} and the `href: "/admin/x"` form
  // used by the sidebar nav config.
  const pattern = /href\s*[=:]\s*\{?\s*(?=[`"']\/admin\/)/g;

  return SOURCE_DIRS.flatMap((dir) =>
    walk(join(WEB_ROOT, dir))
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return [...source.matchAll(pattern)].map((match) => ({
          file: relative(WEB_ROOT, file),
          href: readLiteral(source, match.index + match[0].length),
        }));
      }),
  );
}

describe("admin route links", () => {
  const routes = new Set(
    walk(ADMIN_APP_DIR)
      .filter((file) => file.endsWith(`${sep}page.tsx`))
      .map(toRoute),
  );

  it("discovers the known admin pages", () => {
    // Sanity check on the walker: if this breaks, the assertion below is vacuous.
    expect(routes.has("/admin/members/:param/edit")).toBe(true);
    expect(routes.has("/admin/analytics")).toBe(true);
    expect(routes.has("/admin/clients")).toBe(false);
  });

  it("every /admin link points at an existing page", () => {
    const hrefs = collectAdminHrefs();
    expect(hrefs.length).toBeGreaterThan(0);

    const broken = hrefs
      .filter(({ href }) => !routes.has(toComparableHref(href)))
      .map(({ file, href }) => `${href}  (${file})`);

    expect(broken).toEqual([]);
  });
});
