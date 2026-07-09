import { queryOptions, useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { adminKeys } from "@/shared/lib/query-keys";
import { fetchAdminOrders } from "../api/fetch-admin-orders";
import type { Paginated } from "@/shared/types/common";
import type { AdminOrderListItem } from "../types";

export const adminOrdersQueryOptions = (
  page = 1,
  limit = 20,
  cookieHeader?: string,
) =>
  queryOptions({
    queryKey: adminKeys.orders(page, limit),
    queryFn: () => fetchAdminOrders(page, limit, cookieHeader),
    placeholderData: keepPreviousData,
  });

export function useAdminOrders(page = 1, limit = 20, cookieHeader?: string) {
  return useQuery(adminOrdersQueryOptions(page, limit, cookieHeader));
}
