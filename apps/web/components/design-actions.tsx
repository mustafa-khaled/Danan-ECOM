"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAddToCart } from "@/features/cart";
import { useSavePiece, useUnsavePiece } from "@/features/saved";
import { Button } from "@/components/ui/Button";

interface DesignActionsProps {
  pieceId: string;
  initialSaved?: boolean;
}

export function DesignActions({
  pieceId,
  initialSaved = false,
}: DesignActionsProps) {
  const router = useRouter();
  const t = useTranslations("piece");
  const {
    addToCart,
    isPending: isAddingToCart,
    error: addToCartError,
  } = useAddToCart();
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
    <div className="w-full space-y-3">
      {/* On mobile: 1 column stacked vertically. On sm/lg: 2 columns side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 w-full">
        {/* Primary CTA: Add To Your Collection */}
        <Button
          type="button"
          loading={isAddingToCart}
          onClick={handleAddToCart}
          variant="teal"
          size="lg"
          fullWidth
          iconRight={
            <Image
              src="/shopping.png"
              alt="Shopping Bag"
              width={18}
              height={18}
              className="size-4.5 object-contain"
            />
          }
        >
          {t("addToCollection")}
        </Button>

        {/* Secondary CTA: Add To Favourites List */}
        <Button
          type="button"
          loading={isSaving || isUnsaving}
          onClick={handleToggleSave}
          variant="outline"
          size="lg"
          fullWidth
          iconRight={
            <Image
              src="/heart-fill.png"
              alt="Heart"
              width={18}
              height={18}
              className={`size-4.5 object-contain ${isSaved ? "" : "opacity-90"}`}
            />
          }
        >
          {isSaved ? t("unsave") : t("addToFavourites")}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-ds-error">
          {error instanceof Error ? error.message : t("addToCartError")}
        </p>
      ) : null}
    </div>
  );
}
