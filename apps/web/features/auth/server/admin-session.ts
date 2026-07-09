import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAdminMe } from "../api/fetch-admin-me";
import type { AdminSession } from "../types";

export async function getAdminCookieHeader(): Promise<string | undefined> {
  const store = await cookies();
  const token = store.get("dadan_admin_session")?.value;
  if (!token) return undefined;
  return `dadan_admin_session=${token}`;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieHeader = await getAdminCookieHeader();
  if (!cookieHeader) return null;

  try {
    return await fetchAdminMe(cookieHeader);
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
    return await fetchAdminMe(cookieHeader);
  } catch {
    redirect("/admin/login");
  }
}
