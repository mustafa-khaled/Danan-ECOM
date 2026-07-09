import { sendRequest } from "@/shared/lib/send-request";

export function addToCart(pieceId: string): Promise<void> {
  return sendRequest<void>({
    method: "POST",
    url: "/client/cart",
    body: { pieceId },
  });
}
