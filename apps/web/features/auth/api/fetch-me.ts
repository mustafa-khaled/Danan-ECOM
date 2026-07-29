import { sendRequest } from "@/shared/lib/send-request";
import type { ClientProfile } from "../types";

export function fetchMe(cookieHeader?: string): Promise<ClientProfile> {
  return sendRequest<ClientProfile>({
    method: "GET",
    url: "/auth/me",
    cookieHeader,
  });
}
