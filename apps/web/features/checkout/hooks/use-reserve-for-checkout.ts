import { useMutation } from "@tanstack/react-query";
import { reserveForCheckout as reserveForCheckoutApi } from "../api/reserve";

export function useReserveForCheckout() {
  const {
    mutateAsync: reserveForCheckout,
    isPending,
    error,
  } = useMutation({
    mutationFn: () => reserveForCheckoutApi(),
  });

  return { reserveForCheckout, isPending, error };
}
