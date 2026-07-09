import { queryOptions, useQuery } from "@tanstack/react-query";
import { ordersKeys } from "@/shared/lib/query-keys";
import { fetchOrder } from "../api/fetch-order";
import type { OrderDetail } from "../types";

export const orderQueryOptions = (orderId: string, cookieHeader?: string) =>
  queryOptions({
    queryKey: ordersKeys.detail(orderId),
    queryFn: () => fetchOrder(orderId, cookieHeader),
  });

export function useOrder(orderId: string, cookieHeader?: string) {
  return useQuery(orderQueryOptions(orderId, cookieHeader));
}
