import { sendRequest } from "@/shared/lib/send-request";
import type { CheckoutInput, CheckoutResponse } from "../types";

export function checkout(body: CheckoutInput): Promise<CheckoutResponse> {
  return sendRequest<CheckoutResponse>({
    method: "POST",
    url: "/client/checkout",
    body,
  });
}
