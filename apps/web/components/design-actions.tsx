"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAddToCart } from "@/features/cart";
import { useSavePiece, useUnsavePiece } from "@/features/saved";

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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Primary: Add To Your Collection */}
        <button
          type="button"
          disabled={isAddingToCart}
          onClick={handleAddToCart}
          className="flex items-center justify-center gap-2 rounded-sm bg-[#4CBEAE] px-4 py-3.5 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isAddingToCart ? (
            "…"
          ) : (
            <>
              <span>{t("addToCollection")}</span>
              <Image
                src="/shopping.png"
                alt="Shopping Bag"
                width={18}
                height={18}
                className="size-4.5 object-contain"
              />
            </>
          )}
        </button>

        {/* Secondary: Add To Favourites List */}
        <button
          type="button"
          disabled={isSaving || isUnsaving}
          onClick={handleToggleSave}
          className="flex items-center justify-center gap-2 rounded-sm border border-border bg-transparent px-4 py-3.5 text-sm font-medium tracking-wide text-(--color-text) transition-colors hover:border-[#4CBEAE] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving || isUnsaving ? (
            "…"
          ) : (
            <>
              <span>{isSaved ? t("unsave") : t("addToFavourites")}</span>
              <Image
                src="/heart-fill.png"
                alt="Heart"
                width={18}
                height={18}
                className={`size-4.5 object-contain ${isSaved ? "" : "opacity-80"}`}
              />
            </>
          )}
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-(--color-ruby)">
          {error instanceof Error ? error.message : t("addToCartError")}
        </p>
      ) : null}
    </div>
  );
}

