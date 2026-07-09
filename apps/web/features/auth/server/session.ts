import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchMe } from "../api/fetch-me";
import type { ClientSession } from "../types";

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const store = await cookies();
  const token = store.get("dadan_session")?.value;
  if (!token) return undefined;
  return `dadan_session=${token}`;
}

const getCachedProfile = cache(async (cookieHeader: string): Promise<ClientSession> => {
  return fetchMe(cookieHeader);
});

export async function requireClientSession(): Promise<ClientSession> {
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
