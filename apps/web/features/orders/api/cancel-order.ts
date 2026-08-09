import { sendRequest } from "@/shared/lib/send-request";

export function cancelOrder(orderId: string): Promise<{ success: boolean }> {
  return sendRequest({
    method: "POST",
    url: `/client/orders/${orderId}/cancel`,
  });
}
