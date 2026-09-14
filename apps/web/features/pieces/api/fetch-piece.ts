import { sendRequest } from "@/shared/lib/send-request";
import type { PieceDetail } from "../types";

export function fetchPiece(slug: string, cookieHeader?: string): Promise<PieceDetail> {
  return sendRequest<PieceDetail>({
    method: "GET",
    url: `/client/pieces/${slug}`,
    cookieHeader,
  });
}
