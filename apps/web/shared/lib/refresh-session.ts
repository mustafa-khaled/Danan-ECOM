import { getApiBase } from "./constants";
import {
  ADMIN_COOKIE,
  ADMIN_REFRESH_COOKIE,
  ADMIN_REFRESH_PATH,
  CLIENT_COOKIE,
  CLIENT_REFRESH_COOKIE,
  CLIENT_REFRESH_PATH,
  parseCookieHeader,
} from "./auth-cookies";

type RefreshAudience = "client" | "admin";

export interface RefreshResult {
  ok: boolean;
  cookieHeader?: string;
}

const refreshPromises: Partial<Record<RefreshAudience, Promise<RefreshResult>>> = {};

const REFRESH_BROADCAST_CHANNEL = "dadan-auth-refresh";

function getRefreshPath(audience: RefreshAudience): string {
  return audience === "admin" ? ADMIN_REFRESH_PATH : CLIENT_REFRESH_PATH;
}

function getCookieNames(audience: RefreshAudience): {
  access: string;
  refresh: string;
} {
  return audience === "admin"
    ? { access: ADMIN_COOKIE, refresh: ADMIN_REFRESH_COOKIE }
    : { access: CLIENT_COOKIE, refresh: CLIENT_REFRESH_COOKIE };
}

function buildCookieHeaderFromMap(
  map: Map<string, string>,
  audience: RefreshAudience,
): string {
  const { access, refresh } = getCookieNames(audience);
  const parts: string[] = [];
  const accessValue = map.get(access);
  const refreshValue = map.get(refresh);
  if (accessValue) parts.push(`${access}=${accessValue}`);
  if (refreshValue) parts.push(`${refresh}=${refreshValue}`);
  return parts.join("; ");
}

function mergeSetCookies(
  cookieHeader: string,
  setCookies: string[],
  audience: RefreshAudience,
): string {
  const map = parseCookieHeader(cookieHeader);
  const { access, refresh } = getCookieNames(audience);

  for (const setCookie of setCookies) {
    const pair = setCookie.split(";")[0];
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name === access || name === refresh) {
      map.set(name, value);
    }
  }

  return buildCookieHeaderFromMap(map, audience);
}

async function withCrossTabLock<T>(
  audience: RefreshAudience,
  fn: () => Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request(`dadan-refresh-${audience}`, fn);
  }

  return fn();
}

function notifyPeerRefreshComplete(audience: RefreshAudience): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(REFRESH_BROADCAST_CHANNEL);
  channel.postMessage({ audience });
  channel.close();
}

async function refreshSession(
  audience: RefreshAudience,
  cookieHeader?: string,
): Promise<RefreshResult> {
  const response = await fetch(`${getApiBase()}${getRefreshPath(audience)}`, {
    method: "POST",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    credentials: cookieHeader ? undefined : "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false };
  }

  notifyPeerRefreshComplete(audience);

  if (cookieHeader && typeof response.headers.getSetCookie === "function") {
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
      return {
        ok: true,
        cookieHeader: mergeSetCookies(cookieHeader, setCookies, audience),
      };
    }
  }

  return { ok: true };
}

function runSingleFlightRefresh(
  audience: RefreshAudience,
  cookieHeader?: string,
): Promise<RefreshResult> {
  if (!refreshPromises[audience]) {
    refreshPromises[audience] = refreshSession(audience, cookieHeader).finally(() => {
      refreshPromises[audience] = undefined;
    });
  }
  return refreshPromises[audience]!;
}

export function refreshClientSession(cookieHeader?: string): Promise<RefreshResult> {
  return withCrossTabLock("client", () => runSingleFlightRefresh("client", cookieHeader));
}

export function refreshAdminSession(cookieHeader?: string): Promise<RefreshResult> {
  return withCrossTabLock("admin", () => runSingleFlightRefresh("admin", cookieHeader));
}

export function isRefreshPath(url: string): boolean {
  return url.includes(CLIENT_REFRESH_PATH) || url.includes(ADMIN_REFRESH_PATH);
}

export function isAuthLoginPath(url: string): boolean {
  return (
    url.includes("/auth/validate-key") ||
    url.includes("/admin/auth/login") ||
    url.includes("/auth/logout") ||
    url.includes("/admin/auth/logout") ||
    url.includes("/auth/logout-all") ||
    url.includes("/admin/auth/logout-all")
  );
}

export function getRefreshAudienceFromPath(url: string): RefreshAudience {
  return url.includes("/admin/") ? "admin" : "client";
}

export function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, bufferSeconds = 60): boolean {
  const exp = decodeJwtExpiry(token);
  if (!exp) return true;
  return exp * 1000 <= Date.now() + bufferSeconds * 1000;
}
