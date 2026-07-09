import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { savePiece } from "../api/save-piece";

export function useSavePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pieceId: string) => savePiece(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}
