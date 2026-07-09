import { sendRequest } from "@/shared/lib/send-request";

export function removeFromCart(pieceId: string): Promise<void> {
  return sendRequest<void>({
    method: "DELETE",
    url: `/client/cart/${pieceId}`,
  });
}
