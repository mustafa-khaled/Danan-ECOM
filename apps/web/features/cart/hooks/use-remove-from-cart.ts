import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/shared/lib/query-keys";
import { removeFromCart } from "../api/remove-from-cart";
import type { CartItem } from "../types";

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pieceId: string) => removeFromCart(pieceId),
    onMutate: async (pieceId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.all });
      const previous = queryClient.getQueryData<CartItem[]>(cartKeys.all);
      queryClient.setQueryData<CartItem[]>(cartKeys.all, (old) =>
        old?.filter((item) => item.piece?.id !== pieceId),
      );
      return { previous };
    },
    onError: (_err, _pieceId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
