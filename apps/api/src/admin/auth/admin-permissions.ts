import { AdminRole } from "@dadan/db";

/**
 * Functional areas of the admin console. Each admin controller declares the
 * area it belongs to with `@RequireAdminArea()` and `AdminGuard` resolves the
 * roles allowed to reach it from the matrix below.
 *
 * This exists because `CURATOR` and `OPERATIONS` used to be indistinguishable
 * from `STAFF` on the API: the sidebar hid the sections they shouldn't see
 * (`apps/web/shared/lib/admin-nav.ts`) but nothing stopped them calling those
 * endpoints directly. The matrix mirrors that sidebar and is the server-side
 * source of truth — keep the two in sync.
 */
export enum AdminArea {
  OVERVIEW = "overview",
  ANALYTICS = "analytics",
  COLLECTIONS = "collections",
  PIECES = "pieces",
  MEMBERS = "members",
  OWNERSHIP = "ownership",
  OPERATIONS = "operations",
  PAYMENTS = "payments",
  SETTINGS = "settings",
}

const ALL_ROLES = [
  AdminRole.SUPER_ADMIN,
  AdminRole.STAFF,
  AdminRole.CURATOR,
  AdminRole.OPERATIONS,
  AdminRole.VIEWER,
] as const;

export const ADMIN_AREA_ROLES: Record<AdminArea, readonly AdminRole[]> = {
  [AdminArea.OVERVIEW]: ALL_ROLES,
  [AdminArea.ANALYTICS]: [
    AdminRole.SUPER_ADMIN,
    AdminRole.STAFF,
    AdminRole.VIEWER,
  ],
  [AdminArea.COLLECTIONS]: [
    AdminRole.SUPER_ADMIN,
    AdminRole.STAFF,
    AdminRole.CURATOR,
  ],
  [AdminArea.PIECES]: ALL_ROLES,
  [AdminArea.MEMBERS]: ALL_ROLES,
  [AdminArea.OWNERSHIP]: [
    AdminRole.SUPER_ADMIN,
    AdminRole.STAFF,
    AdminRole.OPERATIONS,
    AdminRole.VIEWER,
  ],
  [AdminArea.OPERATIONS]: [
    AdminRole.SUPER_ADMIN,
    AdminRole.STAFF,
    AdminRole.OPERATIONS,
  ],
  [AdminArea.PAYMENTS]: [
    AdminRole.SUPER_ADMIN,
    AdminRole.STAFF,
    AdminRole.OPERATIONS,
    AdminRole.VIEWER,
  ],
  [AdminArea.SETTINGS]: [AdminRole.SUPER_ADMIN],
};

export function canAccessArea(role: AdminRole, area: AdminArea): boolean {
  return ADMIN_AREA_ROLES[area].includes(role);
}
