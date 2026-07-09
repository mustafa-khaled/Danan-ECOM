import { sendRequest } from "@/shared/lib/send-request";
import type { CollectionSummary } from "../types";

export function fetchCollections(cookieHeader?: string): Promise<CollectionSummary[]> {
  return sendRequest<CollectionSummary[]>({
    method: "GET",
    url: "/client/collections",
    cookieHeader,
  });
}
