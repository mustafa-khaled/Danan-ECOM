"use client";

import { useTranslations } from "next-intl";
import { LuxuryButton } from "@/components/ui";
import { useRemoveFromCart } from "@/features/cart";

interface CartItemActionsProps {
  pieceId: string;
}

export function CartItemActions({ pieceId }: CartItemActionsProps) {
  const t = useTranslations("cart");
  const { removeFromCart, isPending, error } = useRemoveFromCart();

  async function handleRemove() {
    try {
      await removeFromCart(pieceId);
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  return (
    <div>
      <LuxuryButton variant="ghost" size="sm" loading={isPending} onClick={handleRemove}>
        {t("remove")}
      </LuxuryButton>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : t("removeError")}
        </p>
      ) : null}
    </div>
  );
}
