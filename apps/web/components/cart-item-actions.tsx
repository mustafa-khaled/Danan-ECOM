"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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
      <Button variant="ghost" size="sm" loading={isPending} onClick={handleRemove}>
        {t("remove")}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-ds-error font-body">
          {error instanceof Error ? error.message : t("removeError")}
        </p>
      ) : null}
    </div>
  );
}
