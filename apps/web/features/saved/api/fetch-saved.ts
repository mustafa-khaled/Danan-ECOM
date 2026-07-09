import { sendRequest } from "@/shared/lib/send-request";
import type { SavedEntry } from "../types";

export function fetchSaved(cookieHeader?: string): Promise<SavedEntry[]> {
  return sendRequest<SavedEntry[]>({
    method: "GET",
    url: "/client/saved",
    cookieHeader,
  });
}
