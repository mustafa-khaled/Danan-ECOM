import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { confirmTransferRecipient } from "../api/confirm-transfer-recipient";

export function useConfirmTransferRecipient() {
  const queryClient = useQueryClient();
  const {
    mutateAsync: confirmRecipient,
    data,
    isPending,
    error,
  } = useMutation({
    mutationFn: (transferId: string) => confirmTransferRecipient(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });

  return { confirmRecipient, data, isPending, error };
}
