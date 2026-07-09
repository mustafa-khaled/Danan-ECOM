import { sendRequest } from "@/shared/lib/send-request";
import type { CheckoutInput } from "../types";

export function checkout(body: CheckoutInput): Promise<{ orderId: string }> {
  return sendRequest<{ orderId: string }>({
    method: "POST",
    url: "/client/checkout",
    body,
  });
}
