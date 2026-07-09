import { sendRequest } from "@/shared/lib/send-request";

export function respondToTransfer(
  transferId: string,
  action: "accept" | "decline"
): Promise<void> {
  return sendRequest<void>({
    method: "PATCH",
    url: `/client/transfers/${transferId}`,
    body: { action },
  });
}
