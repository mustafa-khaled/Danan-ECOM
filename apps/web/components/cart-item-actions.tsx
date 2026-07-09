"use client";

import { LuxuryButton } from "@/components/ui";
import { useRemoveFromCart } from "@/features/cart";

interface CartItemActionsProps {
  pieceId: string;
}

export function CartItemActions({ pieceId }: CartItemActionsProps) {
  const {
    mutateAsync: removeFromCart,
    isPending,
  } = useRemoveFromCart();

  async function handleRemove() {
    try {
      await removeFromCart(pieceId);
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  return (
    <LuxuryButton variant="ghost" size="sm" loading={isPending} onClick={handleRemove}>
      Remove
    </LuxuryButton>
  );
}
