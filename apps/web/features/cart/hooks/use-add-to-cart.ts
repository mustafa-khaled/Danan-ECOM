import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/shared/lib/query-keys";
import { addToCart } from "../api/add-to-cart";

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pieceId: string) => addToCart(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
