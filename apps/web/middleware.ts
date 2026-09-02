import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_REFRESH_COOKIE,
  CLIENT_COOKIE,
  CLIENT_REFRESH_COOKIE,
  parseCookieHeader,
} from "./shared/lib/auth-cookies";
import { buildCsp, createCspNonce, sentryConnectSrc } from "./shared/lib/csp";
import { isAccessTokenExpired } from "./shared/lib/refresh-session";

const PUBLIC_PATHS = ["/", "/beta"];

const API_URL = process.env.API_URL ?? "http://localhost:4000";

function hasClientSession(request: NextRequest): boolean {
  return (
    request.cookies.has(CLIENT_COOKIE) ||
    request.cookies.has(CLIENT_REFRESH_COOKIE)
  );
}

function hasAdminSession(request: NextRequest): boolean {
  return (
    request.cookies.has(ADMIN_COOKIE) ||
    request.cookies.has(ADMIN_REFRESH_COOKIE)
  );
}

function forwardSetCookies(source: Response, target: NextResponse): void {
  const setCookies =
    typeof source.headers.getSetCookie === "function"
      ? source.headers.getSetCookie()
      : [];

  for (const cookie of setCookies) {
    target.headers.append("Set-Cookie", cookie);
  }
}

function mergeSetCookiesIntoRequestCookie(
  requestCookieHeader: string,
  setCookies: string[],
  audience: "client" | "admin",
): string {
  const accessName = audience === "admin" ? ADMIN_COOKIE : CLIENT_COOKIE;
  const refreshName =
    audience === "admin" ? ADMIN_REFRESH_COOKIE : CLIENT_REFRESH_COOKIE;
  const map = parseCookieHeader(requestCookieHeader);

  for (const setCookie of setCookies) {
    const pair = setCookie.split(";")[0];
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name === accessName || name === refreshName) {
      map.set(name, value);
    }
  }

  return Array.from(map.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function tryRefreshSession(
  request: NextRequest,
  audience: "client" | "admin",
): Promise<NextResponse | null> {
  const refreshCookieName =
    audience === "admin" ? ADMIN_REFRESH_COOKIE : CLIENT_REFRESH_COOKIE;
  const accessCookieName = audience === "admin" ? ADMIN_COOKIE : CLIENT_COOKIE;
  const refreshPath =
    audience === "admin" ? "/admin/auth/refresh" : "/auth/refresh";

  const refreshToken = request.cookies.get(refreshCookieName)?.value;
  const accessToken = request.cookies.get(accessCookieName)?.value;

  if (!refreshToken) {
    return null;
  }

  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return null;
  }

  const refreshResponse = await fetch(`${API_URL}${refreshPath}`, {
    method: "POST",
    headers: {
      Cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!refreshResponse.ok) {
    return null;
  }

  const setCookies =
    typeof refreshResponse.headers.getSetCookie === "function"
      ? refreshResponse.headers.getSetCookie()
      : [];

  const requestHeaders = new Headers(request.headers);
  if (setCookies.length > 0) {
    requestHeaders.set(
      "cookie",
      mergeSetCookiesIntoRequestCookie(
        request.headers.get("cookie") ?? "",
        setCookies,
        audience,
      ),
    );
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  forwardSetCookies(refreshResponse, response);
  return response;
}

/**
 * Login redirect that preserves the original query string in `next`. The 3-D
 * Secure return lands on /beta/checkout/return?tap_id=..., and dropping that
 * parameter would leave the cardholder unable to confirm a charge they paid for.
 */
function clientLoginUrl(request: NextRequest, pathname: string): URL {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/beta";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return loginUrl;
}

async function handleAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const hasSession = hasAdminSession(request);

    if (pathname === "/admin/login") {
      if (hasSession) {
        return NextResponse.redirect(new URL("/admin/overview", request.url));
      }
      return null;
    }

    if (!hasSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const accessToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (accessToken && !isAccessTokenExpired(accessToken)) {
      return null;
    }

    const refreshed = await tryRefreshSession(request, "admin");
    if (!refreshed) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return refreshed;
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  if (pathname.startsWith("/beta")) {
    if (!hasClientSession(request)) {
      return NextResponse.redirect(clientLoginUrl(request, pathname));
    }

    const accessToken = request.cookies.get(CLIENT_COOKIE)?.value;
    if (accessToken && !isAccessTokenExpired(accessToken)) {
      return null;
    }

    const refreshed = await tryRefreshSession(request, "client");
    if (!refreshed) {
      return NextResponse.redirect(clientLoginUrl(request, pathname));
    }
    return refreshed;
  }

  return null;
}

function applyCsp(response: NextResponse, nonce: string): NextResponse {
  response.headers.set("Content-Security-Policy", buildCsp(nonce, sentryConnectSrc()));
  return response;
}

export function middleware(request: NextRequest) {
  const nonce = createCspNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  return handleAuth(request).then((authResponse) => {
    if (authResponse) {
      return applyCsp(authResponse, nonce);
    }
    return applyCsp(
      NextResponse.next({ request: { headers: requestHeaders } }),
      nonce,
    );
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|backend).*)"],
};
