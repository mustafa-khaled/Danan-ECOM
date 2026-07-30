"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LuxuryButton } from "@/components/ui";
import { useAddToCart } from "@/features/cart";
import { useSavePiece, useUnsavePiece } from "@/features/saved";

interface DesignActionsProps {
  pieceId: string;
  initialSaved?: boolean;
}

export function DesignActions({ pieceId, initialSaved = false }: DesignActionsProps) {
  const router = useRouter();
  const t = useTranslations("piece");
  const common = useTranslations("common");
  const { addToCart, isPending: isAddingToCart, error: addToCartError } = useAddToCart();
  const { savePiece, isPending: isSaving } = useSavePiece();
  const { unsavePiece, isPending: isUnsaving } = useUnsavePiece();
  const [isSaved, setIsSaved] = useState(initialSaved);

  async function handleAddToCart() {
    try {
      await addToCart(pieceId);
      router.push("/beta/cart");
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  async function handleToggleSave() {
    try {
      if (isSaved) {
        await unsavePiece(pieceId);
        setIsSaved(false);
      } else {
        await savePiece(pieceId);
        setIsSaved(true);
      }
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  const error = addToCartError;

  return (
    <div className="flex flex-wrap gap-3">
      <LuxuryButton loading={isAddingToCart} onClick={handleAddToCart}>
        {t("addToCart")}
      </LuxuryButton>
      <LuxuryButton variant="ghost" loading={isSaving || isUnsaving} onClick={handleToggleSave}>
        {isSaved ? t("unsave") : common("save")}
      </LuxuryButton>
      {error ? (
        <p role="alert" className="w-full text-sm text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : t("addToCartError")}
        </p>
      ) : null}
    </div>
  );
}
