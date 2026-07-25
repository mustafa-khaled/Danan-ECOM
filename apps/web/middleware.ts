import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/", "/beta"];

function handleAuth(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const hasAdminSession = request.cookies.has("dadan_admin_session");

    if (pathname === "/admin/login") {
      if (hasAdminSession) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return null;
    }

    if (!hasAdminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return null;
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  if (pathname.startsWith("/beta")) {
    const token = request.cookies.get("dadan_session")?.value;
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/beta";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const authResponse = handleAuth(request);
  if (authResponse) {
    return authResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|backend).*)"],
};
