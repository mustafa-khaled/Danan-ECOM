"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuxuryButton } from "@dadan/ui";
import { addToCart, ApiError, savePiece, unsavePiece } from "../lib/api";

interface DesignActionsProps {
  pieceId: string;
  initialSaved?: boolean;
}

export function DesignActions({ pieceId, initialSaved = false }: DesignActionsProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState<"cart" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAddToCart() {
    setLoading("cart");
    setError(null);
    try {
      await addToCart(pieceId);
      router.push("/cart");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add to cart");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggleSave() {
    setLoading("save");
    setError(null);
    try {
      if (saved) {
        await unsavePiece(pieceId);
        setSaved(false);
      } else {
        await savePiece(pieceId);
        setSaved(true);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update saved");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <LuxuryButton loading={loading === "cart"} onClick={handleAddToCart}>
        Add to Cart
      </LuxuryButton>
      <LuxuryButton variant="ghost" loading={loading === "save"} onClick={handleToggleSave}>
        {saved ? "Unsave" : "Save"}
      </LuxuryButton>
      {error ? (
        <p role="alert" className="w-full text-sm text-[var(--color-ruby)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
