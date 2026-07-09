import { sendRequest } from "@/shared/lib/send-request";

export function adminLogout(cookieHeader?: string): Promise<{ success: boolean }> {
  return sendRequest<{ success: boolean }>({
    method: "POST",
    url: "/admin/auth/logout",
    cookieHeader,
  });
}
