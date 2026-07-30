export const CLIENT_COOKIE = "dadan_session";
export const CLIENT_REFRESH_COOKIE = "dadan_refresh";
export const ADMIN_COOKIE = "dadan_admin_session";
export const ADMIN_REFRESH_COOKIE = "dadan_admin_refresh";

export const CLIENT_REFRESH_PATH = "/auth/refresh";
export const ADMIN_REFRESH_PATH = "/admin/auth/refresh";

export function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return map;
}
