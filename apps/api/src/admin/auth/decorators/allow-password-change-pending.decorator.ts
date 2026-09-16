import { SetMetadata } from "@nestjs/common";

export const ALLOW_PASSWORD_CHANGE_PENDING_KEY = "allowPasswordChangePending";

/**
 * Exempts an endpoint from the `mustChangePassword` lockout so an admin with a
 * provisioned password can still rotate it (change-password) or walk away
 * (logout). Every other endpoint stays blocked until the rotation completes.
 */
export const AllowPasswordChangePending = () =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_PENDING_KEY, true);
