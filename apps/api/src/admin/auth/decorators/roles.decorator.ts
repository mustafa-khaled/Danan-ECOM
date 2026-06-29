import { SetMetadata } from "@nestjs/common";
import type { AdminRole } from "@dadan/db";

export const ROLES_KEY = "roles";
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
