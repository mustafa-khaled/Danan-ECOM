import { sendRequest } from "@/shared/lib/send-request";
import type { TransferDetail } from "../types";

export function fetchTransfer(transferId: string, cookieHeader?: string): Promise<TransferDetail> {
  return sendRequest<TransferDetail>({
    method: "GET",
    url: `/client/transfers/${transferId}`,
    cookieHeader,
  });
}
