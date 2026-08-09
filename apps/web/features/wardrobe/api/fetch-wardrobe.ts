import { sendRequest } from "@/shared/lib/send-request";
import type { WardrobePiece } from "../types";

export function fetchWardrobe(
  cookieHeader?: string,
  options?: { limit?: number },
): Promise<WardrobePiece[]> {
  const url = options?.limit
    ? `/client/wardrobe?limit=${options.limit}`
    : "/client/wardrobe";
  return sendRequest<WardrobePiece[]>({
    method: "GET",
    url,
    cookieHeader,
  });
}
