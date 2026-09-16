"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersKeys } from "@/shared/lib/query-keys";
import { cancelOrder as cancelOrderApi } from "../api/cancel-order";

export function useCancelOrder() {
  const queryClient = useQueryClient();

  const { mutateAsync: cancelOrder, isPending, error } = useMutation({
    mutationFn: (orderId: string) => cancelOrderApi(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });

  return { cancelOrder, isPending, error };
}
