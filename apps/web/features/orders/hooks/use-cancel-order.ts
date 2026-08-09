"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cancelOrder as cancelOrderApi } from "../api/cancel-order";

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync: cancelOrder, isPending, error } = useMutation({
    mutationFn: (orderId: string) => cancelOrderApi(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
    },
  });

  return { cancelOrder, isPending, error };
}
