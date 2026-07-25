import { sendRequest } from "@/shared/lib/send-request";

export function clientLogout(cookieHeader?: string): Promise<{ success: boolean }> {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: "/auth/logout",
    cookieHeader,
  });
}

export function adminLogout(cookieHeader?: string): Promise<{ success: boolean }> {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: "/admin/auth/logout",
    cookieHeader,
  });
}
