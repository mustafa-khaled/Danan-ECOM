import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/shared/lib/query-keys";
import { addToCart as addToCartApi } from "../api/add-to-cart";

export function useAddToCart() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: addToCart,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (pieceId: string) => addToCartApi(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });

  return { addToCart, data, isPending, error };
}
