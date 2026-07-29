export const CLIENT_COOKIE = "dadan_session";
export const CLIENT_REFRESH_COOKIE = "dadan_refresh";
export const ADMIN_COOKIE = "dadan_admin_session";
export const ADMIN_REFRESH_COOKIE = "dadan_admin_refresh";
// i18n message key; translated by the global exception filter.
export const AUTH_FAILURE_MESSAGE = "errors.UNAUTHORIZED";
export const JWT_AUDIENCE_CLIENT = "dadan:client";
export const JWT_AUDIENCE_ADMIN = "dadan:admin";
// Client session length in days; configurable via CLIENT_SESSION_DAYS (default 7).
const CLIENT_SESSION_DAYS = parseInt(process.env.CLIENT_SESSION_DAYS ?? "7", 10);
export const SESSION_DURATION_SECONDS = CLIENT_SESSION_DAYS * 24 * 60 * 60;

export function getAccessTokenSeconds(): number {
  const minutes = parseInt(process.env.ACCESS_TOKEN_MINUTES ?? "15", 10);
  return minutes * 60;
}

export function getAdminRefreshSeconds(): number {
  const hours = parseInt(process.env.ADMIN_REFRESH_HOURS ?? "24", 10);
  return hours * 60 * 60;
}
export const RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "5", 10);
export const RATE_LIMIT_WINDOW_SECONDS = parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ?? String(15 * 60),
  10,
);

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

/** Options for clearCookie — must match attributes used when setting cookies. */
export function clearCookieOptions() {
  const { secure, sameSite, path } = cookieOptions(0);
  return { secure, sameSite, path };
}

export function paginationParams(page?: number, limit?: number) {
  const p = Math.max(1, page ?? 1);
  const l = Math.min(100, Math.max(1, limit ?? 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
