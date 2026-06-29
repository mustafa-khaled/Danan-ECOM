import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchMe, type ClientProfile } from "./api";

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const store = await cookies();
  const token = store.get("dadan_session")?.value;
  if (!token) return undefined;
  return `dadan_session=${token}`;
}

export async function requireClientSession(): Promise<ClientProfile> {
  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    redirect("/");
  }

  try {
    return await fetchMe(cookieHeader);
  } catch {
    redirect("/");
  }
}
