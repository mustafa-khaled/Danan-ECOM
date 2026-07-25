export const CLIENT_COOKIE = "dadan_session";
export const ADMIN_COOKIE = "dadan_admin_session";
// i18n message key; translated by the global exception filter.
export const AUTH_FAILURE_MESSAGE = "errors.UNAUTHORIZED";
export const JWT_AUDIENCE_CLIENT = "dadan:client";
export const JWT_AUDIENCE_ADMIN = "dadan:admin";
// Client session length in days; configurable via CLIENT_SESSION_DAYS (default 7).
const CLIENT_SESSION_DAYS = parseInt(process.env.CLIENT_SESSION_DAYS ?? "7", 10);
export const SESSION_DURATION_SECONDS = CLIENT_SESSION_DAYS * 24 * 60 * 60;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

/** Redis key for the JWT deny-list (tokens revoked before their natural expiry). */
export function tokenDenyListKey(jti: string): string {
  return `auth:denylist:${jti}`;
}

export function getClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string {
  // req.ip already resolves X-Forwarded-For safely via Express "trust proxy"
  // (set in main.ts). Reading the header directly would be spoofable.
  return req.ip ?? "unknown";
}

export function cookieOptions(maxAgeMs: number) {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieSecure = process.env.COOKIE_SECURE;
  const secure = cookieSecure !== undefined 
    ? cookieSecure === "true" 
    : isProduction;
  return {
    httpOnly: true,
    secure,
    sameSite: (secure ? "strict" : "lax") as "strict" | "lax",
    maxAge: maxAgeMs,
    path: "/",
  };
}

export function paginationParams(page?: number, limit?: number) {
  const p = Math.max(1, page ?? 1);
  const l = Math.min(100, Math.max(1, limit ?? 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
