export const CLIENT_COOKIE = "dadan_session";
export const ADMIN_COOKIE = "dadan_admin_session";
export const AUTH_FAILURE_MESSAGE = "Unauthorized";
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export function getClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.ip ?? "unknown";
}

export function cookieOptions(maxAgeMs: number) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    maxAge: maxAgeMs,
    path: "/",
  };
}

export function paginationParams(page?: number, limit?: number) {
  const p = Math.max(1, page ?? 1);
  const l = Math.min(100, Math.max(1, limit ?? 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
