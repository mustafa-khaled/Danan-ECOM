import { sendRequest } from "@/shared/lib/send-request";
import type { TransferSummary } from "../types";

export function fetchTransfers(cookieHeader?: string): Promise<TransferSummary[]> {
  return sendRequest<TransferSummary[]>({
    method: "GET",
    url: "/client/transfers",
    cookieHeader,
  });
}
