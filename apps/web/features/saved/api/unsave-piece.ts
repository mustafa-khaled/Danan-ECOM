import { sendRequest } from "@/shared/lib/send-request";

export function unsavePiece(pieceId: string): Promise<void> {
  return sendRequest<void>({
    method: "DELETE",
    url: `/client/saved/${pieceId}`,
  });
}
