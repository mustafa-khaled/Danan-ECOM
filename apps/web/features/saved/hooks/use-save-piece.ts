import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedKeys } from "@/shared/lib/query-keys";
import { savePiece as savePieceApi } from "../api/save-piece";

export function useSavePiece() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: savePiece,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (pieceId: string) => savePieceApi(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });

  return { savePiece, data, isPending, error };
}
