"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { unsavePiece as unsavePieceApi } from "../api/unsave-piece";

export function useUnsavePiece() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    mutateAsync: unsavePiece,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (pieceId: string) => unsavePieceApi(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
      router.refresh();
    },
  });

  return { unsavePiece, data, isPending, error };
}
