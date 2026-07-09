import { sendRequest } from "@/shared/lib/send-request";
import type { AdminSession } from "../types";

export function fetchAdminMe(cookieHeader?: string): Promise<AdminSession> {
  return sendRequest<AdminSession>({
    method: "GET",
    url: "/admin/auth/me",
    cookieHeader,
  });
}
