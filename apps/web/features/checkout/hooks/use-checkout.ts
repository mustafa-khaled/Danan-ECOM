import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/shared/lib/query-keys";
import { ordersKeys } from "@/shared/lib/query-keys";
import { checkout as checkoutApi } from "../api/checkout";
import type { CheckoutInput } from "../types";

export function useCheckout() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: checkout,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (input: CheckoutInput) => checkoutApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });

  return { checkout, data, isPending, error };
}
