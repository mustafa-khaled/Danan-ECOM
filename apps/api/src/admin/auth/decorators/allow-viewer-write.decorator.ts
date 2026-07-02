import { SetMetadata } from "@nestjs/common";

export const ALLOW_VIEWER_WRITE_KEY = "allowViewerWrite";

/**
 * Exempts a mutating endpoint from the global "VIEWER is read-only" rule
 * (e.g. logout, which any authenticated admin must be able to call).
 */
export const AllowViewerWrite = () => SetMetadata(ALLOW_VIEWER_WRITE_KEY, true);
