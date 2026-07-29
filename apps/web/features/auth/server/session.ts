import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchMe } from "../api/fetch-me";
import type { ClientProfile } from "../types";
import {
  CLIENT_COOKIE,
  CLIENT_REFRESH_COOKIE,
} from "@/shared/lib/auth-cookies";
import {
  refreshClientSession,
} from "@/shared/lib/refresh-session";
import { ApiError } from "@/shared/lib/send-request";

function buildCookieHeader(
  access?: string,
  refresh?: string,
): string | undefined {
  const parts: string[] = [];
  if (access) parts.push(`${CLIENT_COOKIE}=${access}`);
  if (refresh) parts.push(`${CLIENT_REFRESH_COOKIE}=${refresh}`);
  return parts.length > 0 ? parts.join("; ") : undefined;
}

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const store = await cookies();
  const access = store.get(CLIENT_COOKIE)?.value;
  const refresh = store.get(CLIENT_REFRESH_COOKIE)?.value;
  return buildCookieHeader(access, refresh);
}

const getCachedProfile = cache(async (cookieHeader: string): Promise<ClientProfile> => {
  try {
    return await fetchMe(cookieHeader);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const result = await refreshClientSession(cookieHeader);
      if (result.ok && result.cookieHeader) {
        return fetchMe(result.cookieHeader);
      }
    }
    throw error;
  }
});

export async function requireClientSession(): Promise<ClientProfile> {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    redirect("/beta");
  }

  try {
    return await getCachedProfile(cookieHeader);
  } catch {
    redirect("/beta");
  }
}
