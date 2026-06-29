"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuxuryButton } from "@dadan/ui";
import { ApiError, removeFromCart } from "../lib/api";

interface CartItemActionsProps {
  pieceId: string;
}

export function CartItemActions({ pieceId }: CartItemActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      await removeFromCart(pieceId);
      router.refresh();
    } catch (err) {
      console.error(err instanceof ApiError ? err.message : "Remove failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LuxuryButton variant="ghost" size="sm" loading={loading} onClick={handleRemove}>
      Remove
    </LuxuryButton>
  );
}
