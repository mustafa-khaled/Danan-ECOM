import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/shared/lib/query-keys";
import { ordersKeys } from "@/shared/lib/query-keys";
import { checkout } from "../api/checkout";
import type { CheckoutInput } from "../types";

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => checkout(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
