import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAdminMe } from "../api/fetch-admin-me";
import type { AdminSession } from "../types";
import {
  ADMIN_COOKIE,
  ADMIN_REFRESH_COOKIE,
} from "@/shared/lib/auth-cookies";
import { refreshAdminSession } from "@/shared/lib/refresh-session";
import { ApiError } from "@/shared/lib/send-request";

function buildCookieHeader(
  access?: string,
  refresh?: string,
): string | undefined {
  const parts: string[] = [];
  if (access) parts.push(`${ADMIN_COOKIE}=${access}`);
  if (refresh) parts.push(`${ADMIN_REFRESH_COOKIE}=${refresh}`);
  return parts.length > 0 ? parts.join("; ") : undefined;
}

export async function getAdminCookieHeader(): Promise<string | undefined> {
  const store = await cookies();
  const access = store.get(ADMIN_COOKIE)?.value;
  const refresh = store.get(ADMIN_REFRESH_COOKIE)?.value;
  return buildCookieHeader(access, refresh);
}

async function fetchAdminSession(cookieHeader: string): Promise<AdminSession> {
  try {
    return await fetchAdminMe(cookieHeader);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const result = await refreshAdminSession(cookieHeader);
      if (result.ok && result.cookieHeader) {
        return fetchAdminMe(result.cookieHeader);
      }
    }
    throw error;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieHeader = await getAdminCookieHeader();
  if (!cookieHeader) return null;

  try {
    return await fetchAdminSession(cookieHeader);
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const cookieHeader = await getAdminCookieHeader();
  if (!cookieHeader) {
    redirect("/admin/login");
  }

  try {
    return await fetchAdminSession(cookieHeader);
  } catch {
    redirect("/admin/login");
  }
}
