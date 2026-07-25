import { sendRequest } from "@/shared/lib/send-request";
import type { ClientProfile } from "../types";

export function fetchProfile(cookieHeader?: string): Promise<ClientProfile> {
  return sendRequest<ClientProfile>({
    method: "GET",
    url: "/client/profile",
    cookieHeader,
  });
}

export function updateProfile(
  data: { phone?: string; locale?: string },
  cookieHeader?: string,
): Promise<ClientProfile> {
  return sendRequest<ClientProfile>({
    method: "PATCH",
    url: "/client/profile",
    body: data,
    cookieHeader,
  });
}
