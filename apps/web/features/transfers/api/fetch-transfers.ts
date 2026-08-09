import { sendRequest } from "@/shared/lib/send-request";
import type { TransferSummary } from "../types";

export type TransferStatusFilter =
  | "INITIATED"
  | "SENDER_CONFIRMED"
  | "RECIPIENT_CONFIRMED"
  | "DADAN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export function fetchTransfers(
  cookieHeader?: string,
  options?: { status?: TransferStatusFilter },
): Promise<TransferSummary[]> {
  const url = options?.status
    ? `/client/transfers?status=${options.status}`
    : "/client/transfers";
  return sendRequest<TransferSummary[]>({
    method: "GET",
    url,
    cookieHeader,
  });
}
