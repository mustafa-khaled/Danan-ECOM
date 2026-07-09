import { queryOptions, useQuery } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { fetchTransfers } from "../api/fetch-transfers";
import type { TransferSummary } from "../types";

export const transfersQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: transfersKeys.list(),
    queryFn: () => fetchTransfers(cookieHeader),
  });

export function useTransfers(cookieHeader?: string) {
  return useQuery(transfersQueryOptions(cookieHeader));
}
