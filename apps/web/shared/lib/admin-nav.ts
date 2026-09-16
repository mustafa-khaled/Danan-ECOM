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
 * Admin navigation items that match the live sidebar in navigation-area.tsx.
 *
 * Used by tests and any programmatic nav logic. Keep in sync with
 * the `navLinks` / `directLinks` arrays in navigation-area.tsx.
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
