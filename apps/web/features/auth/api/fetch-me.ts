import { sendRequest } from "@/shared/lib/send-request";
import type { ClientSession } from "../types";

export function fetchMe(cookieHeader?: string): Promise<ClientSession> {
  return sendRequest<ClientSession>({
    method: "GET",
    url: "/auth/me",
    cookieHeader,
  });
}
