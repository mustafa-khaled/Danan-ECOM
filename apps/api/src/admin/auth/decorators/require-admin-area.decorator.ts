import { SetMetadata } from "@nestjs/common";
import type { AdminArea } from "../admin-permissions";

export const ADMIN_AREA_KEY = "adminArea";

/**
 * Declares which admin-console area a controller (or single handler) serves, so
 * `AdminGuard` can enforce the role matrix in `admin-permissions.ts`. Combine
 * with `@Roles()` when a specific handler needs to be narrower still.
 */
export const RequireAdminArea = (area: AdminArea) =>
  SetMetadata(ADMIN_AREA_KEY, area);
