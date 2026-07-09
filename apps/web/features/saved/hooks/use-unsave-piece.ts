import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { unsavePiece } from "../api/unsave-piece";

export function useUnsavePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pieceId: string) => unsavePiece(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}
