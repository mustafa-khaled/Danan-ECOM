import { sendRequest } from "@/shared/lib/send-request";
import type { DesignDetail } from "../types";

export function fetchDesign(slug: string, cookieHeader?: string): Promise<DesignDetail> {
  return sendRequest<DesignDetail>({
    method: "GET",
    url: `/client/designs/${slug}`,
    cookieHeader,
  });
}
