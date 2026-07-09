import { queryOptions, useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { adminKeys } from "@/shared/lib/query-keys";
import { fetchAdminTransfers } from "../api/fetch-admin-transfers";
import type { Paginated } from "@/shared/types/common";
import type { AdminTransferListItem } from "../types";

export const adminTransfersQueryOptions = (
  page = 1,
  limit = 20,
  status?: string,
  cookieHeader?: string,
) =>
  queryOptions({
    queryKey: adminKeys.transfers(page, limit, status),
    queryFn: () => fetchAdminTransfers(page, limit, status, cookieHeader),
    placeholderData: keepPreviousData,
  });

export function useAdminTransfers(
  page = 1,
  limit = 20,
  status?: string,
  cookieHeader?: string,
) {
  return useQuery(adminTransfersQueryOptions(page, limit, status, cookieHeader));
}
