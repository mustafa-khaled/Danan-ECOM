import { sendRequest } from "@/shared/lib/send-request";

export function fetchWardrobePiece(pieceId: string, cookieHeader?: string): Promise<Record<string, unknown>> {
  return sendRequest<Record<string, unknown>>({
    method: "GET",
    url: `/client/wardrobe/${pieceId}`,
    cookieHeader,
  });
}
