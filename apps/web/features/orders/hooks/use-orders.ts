import { queryOptions, useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { ordersKeys } from "@/shared/lib/query-keys";
import { fetchOrders } from "../api/fetch-orders";
import type { Paginated } from "@/shared/types/common";
import type { OrderSummary } from "../types";

export const ordersQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: ordersKeys.list(),
    queryFn: () => fetchOrders(cookieHeader),
    placeholderData: keepPreviousData,
  });

export function useOrders(cookieHeader?: string) {
  return useQuery(ordersQueryOptions(cookieHeader));
}
