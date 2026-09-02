"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys, ordersKeys } from "@/shared/lib/query-keys";
import { confirmCheckout as confirmCheckoutApi } from "../api/confirm-checkout";

export function useConfirmCheckout() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: confirmCheckout,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (tapId: string) => confirmCheckoutApi(tapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });

  return { confirmCheckout, data, isPending, error };
}
