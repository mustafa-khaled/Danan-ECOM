import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { cancelTransfer as cancelTransferApi } from "../api/cancel-transfer";

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: cancelTransfer,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (transferId: string) => cancelTransferApi(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });

  return { cancelTransfer, data, isPending, error };
}
