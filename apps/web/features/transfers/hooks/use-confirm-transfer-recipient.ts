import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersKeys } from "@/shared/lib/query-keys";
import { wardrobeKeys } from "@/shared/lib/query-keys";
import { confirmTransferRecipient } from "../api/confirm-transfer-recipient";

export function useConfirmTransferRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transferId: string) => confirmTransferRecipient(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transfersKeys.all });
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });
}
