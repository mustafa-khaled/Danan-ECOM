"use client";

import { useRouter } from "next/navigation";
import { LuxuryButton } from "@/components/ui";
import { useAddToCart } from "@/features/cart";
import { useSavePiece, useUnsavePiece } from "@/features/saved";

interface DesignActionsProps {
  pieceId: string;
  initialSaved?: boolean;
}

export function DesignActions({ pieceId, initialSaved = false }: DesignActionsProps) {
  const router = useRouter();
  const {
    mutateAsync: addToCart,
    isPending: isAddingToCart,
    error: addToCartError,
  } = useAddToCart();
  const {
    mutateAsync: savePiece,
    isPending: isSaving,
  } = useSavePiece();
  const {
    mutateAsync: unsavePiece,
    isPending: isUnsaving,
  } = useUnsavePiece();

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
      if (initialSaved) {
        await unsavePiece(pieceId);
      } else {
        await savePiece(pieceId);
      }
    } catch {
      /* error is rendered via the mutation's `error` state */
    }
  }

  const error = addToCartError;

  return (
    <div className="flex flex-wrap gap-3">
      <LuxuryButton loading={isAddingToCart} onClick={handleAddToCart}>
        Add to Cart
      </LuxuryButton>
      <LuxuryButton variant="ghost" loading={isSaving || isUnsaving} onClick={handleToggleSave}>
        {initialSaved ? "Unsave" : "Save"}
      </LuxuryButton>
      {error ? (
        <p role="alert" className="w-full text-sm text-[var(--color-ruby)]">
          {error instanceof Error ? error.message : "Could not add to cart"}
        </p>
      ) : null}
    </div>
  );
}
