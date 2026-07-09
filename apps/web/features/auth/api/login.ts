import { sendRequest } from "@/shared/lib/send-request";
import type { AdminSession } from "../types";

export function adminLogin(email: string, password: string): Promise<AdminSession> {
  return sendRequest<AdminSession>({
    method: "POST",
    url: "/admin/auth/login",
    body: { email, password },
  });
}
