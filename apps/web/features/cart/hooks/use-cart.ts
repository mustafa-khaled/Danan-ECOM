import { queryOptions, useQuery } from "@tanstack/react-query";
import { cartKeys } from "@/shared/lib/query-keys";
import { fetchCart } from "../api/fetch-cart";
import type { CartItem } from "../types";

export const cartQueryOptions = (cookieHeader?: string) =>
  queryOptions({
    queryKey: cartKeys.all,
    queryFn: () => fetchCart(cookieHeader),
  });

export function useCart(cookieHeader?: string) {
  return useQuery(cartQueryOptions(cookieHeader));
}
