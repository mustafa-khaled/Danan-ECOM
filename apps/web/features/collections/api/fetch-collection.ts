import { sendRequest } from "@/shared/lib/send-request";
import type { CollectionDetail } from "../types";

export function fetchCollection(slug: string, cookieHeader?: string): Promise<CollectionDetail> {
  return sendRequest<CollectionDetail>({
    method: "GET",
    url: `/client/collections/${slug}`,
    cookieHeader,
  });
}
