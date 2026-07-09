import { sendRequest } from "@/shared/lib/send-request";

export function confirmTransferSender(transferId: string): Promise<void> {
  return sendRequest<void>({
    method: "POST",
    url: `/client/transfers/${transferId}/confirm-sender`,
  });
}
