export type AdminRole = "SUPER_ADMIN" | "STAFF" | "VIEWER";

export interface AdminNavItem {
  href: string;
  label: string;
  roles: AdminRole[];
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    roles: ["SUPER_ADMIN", "STAFF", "VIEWER"],
  },
  {
    href: "/admin/collections",
    label: "Collections",
    roles: ["SUPER_ADMIN", "STAFF"],
  },
  {
    href: "/admin/designs",
    label: "Designs",
    roles: ["SUPER_ADMIN", "STAFF"],
  },
  {
    href: "/admin/clients",
    label: "Clients",
    roles: ["SUPER_ADMIN", "STAFF", "VIEWER"],
  },
  {
    href: "/admin/pieces",
    label: "Pieces",
    roles: ["SUPER_ADMIN", "STAFF", "VIEWER"],
  },
  {
    href: "/admin/certificates",
    label: "Certificates",
    roles: ["SUPER_ADMIN", "STAFF", "VIEWER"],
  },
  {
    href: "/admin/orders",
    label: "Orders",
    roles: ["SUPER_ADMIN", "STAFF", "VIEWER"],
  },
  {
    href: "/admin/transfers",
    label: "Transfers",
    roles: ["SUPER_ADMIN", "STAFF"],
  },
  {
    href: "/admin/verification-logs",
    label: "Verification Logs",
    roles: ["SUPER_ADMIN", "STAFF"],
  },
];

export function getAdminNavItems(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
