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
    <div className="w-full space-y-3">
      {/* On mobile: 1 column stacked vertically. On sm/lg: 2 columns side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 w-full">
        {/* Primary CTA: Add To Your Collection */}
        <button
          type="button"
          disabled={isAddingToCart}
          onClick={handleAddToCart}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[2px] bg-[#4CBEAE] px-4 text-center font-display text-sm font-semibold tracking-normal text-[#2D2321] transition-all hover:bg-[#45B1A1] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
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

        {/* Secondary CTA: Add To Favourites List */}
        <button
          type="button"
          disabled={isSaving || isUnsaving}
          onClick={handleToggleSave}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-[2px] border border-gray-200 bg-white px-4 text-center font-display text-sm font-semibold tracking-normal text-[#2D2321] transition-all hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
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
                className={`size-4.5 object-contain ${isSaved ? "" : "opacity-90"}`}
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


