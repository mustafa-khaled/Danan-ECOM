import { sendRequest } from "@/shared/lib/send-request";
import type { CheckoutConfirmation } from "../types";

export function confirmCheckout(tapId: string): Promise<CheckoutConfirmation> {
  return sendRequest<CheckoutConfirmation>({
    method: "POST",
    url: "/client/checkout/confirm",
    body: { tapId },
  });
}
