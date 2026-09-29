export type AdminRole =
  | "SUPER_ADMIN"
  | "STAFF"
  | "CURATOR"
  | "OPERATIONS"
  | "VIEWER";

export interface AdminNavItem {
  href: string;
  label: string;
  roles: AdminRole[];
}

/**
 * The authority on which roles may see which admin section.
 *
 * `navigation-area.tsx` filters its rows through this list and `AdminAccessGuard`
 * uses it to decide whether to render a page. A section missing from here is
 * treated as ungated, so `navigation-area.test.tsx` asserts every sidebar row
 * appears below.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/overview",
    label: "Overview",
    roles: ["SUPER_ADMIN", "STAFF", "CURATOR", "OPERATIONS", "VIEWER"],
  },
  {
    href: "/admin/collections",
    label: "Collections",
    roles: ["SUPER_ADMIN", "STAFF", "CURATOR"],
  },
  {
    href: "/admin/pieces",
    label: "Pieces",
    roles: ["SUPER_ADMIN", "STAFF", "CURATOR", "OPERATIONS", "VIEWER"],
  },
  {
    href: "/admin/members",
    label: "Members",
    roles: ["SUPER_ADMIN", "STAFF", "CURATOR", "OPERATIONS", "VIEWER"],
  },
  {
    href: "/admin/ownership",
    label: "Ownership",
    roles: ["SUPER_ADMIN", "STAFF", "OPERATIONS", "VIEWER"],
  },
  {
    href: "/admin/operations",
    label: "Operations",
    roles: ["SUPER_ADMIN", "STAFF", "OPERATIONS"],
  },
  {
    href: "/admin/payments",
    label: "Payments",
    roles: ["SUPER_ADMIN", "STAFF", "OPERATIONS", "VIEWER"],
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    roles: ["SUPER_ADMIN", "STAFF", "VIEWER"],
  },
  {
    href: "/admin/settings",
    label: "Settings",
    roles: ["SUPER_ADMIN"],
  },
];

export function getAdminNavItems(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * Longest-prefix match, so nested routes such as
 * `/admin/collections/<id>/access` inherit the Collections section's roles.
 */
export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * Whether the role may open an admin path. Paths outside the nav map are left
 * alone here — the API guards remain the authority, this only avoids showing a
 * page the role can never load.
 */
export function canAccessAdminPath(role: AdminRole, pathname: string): boolean {
  const item = findAdminNavItem(pathname);
  return item ? item.roles.includes(role) : true;
}

/** Route segments that exist only to create or change data. */
const WRITE_SEGMENTS = new Set(["new", "edit"]);

/**
 * Whether a path is a create/edit screen. A read-only role has no business
 * rendering one, so gating the route is simpler and more complete than hiding
 * each form's submit button.
 */
export function isAdminWritePath(pathname: string): boolean {
  return pathname.split("/").some((segment) => WRITE_SEGMENTS.has(segment));
}
