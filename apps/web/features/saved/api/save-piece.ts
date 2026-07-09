import { sendRequest } from "@/shared/lib/send-request";

export function savePiece(pieceId: string): Promise<void> {
  return sendRequest<void>({
    method: "POST",
    url: `/client/saved/${pieceId}`,
  });
}
