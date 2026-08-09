import { sendRequest } from "@/shared/lib/send-request";
import type { ClientProfile, ProfileSummary } from "../types";

export function fetchProfile(cookieHeader?: string): Promise<ClientProfile> {
  return sendRequest<ClientProfile>({
    method: "GET",
    url: "/client/profile",
    cookieHeader,
  });
}

export function fetchProfileSummary(cookieHeader?: string): Promise<ProfileSummary> {
  return sendRequest<ProfileSummary>({
    method: "GET",
    url: "/client/profile/summary",
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
