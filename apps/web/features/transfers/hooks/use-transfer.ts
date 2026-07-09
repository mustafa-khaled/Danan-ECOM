import { queryOptions, useQuery } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { fetchTransfer } from "../api/fetch-transfer";
import type { TransferDetail } from "../types";

export const transferQueryOptions = (transferId: string, cookieHeader?: string) =>
  queryOptions({
    queryKey: transfersKeys.detail(transferId),
    queryFn: () => fetchTransfer(transferId, cookieHeader),
  });

export function useTransfer(transferId: string, cookieHeader?: string) {
  return useQuery(transferQueryOptions(transferId, cookieHeader));
}
